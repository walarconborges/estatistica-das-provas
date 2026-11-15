import {STORAGE_KEY,newId,fresh,normalizeState,parseExamText,parseKey,inferExamMetadata,classify,repeatedSupportText,addExam,recordAttempt,latestAnswer,outcome,stats,filtered,prioritize,createSimulation,finishSimulation,simulationResult,expire,validAnswer} from './core.mjs';
import {readPdf} from './pdf-import.mjs';
import {chosenAnswerSection,questionIntegrity} from './pdf-layout.mjs';
import {createSyncClient} from './sync-client.mjs';
import {STUDY_CONTEXT,eligibleForList} from './study-context.mjs';

const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(x||0).toLocaleString('pt-BR');
const pct=x=>Number(x||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
const niceDate=x=>x?new Date(x).toLocaleDateString('pt-BR'):'—';
let state;
try{state=normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'))}catch{state=fresh()}
expire(state);
let profileId=null,view='home',selectedSimId=null,currentFilter={studyArea:'candeias'},currentPool=[],limitAvulsas=10,questionSearch='';
let latestImportMessage='';
let statusMessage='';
const explanationsInView=new Map();
const sync=createSyncClient({
 getState:()=>state,
 setState:remote=>{
  state=normalizeState(remote);expire(state);
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
  if(profileId&&!state.profiles.some(p=>p.id===profileId)){profileId=null;showProfilePicker();}
  else if(profileId&&view!=='import')refresh();
  else if(!profileId)showProfilePicker();
 },
 notify:(status,error)=>{
  statusMessage=error||'';
  const label=$('#storage-status');
  if(label)label.textContent=({local:'Modo local',sincronizando:'Sincronizando...',pendente:'Alterações pendentes',sincronizado:'GitHub sincronizado'})[status]||status;
 },
 storage:localStorage,
 endpoint:window.APP_CONFIG?.apiBase||''
});

// Anotações de estudo individuais, sem mudar o gabarito oficial.
const ELIMINATION_STORE='estatistica-provas-eliminadas-v1';
let eliminatedChoices={};
try{const found=JSON.parse(localStorage.getItem(ELIMINATION_STORE)||'{}');if(found&&typeof found==='object'&&!Array.isArray(found))eliminatedChoices=found;}catch{}
function eliminationKey(qid,scope){
 return [profileId||'',scope==='sim'?(selectedSimId||'sim'):'questoes',qid].join(':');
}
function eliminatedLetters(qid,scope){
 const letters=eliminatedChoices[eliminationKey(qid,scope)]||[];
 return Array.isArray(letters)?letters.filter(a=>/^[A-E]$/.test(a)):[];
}
function toggleElimination(qid,letter,scope){
 if(!/^[A-E]$/.test(letter)||!question(qid))return;
 const key=eliminationKey(qid,scope),set=new Set(eliminatedLetters(qid,scope));
 if(set.has(letter))set.delete(letter);else set.add(letter);
 if(set.size)eliminatedChoices[key]=[...set];else delete eliminatedChoices[key];
 try{localStorage.setItem(ELIMINATION_STORE,JSON.stringify(eliminatedChoices))}catch{toast('Não foi possível salvar esta eliminação neste navegador.');}
 const card=document.querySelector('[data-question-card="'+qid+'"]');
 if(!card)return;
 const row=[...card.querySelectorAll('.alternative-row')].find(x=>x.dataset.letter===letter);
 if(!row)return;
 const crossed=set.has(letter);
 row.classList.toggle('is-eliminated',crossed);
 const radio=row.querySelector('input[type=radio]');
 if(radio){radio.disabled=crossed;if(crossed)radio.checked=false;}
 const control=row.querySelector('button[data-action=toggle-eliminate]');
 if(control){
  control.setAttribute('aria-pressed',String(crossed));
  control.setAttribute('aria-label',(crossed?'Restaurar':'Eliminar')+' alternativa '+letter);
  control.title=crossed?'Restaurar alternativa':'Eliminar alternativa';
 }
 if(scope==='sim'&&crossed){
  const simulation=sim(selectedSimId);
  if(simulation?.status==='pending'&&simulation.answers[qid]===letter){
   delete simulation.answers[qid];save();
   const indicator=$('#screen .card-header .muted');
   if(indicator)indicator.textContent=simulation.questionIds.length+' questões · '+Object.values(simulation.answers).filter(validAnswer).length+' com alternativa marcada';
  }
 }
}

function save(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));sync.request();return true}
  catch(e){toast('Armazenamento cheio. Exporte um backup antes de continuar.');console.error(e);return false}
}
function toast(message){const t=$('#toast');t.textContent=message;t.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.style.display='none',4800)}
function me(){return state.profiles.find(p=>p.id===profileId)}
function question(id){return state.questions.find(q=>q.id===id)}
function exam(id){return state.exams.find(e=>e.id===id)}
function sim(id){return state.simulations.find(s=>s.id===id)}
function chooseProfile(id){
  if(!state.profiles.some(p=>p.id===id))return;
  profileId=id;$('#profile-overlay').classList.add('hidden');selectedSimId=null;view='home';refresh();
}
function showProfilePicker(){
  profileId=null;$('#profile-overlay').classList.remove('hidden');
  const el=$('#profile-options');
  el.innerHTML=state.profiles.length?state.profiles.map(p=>`<button type="button" class="profile-option" data-action="choose-profile" data-id="${h(p.id)}"><strong>${h(p.name)}</strong><span>Selecionar</span></button>`).join(''):'<div class="empty">Nenhum perfil criado ainda.</div>';
}
function navigate(where){view=where;selectedSimId=null;refresh();window.scrollTo(0,0)}
function refresh(){
  if(!profileId){showProfilePicker();return}
  $$('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $('#storage-status').textContent=({local:'Modo local',sincronizando:'Sincronizando...',pendente:'Alterações pendentes',sincronizado:'GitHub sincronizado'})[sync.status()]||'Modo local';
  const pending=state.simulations.filter(s=>s.profileId===profileId&&s.status==='pending');
  $('#notices').innerHTML= pending.length?`<div class="notice">Você tem <strong>${pending.length} simulado(s) não respondido(s)</strong> dentro do prazo de 30 dias. <button class="plain" data-action="show-pending">Consultar</button></div>`:'';
  const map={home:homeScreen,import:importScreen,questions:questionsScreen,sim:simScreen,exams:examScreen,stats:statsScreen,flags:flagsScreen,settings:settingsScreen,session:sessionScreen,result:resultScreen};
  $('#screen').innerHTML=(map[view]||homeScreen)();
}
function headline(title,subtitle=''){return `<div class="card-header"><div><h1>${h(title)}</h1>${subtitle?`<p class="muted">${h(subtitle)}</p>`:''}</div></div>`}
function empty(message){return `<div class="empty">${h(message)}</div>`}
function infoTile(value,label){return `<div class="tile"><span class="value">${h(value)}</span><span class="small-muted">${h(label)}</span></div>`}
function btn(action,label,klass='secondary',extra=''){return `<button type="button" class="${klass}" data-action="${action}" ${extra}>${h(label)}</button>`}
function profileName(){return me()?.name||'Usuário'}

let automaticAdaptationBusy=false,automaticAdaptationChecked=false;
async function refreshAutomaticAdaptations(){
 if(!sync.isConfigured()||automaticAdaptationBusy||automaticAdaptationChecked)return;
 automaticAdaptationBusy=true;
 try{
  const response=await fetch(sync.getUrl()+'/api/auto-adapt',{method:'POST',
   headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store'});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'Atualização de legislação indisponível.');
  automaticAdaptationChecked=true;
  if(result.added>0)await sync.sync();
 }catch(error){console.warn('Adaptação automática pendente:',error)}
 finally{automaticAdaptationBusy=false}
}

function explanationBox(qid){
 const entry=explanationsInView.get(qid);
 if(!entry)return '<div class="explanation-box" data-explanation-id="'+h(qid)+'"></div>';
 const status=entry.status||'';
 let body='';
 if(status==='loading')body='<p class="hint">Consultando a explicação...</p>';
 else if(status==='ready')body='<div class="explanation-text">'+h(entry.text||'')+'</div><p class="hint">Explicação de IA para estudo, não substitui o gabarito ou a legislação oficial.</p>'+btn('flag-explanation','Sinalizar explicação incorreta','secondary','data-id="'+h(qid)+'"');
 else if(status==='pending')body='<p class="hint">'+h(entry.reason||'Explicação em geração.')+'</p>'+btn('explain-question','Consultar novamente','secondary','data-id="'+h(qid)+'"');
 else body='<p class="hint">'+h(entry.reason||'Não foi possível explicar a questão.')+'</p>';
 return '<div class="explanation-box" data-explanation-id="'+h(qid)+'">'+body+'</div>';
}
function refreshExplanation(qid){
 for(const el of document.querySelectorAll('[data-explanation-id]'))
  if(el.dataset.explanationId===qid)el.outerHTML=explanationBox(qid);
}
async function showExplanation(qid){
 const q=question(qid);
 if(!q)return;
 const answered=state.attempts.some(a=>a.profileId===profileId&&a.questionId===qid);
 if(!answered){toast('Confira ou finalize a questão antes de pedir a explicação.');return}
 if(!sync.getUrl()){
  explanationsInView.set(qid,{status:'error',reason:'As explicações precisam da conexão Cloudflare. Verifique Dados → Sincronização.'});
  refreshExplanation(qid);return;
 }
 explanationsInView.set(qid,{status:'loading'});refreshExplanation(qid);
 try{
  const origin=sync.getUrl(),query='?questionId='+encodeURIComponent(qid);
  let r=await fetch(origin+'/api/explanation'+query,{cache:'no-store'});
  let data=await r.json();
  if(r.ok&&data.status==='not-generated'){
    r=await fetch(origin+'/api/explanation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:qid})});
    data=await r.json();
  }
  explanationsInView.set(qid,{
   status:data.status==='ready'?'ready':data.status==='pending'?'pending':'error',
   text:data.explanation||'',
   reason:data.reason||data.error||'Não foi possível obter a explicação.'
  });
 }catch(error){
  explanationsInView.set(qid,{status:'error',reason:'Serviço de IA indisponível. Confira a conexão e tente novamente.'});
  console.warn('Falha ao consultar explicação:',error);
 }
 refreshExplanation(qid);
}
function flagExplanation(qid){
 const questionRecord=question(qid);
 if(!questionRecord)return;
 const note=prompt('Qual é o problema na explicação de '+questionRecord.code+'? Ela será enviada para análise no GitHub.','');
 if(note===null||!note.trim())return;
 state.flags.push({id:newId(),profileId,questionId:qid,type:'explanation',note:note.trim().slice(0,1500),
  proposed:{},status:'pending',at:new Date().toISOString()});
 save();toast('Explicação sinalizada para análise.');
}

function homeScreen(){
  const s=stats(state,profileId),pending=state.simulations.filter(x=>x.profileId===profileId&&x.status==='pending');
  return `<div class="between"><div>${headline('Olá, '+profileName(),'Seu histórico e o banco de questões compartilhado.')}</div></div>
  <div class="grid four">
  ${infoTile(n(state.questions.length),'Questões cadastradas')}
  ${infoTile(n(s.correct),'Acertos atuais')}
  ${infoTile(n(s.wrong),'Erros atuais')}
  ${infoTile(pct(s.rate),'Aproveitamento respondido')}
  </div>
  <div class="grid two" style="margin-top:14px">
  <section class="card"><h2>Começar</h2><p>Escolha questões por assunto ou monte um simulado com a quantidade que desejar.</p><div class="actions">${btn('go-questions','Questões','primary')}${btn('go-sim','Criar simulado','secondary')}</div></section>
  <section class="card"><h2>Suas atividades</h2><p>${pending.length} simulado(s) aguardando resposta; ${state.exams.length} prova(s) cadastrada(s).</p><div class="actions">${btn('show-pending','Simulados pendentes')}${btn('go-stats','Minhas estatísticas')}</div></section></div>
  <section class="card"><h2>Sobre os resultados</h2><p>As estatísticas consideram a última resposta válida por questão. Questões em branco não são erros nem acertos e permanecem disponíveis para novos exercícios. Questões anuladas não entram no aproveitamento.</p></section>
  <div class="notice info">O site preserva seus registros neste aparelho e os sincroniza com o GitHub quando o serviço remoto está configurado. Verifique o indicador no topo.</div>`;
}
function importScreen(){
  return `${headline('Importar prova','Selecione os dois PDFs. O site tentará identificar automaticamente os dados da prova.')}
  <form id="import-form" class="card">
    <div class="form-grid">
      <div class="field span-all"><label for="exam-pdf">PDF da prova</label><input id="exam-pdf" name="examPdf" type="file" accept=".pdf,application/pdf" required><p class="hint" id="exam-pdf-info">Selecione o arquivo PDF da prova.</p></div>
      <div class="field span-all"><label for="key-pdf">PDF do gabarito oficial</label><input id="key-pdf" name="keyPdf" type="file" accept=".pdf,application/pdf" required><p class="hint" id="key-pdf-info">Selecione o arquivo PDF do gabarito.</p></div>
    </div>
    <p class="hint">O ano, a banca, o órgão, o título e as classificações serão identificados automaticamente quando possível. Dados não identificados serão sinalizados para conferência.</p>
    <div class="actions"><button type="submit" id="import-submit" class="primary">Importar questões</button></div>
  </form>
  ${latestImportMessage?`<div class="notice info">${h(latestImportMessage)}</div>`:''}`;
}
function availableFilters(){
  const unique=(k)=>[...new Set(state.questions.map(q=>q[k]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
  return {disciplines:unique('discipline'),topics:unique('topic'),years:unique('year'),bancas:unique('banca'),orgaos:unique('orgao')};
}
function selectField(name,label,items,current='',placeholder='Todas'){
  return `<div class="field"><label>${h(label)}</label><select name="${h(name)}"><option value="">${h(placeholder)}</option>${items.map(s=>`<option value="${h(s)}" ${current===s?'selected':''}>${h(s)}</option>`).join('')}</select></div>`;
}
function filterForm(kind='questions'){
  const u=availableFilters();
  const mode=kind==='sim';
  return `<form id="${mode?'generate-form':'filter-form'}" class="card">
  <div class="form-grid">
  ${selectField('discipline','Disciplina',u.disciplines,currentFilter.discipline)}
  ${selectField('topic','Assunto',u.topics,currentFilter.topic)}
  ${selectField('banca','Banca',u.bancas,currentFilter.banca)}
  ${selectField('year','Ano',u.years,currentFilter.year)}
  ${selectField('orgao','Órgão',u.orgaos,currentFilter.orgao)}
  <div class="field"><label>Legislação municipal</label><select name="studyArea"><option value="candeias" ${currentFilter.studyArea!=='original'?'selected':''}>Candeias do Jamari — somente validada</option><option value="original" ${currentFilter.studyArea==='original'?'selected':''}>Prova original, sem adaptação</option></select></div>
  ${selectField('outcome','Meu histórico',[['unanswered','Não respondidas'],['wrong','Erradas'],['correct','Acertadas']].map(x=>x[0]),currentFilter.outcome,'Todas')}
  <div class="field"><label>Situação da questão</label><select name="status"><option value="">Ativas (padrão)</option><option value="all" ${currentFilter.status==='all'?'selected':''}>Todas, incluindo anuladas</option><option value="annulled" ${currentFilter.status==='annulled'?'selected':''}>Somente anuladas</option><option value="outdated" ${currentFilter.status==='outdated'?'selected':''}>Somente desatualizadas</option><option value="needs-review" ${currentFilter.status==='needs-review'?'selected':''}>Necessitam revisão da extração</option></select></div>
  ${mode?`<div class="field"><label>Quantidade de questões</label><input type="number" name="count" min="1" max="1000" value="20" required></div>`:`<div class="field"><label>Mostrar quantas questões?</label><input type="number" name="count" min="1" max="1000" value="${limitAvulsas}" required></div>`}
  ${!mode?`<div class="field span-all"><label>Buscar código permanente</label><input class="code-search" name="code" placeholder="Q2026LPGIBGPSEMED1" value="${h(currentFilter.code||'')}"></div>`:''}
  </div><div class="actions"><button type="submit">${mode?'Criar simulado':'Buscar questões'}</button></div>
  <p class="hint">Questões de legislação são adaptadas automaticamente quando existe correspondência com as normas oficiais de Candeias. Sem correspondência, ficam inválidas para o modo municipal. A prova original é preservada.</p>
  </form>`;
}
function alternatives(q,scope,chosen=''){
 const options=q.options||[];
 if(!options.length)return '<p class="notice">Alternativas não extraídas. Consulte a imagem ou sinalize a questão.</p>';
 const eliminated=new Set(eliminatedLetters(q.id,scope));
 return `<div class="alternatives">${options.map(o=>{
  const crossed=eliminated.has(o.letter);
  return `<div class="alternative-row${crossed?' is-eliminated':''}" data-letter="${h(o.letter)}">
   <label class="alternative">
    <input type="radio" name="resp-${h(q.id)}" data-scope="${scope}" data-qid="${h(q.id)}" value="${h(o.letter)}" ${chosen===o.letter&&!crossed?'checked':''} ${crossed?'disabled':''}>
    <span class="alternative-copy"><strong>${h(o.letter)})</strong> ${h(o.text)}</span>
   </label>
   <button type="button" class="alternative-cross" data-action="toggle-eliminate" data-id="${h(q.id)}" data-letter="${h(o.letter)}" data-scope="${scope}" aria-pressed="${crossed}" aria-label="${crossed?'Restaurar':'Eliminar'} alternativa ${h(o.letter)}" title="${crossed?'Restaurar alternativa':'Eliminar alternativa'}">×</button>
  </div>`;
 }).join('')}</div>`;
}
function legalBasisHtml(q){
 const a=q?.adaptation;
 if(!q?.originalQuestionId||!a?.legalReason||!a?.sourceUrl||!a?.sourceArticle)return '';
 return '<div class="legal-basis">'+
  '<strong>Fundamento legal — '+h(a.law||'Legislação de Candeias do Jamari')+', '+h(a.sourceArticle)+'</strong>'+
  '<p>'+h(a.legalReason)+'</p>'+
  '<a href="'+h(a.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Consultar norma oficial</a>'+
  '<p class="hint">Questão adaptada automaticamente. Encontrou um erro? Sinalize para revisão.</p>'+
  btn('flag-question','Sinalizar erro na adaptação','secondary','data-id="'+h(q.id)+'"')+
  '</div>';
}

function feedback(q,answer){
  if(!validAnswer(answer))return '<span class="badge wait">Não respondida</span>';
  if(q.status==='annulled')return '<span class="badge wait">Questão anulada</span>';
   if(q.status==='outdated')return '<span class="badge wait">Questão desatualizada</span>';
  if(!validAnswer(q.answer))return '<span class="badge wait">Sem gabarito confirmado</span>';
  return answer===q.answer?'<span class="badge good">Acerto</span>':'<span class="badge bad">Erro</span>';
}
function cardQuestion(q,index,scope='single',selected='',previous=null){
  const last=latestAnswer(state,profileId,q.id);
  const label=scope==='sim'?index+1:q.originalNumber||index+1;
  const examTitle=exam(q.examId)?.title||'';
  return `<article class="question" data-question-card="${h(q.id)}">
  <div class="question-head"><div><div class="question-code">${h(q.code)}</div><div class="question-context">Questão ${label} · ${h(q.discipline)} / ${h(q.topic)}</div><details class="question-origin"><summary>Ver origem da questão</summary><div>${h(examTitle)}</div></details></div><div class="chips">${q.status==='annulled'?'<span class="badge wait">Anulada</span>':''}${q.status==='needs-review'?'<span class="badge wait">Revisão da extração</span>':''}${q.status==='outdated'?'<span class="badge wait">Desatualizada</span>':''}${q.originalQuestionId?'<span class="badge good">Adaptada para Candeias</span>':''}${q.confidence==='baixa'?'<span class="badge wait">Classificação incerta</span>':''}</div></div>
  ${q.contextText?`<details class="support-text" ${repeatedSupportText(previous,q)?'':'open'}><summary>${repeatedSupportText(previous,q)?'Ver texto de apoio novamente (já exibido na questão anterior)':'Texto de apoio — questões '+h(q.contextRange?.join(' a ')||'')}</summary><div class="question-body">${h(q.contextText)}</div></details>`:''}
  ${q.visualSegments&&q.pageImage?
    `<div class="question-body">${h(q.visualSegments.beforeText)}</div><img loading="lazy" class="question-img question-figure" src="${h(q.pageImage)}" alt="Figura ou tabela do enunciado"><div class="question-body">${h(q.visualSegments.afterText)}</div>`:
    q.imageOnly&&q.pageImage?
    `<img loading="lazy" class="question-img" src="${h(q.pageImage)}" alt="Enunciado em imagem; alternativas abaixo em texto selecionável">`:
    `<div class="question-body">${h(q.stem||'[Enunciado não extraído]')}</div>${q.pageImage?`<img loading="lazy" class="question-img" src="${h(q.pageImage)}" alt="Recorte do PDF original">`:''}`}
  ${alternatives(q,scope,selected)}
  ${scope==='single'?`<div class="actions">${btn('answer-single','Conferir resposta','primary',`data-id="${h(q.id)}"`)}${last?btn('explain-question','Explicar questão','secondary',`data-id="${h(q.id)}"`):''}${btn('flag-question','Sinalizar problema','secondary',`data-id="${h(q.id)}"`)}${btn('question-log','Histórico','secondary',`data-id="${h(q.id)}"`)}</div>
    <div class="question-feedback">${last?`Última resposta válida: <strong>${h(last.answer)}</strong> — ${feedback(q,last.answer)}`:''}</div><div class="legal-result">${last?legalBasisHtml(q):''}</div>${explanationBox(q.id)}`:''}
  </article>`;
}
function questionsScreen(){
  const count=currentPool.length?currentPool.length:0;
  return `${headline('Questões','Resolva quantas questões desejar, sem precisar montar um simulado.')}
  ${filterForm('questions')}
  <div class="between"><h2>${n(count)} questão(ões) selecionada(s)</h2>${count?btn('print-current','Imprimir seleção'):''}</div>
  ${count?currentPool.map((q,i)=>cardQuestion(q,i,'single','',currentPool[i-1]||null)).join(''):empty(state.questions.length?'Use os filtros acima para consultar as questões.':'O banco de questões ainda está vazio. Importe a primeira prova.')}`;
}
function simScreen(){
  const pending=state.simulations.filter(s=>s.profileId===profileId&&s.status==='pending');
  const finished=state.simulations.filter(s=>s.profileId===profileId&&s.status==='finished').slice(-15).reverse();
  return `${headline('Simulados','Escolha quantidade, disciplina, assunto e seu histórico de respostas.')}
  ${filterForm('sim')}
  <section class="card"><h2>Pendentes (até 30 dias)</h2>
  ${pending.length?pending.map(s=>`<div class="stat-line"><div><strong>${s.questionIds.length} questões</strong><div class="small-muted">Criado em ${niceDate(s.createdAt)} · Expira em ${niceDate(s.expiresAt)}</div></div><div class="row">${btn('open-sim','Responder','primary',`data-id="${h(s.id)}"`)}${btn('mark-print','Corrigir impresso','secondary',`data-id="${h(s.id)}"`)}</div></div>`).join(''):empty('Nenhum simulado pendente.')}
  </section>
  <section class="card"><h2>Concluídos recentemente</h2>
  ${finished.length?finished.map(s=>`<div class="stat-line"><div>${s.questionIds.length} questões · ${niceDate(s.finishedAt)}</div>${btn('see-result','Ver resultado','secondary',`data-id="${h(s.id)}"`)}</div>`).join(''):empty('Nenhum simulado concluído.')}</section>`;
}
function examScreen(){
  return `${headline('Provas completas','Resolva a prova original, na ordem e com a numeração original, ou imprima.')}
  <section class="card">${state.exams.length?state.exams.map(e=>`<div class="stat-line"><div><strong>${h(e.title)}</strong><div class="small-muted">${h(e.year)} · ${h(e.banca)} · ${h(e.orgao)} · ${e.questionIds.length} questões</div></div><div class="row">${btn('start-exam','Resolver','primary',`data-id="${h(e.id)}"`)}${btn('print-exam','Imprimir','secondary',`data-id="${h(e.id)}"`)}${e.pdfPath?btn('open-original-pdf','Abrir PDF original','secondary',`data-id="${h(e.id)}"`):''}</div></div>`).join(''):empty('Nenhuma prova cadastrada.')}</section>`;
}
function statsScreen(){
  const s=stats(state,profileId);
  const block=(title,rows)=>`<section class="card"><h2>${title}</h2>${rows.length?rows.map(r=>`<div class="stat-line"><div style="flex:1;min-width:0"><strong>${h(r.name)}</strong><div class="small-muted">${r.correct} acertos · ${r.wrong} erros · ${r.total} respondidas</div><div class="bar"><i style="width:${r.total?100*r.correct/r.total:0}%"></i></div></div><strong>${pct(r.total?100*r.correct/r.total:0)}</strong></div>`).join(''):empty('Ainda não há respostas para esta categoria.')}</section>`;
  return `${headline('Estatísticas de '+profileName(),'A última resposta válida de cada questão determina a situação atual.')}
  <div class="grid four">${infoTile(n(s.total),'Questões únicas respondidas')}${infoTile(n(s.correct),'Acertos')}${infoTile(n(s.wrong),'Erros')}${infoTile(pct(s.rate),'Aproveitamento')}</div>
  <div class="grid two" style="margin-top:14px">${block('Por disciplina',s.byDiscipline)}${block('Por assunto',s.byTopic)}</div>
  <div class="notice info">Questões em branco não entram em acertos nem em erros; questões anuladas também não entram. Uma classificação secundária aprovada poderá integrar outra estatística de assunto sem duplicar a contagem geral.</div>`;
}
function flagsScreen(){
  const own=state.flags.filter(x=>x.profileId===profileId).slice().reverse();
  return `${headline('Sinalizações','Problemas e sugestões de classificação aguardam avaliação.')}
  <section class="card"><p>Para sinalizar uma questão, procure seu código em <strong>Questões</strong> e use o botão <strong>Sinalizar problema</strong>.</p>
  <p class="hint">Com o GitHub sincronizado, novas sinalizações são encaminhadas para Issues. A alteração só é aplicada depois da aprovação.</p>
  ${own.length?own.map(f=>`<div class="stat-line"><div><strong>${h(question(f.questionId)?.code||'Questão')}</strong><div class="small-muted">${h(f.type)} — ${h(f.note)} · ${niceDate(f.at)}</div></div><span class="badge wait">${h(f.status==='approved'?'Aprovada':f.status==='rejected'?'Rejeitada':'Pendente')}</span></div>`).join(''):empty('Nenhuma sinalização registrada neste perfil.')}</section>`;
}
function settingsScreen(){
  return `${headline('Dados e backup','Ferramentas para preservar os dados durante o período de testes.')}
  <section class="card"><h2>Sincronização entre aparelhos</h2><p>Status: <strong>${h(({local:"Modo local",sincronizando:"Sincronizando",pendente:"Alterações pendentes",sincronizado:"GitHub sincronizado"})[sync.status()])}</strong></p><p class="hint">${h(statusMessage||"Os dados permanecem também neste navegador.")}</p><div class="field"><label>Endereço do serviço Cloudflare Worker</label><input id="sync-url" value="${h(sync.getUrl())}" placeholder="https://estatistica-das-provas-api.sua-conta.workers.dev"></div><div class="actions"><button type="button" class="primary" data-action="save-sync-url">Conectar ao GitHub</button><button type="button" class="secondary" data-action="sync-now">Sincronizar agora</button></div></section><section class="card"><h2>Cópia de segurança do navegador</h2><p>Os dados são preservados neste aparelho. Quando o indicador mostrar “GitHub sincronizado”, também estarão disponíveis no armazenamento compartilhado.</p>
  <div class="actions">${btn('export-json','Exportar backup JSON','primary')}${btn('import-json','Restaurar backup')}</div><input id="restore-input" type="file" accept=".json,application/json" hidden>
  <p class="hint">Ao restaurar um backup, você substitui os dados atualmente armazenados neste navegador.</p></section>
  <section class="card"><h2>Repositório do projeto</h2><a href="https://github.com/walarconborges/estatistica-das-provas" target="_blank" rel="noopener">Abrir código-fonte, documentação e atualizações no GitHub</a></section>`;
}
function sessionScreen(){
  const s=sim(selectedSimId);if(!s)return empty('Simulado não encontrado.');
  const answered=s.questionIds.filter(id=>validAnswer(s.answers[id])).length;
  return `<div class="between"><div>${headline(s.kind==='exam'?'Prova completa':'Simulado em andamento',`${s.questionIds.length} questões · ${answered} com alternativa marcada`)}</div><div class="actions">${btn('print-sim','Imprimir simulado')}${btn('finish-sim','Finalizar','primary')}</div></div>
  <div class="progress-bar"><div style="width:${s.questionIds.length?answered*100/s.questionIds.length:0}%"></div></div>
  <div style="margin-top:17px">${s.questionIds.map((id,i)=>{const q=question(id);return q?cardQuestion(q,i,'sim',s.answers[id]||'',question(s.questionIds[i-1])||null):''}).join('')}</div>
  <div class="actions">${btn('finish-sim','Finalizar simulado','primary')}${btn('go-sim','Voltar aos simulados')}</div>
  <div class="notice info">Você pode concluir sem responder todas as questões. Antes de finalizar, o sistema mostrará uma confirmação. Respostas em branco não alteram suas estatísticas.</div>`;
}
function resultScreen(){
  const s=sim(selectedSimId);if(!s)return empty('Resultado não encontrado.');
  const r=simulationResult(state,s);
  return `${headline('Resultado do simulado','Concluído em '+niceDate(s.finishedAt))}
  <div class="grid four">${infoTile(r.correct,'Acertos')}${infoTile(r.wrong,'Erros')}${infoTile(r.blank,'Em branco')}${infoTile(pct(r.rate),'Aproveitamento das respondidas')}</div>
  <div class="actions" style="margin-bottom:16px">${btn('print-sim','Imprimir questões e gabarito')}${btn('go-sim','Voltar aos simulados')}</div>
  <section class="card"><h2>Correção questão por questão</h2>
  ${s.questionIds.map((id,i)=>{const q=question(id);if(!q)return '';const ans=s.answers[id]||'';return `<div class="result-explanation"><div class="stat-line"><div><div class="question-code">${i+1}. ${h(q.code)}</div><div class="small-muted">Marcada: <strong>${h(ans||'—')}</strong> · Gabarito: <strong>${h(q.answer||'Não definido')}</strong></div></div><div>${feedback(q,ans)}</div></div>${legalBasisHtml(q)}<div class="actions">${btn('explain-question','Explicar questão','secondary',`data-id="${h(q.id)}"`)}${btn('flag-question','Sinalizar problema','secondary',`data-id="${h(q.id)}"`)}</div>${explanationBox(q.id)}</div>`}).join('')}</section>`;
}
function updateQuestionFeedback(qid){
  const el=document.querySelector(`[data-question-card="${qid}"] .question-feedback`);
  const q=question(qid),last=latestAnswer(state,profileId,qid);
  if(el&&q&&last){
   el.innerHTML=`Última resposta válida: <strong>${h(last.answer)}</strong> — ${feedback(q,last.answer)}`;
   const basis=el.closest('[data-question-card]')?.querySelector('.legal-result');
   if(basis)basis.innerHTML=legalBasisHtml(q);
   const actions=el.closest('[data-question-card]')?.querySelector('.actions');
   if(actions&&!actions.querySelector('[data-action="explain-question"]'))
    actions.insertAdjacentHTML('beforeend',btn('explain-question','Explicar questão','secondary',`data-id="${h(q.id)}"`));
  }
}
function formsFilter(form){
  const f=new FormData(form);
  return Object.fromEntries(['discipline','topic','banca','year','orgao','outcome','status','code','studyArea'].map(k=>[k,String(f.get(k)||'')]));
}
async function importData(form){
  const fd=new FormData(form),pdf=fd.get('examPdf'),keyPdf=fd.get('keyPdf');
  if(!(pdf instanceof File)||!pdf.size||!(keyPdf instanceof File)||!keyPdf.size){toast('Selecione o PDF da prova e o PDF do gabarito.');return}
  if(!/\.pdf$/i.test(pdf.name)||!/\.pdf$/i.test(keyPdf.name)){toast('Os dois arquivos devem estar no formato PDF.');return}
  const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='Processando...';
  try{
    const examRead=await readPdf(pdf,{images:true,extractQuestions:true});
    const keyRead=await readPdf(keyPdf,{images:false});
    const meta=inferExamMetadata(examRead.text,pdf.name,keyRead.text,keyPdf.name);
    const selected=chosenAnswerSection(keyRead.text,examRead.text);
    if(selected.error)throw Error(selected.error);
    const key=parseKey(selected.text);
    const parsed=examRead.questions.map(q=>{const category=classify(q.stem,q.heading);if(category.disciplineCode==='CE'&&/ANALISTA DE INFORMÁTICA/i.test(meta.title)){category.discipline='Informática';category.disciplineCode='IN';category.confidence='média';}return {...q,...category};});
    const count=examRead.text.match(/\b(\d{1,3})\s+QUEST[ÕO]ES?\s+OBJETIVAS\b/i);
    const expected=count?Number(count[1]):Object.keys(key).length;
    const problems=questionIntegrity(parsed,key,expected);
    const baseTextMarkers=(examRead.text.match(/(?:LEIA|CONSIDERE)\s+(?:O\s+)?TEXTO\s+PARA\s+RESPONDER/gi)||[]).length;
    if(baseTextMarkers>examRead.contexts.length)problems.push('Um ou mais textos-base não foram associados às questões');
    if(selected.section==='única'&&(keyRead.text.match(/PROVA\s+OBJETIVA/gi)||[]).length>1)problems.push('O gabarito parece reunir vários cargos sem identificação confiável');

    if(meta.missing.length)problems.push('Dados não identificados: '+meta.missing.join(', '));
    for(const q of parsed)if(q.imageOnly&&!q.pageImage)problems.push('Não foi possível gerar a imagem da questão '+q.originalNumber+' (página '+q.sourcePage+'): '+String(q.imageError||'falha desconhecida').slice(0,120));
    if(problems.length){
      latestImportMessage='Importação bloqueada para evitar erros: '+problems.slice(0,8).join('; ')+(problems.length>8?' e outros '+(problems.length-8)+' problema(s).':'');
      toast('Importação não concluída. Confira os problemas identificados.');
      refresh();return;
    }
    const e=addExam(state,meta,parsed,key);
    e.keySection=selected.section;
    e.metadataReview=meta.missing;
     if(pdf instanceof File&&pdf.size&&sync.isConfigured()){
       if(pdf.size>4*1024*1024)toast('PDF acima de 4 MB: o texto será sincronizado, mas o original não.');
       else{
        try{
         const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(pdf);});
         const response=await fetch(sync.getUrl()+'/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({examId:e.id,base64:encoded})});
         const data=await response.json();
         if(!response.ok)throw Error(data.error||'HTTP '+response.status);
         e.pdfPath=data.path;
        }catch(error){toast('O PDF original não foi sincronizado: '+error.message);}
       }
     }
     if(!save()){state.exams=state.exams.filter(x=>x.id!==e.id);state.questions=state.questions.filter(x=>x.examId!==e.id);return}
    latestImportMessage=`${parsed.length} questão(ões) importada(s) em “${meta.title}”. ${Object.keys(key).length} resposta(s) identificada(s) no gabarito. ${meta.missing.length?'Dados não identificados ('+meta.missing.join(', ')+') aguardam conferência. ':''}Confira a extração e as alternativas.`;
    toast('Prova importada.');navigate('exams');
  }catch(err){console.error(err);toast('Não foi possível importar: '+err.message)}
  finally{button.disabled=false;button.textContent='Importar questões'}
}
function downloadFile(text,name,type='application/json'){
  const a=document.createElement('a');const url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function printQuestions(qs,title,options={}){
  const original=!!options.original,answered=options.answers||{},includeKey=options.includeKey!==false;
  const content=qs.map((q,i)=>`<article class="question">
   <div><strong>${original?q.originalNumber:i+1}. ${h(q.code)}</strong></div>
   ${q.contextText&&!repeatedSupportText(qs[i-1],q)?`<p style="white-space:pre-wrap;font-size:9pt">Texto de apoio:\n${h(q.contextText)}</p>`:''}
   ${q.visualSegments&&q.pageImage?
      `<p style="white-space:pre-wrap">${h(q.visualSegments.beforeText)}</p><img style="max-width:100%;max-height:600px;object-fit:contain" src="${h(q.pageImage)}"><p style="white-space:pre-wrap">${h(q.visualSegments.afterText)}</p>`:
      q.imageOnly&&q.pageImage?
      `<img style="max-width:100%;max-height:600px;object-fit:contain" src="${h(q.pageImage)}">`:
      `<p style="white-space:pre-wrap">${h(q.stem||'Questão em imagem')}</p>`}
   ${(q.options||[]).map(o=>`<p style="margin:4px 0">${h(o.letter)}) ${h(o.text)}</p>`).join('')}
  </article>`).join('');
  const sheet=qs.map((q,i)=>`<div style="display:inline-block;width:48%;margin:7px 0">${original?q.originalNumber:i+1}. ( A ) ( B ) ( C ) ( D ) ( E )</div>`).join('');
  const key=qs.map((q,i)=>`<div style="display:inline-block;width:33%;margin:4px 0">${original?q.originalNumber:i+1}. ${h(q.answer||'—')} &nbsp; ${h(q.code)}</div>`).join('');
  const doc=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${h(title)}</title><style>@page{size:A4;margin:1.5cm 1.5cm 1.5cm 2.5cm}body{font:11pt Arial,sans-serif;color:#111}.question{break-inside:avoid;page-break-inside:avoid;margin-bottom:15mm}.page{page-break-before:always}h1{font-size:15pt}h2{font-size:13pt}p{line-height:1.4}</style></head><body><h1>${h(title)}</h1>${content}<section class="page"><h2>Folha de respostas</h2>${sheet}</section>${includeKey?`<section class="page"><h2>Gabarito</h2>${key}</section>`:''}</body></html>`;
  const w=window.open('','_blank');if(!w){toast('Permita janelas pop-up para imprimir.');return}
  w.document.open();w.document.write(doc);w.document.close();w.focus();setTimeout(()=>w.print(),350);
}
function showFlag(qid){
 const q=question(qid);if(!q)return;
 const raw=prompt('Sinalizar '+q.code+'\nTipo: classificação, secundária, gabarito, anulada, desatualizada, extração, adaptação ou outro',q.originalQuestionId?'adaptação':'classificação');
 if(raw===null)return;
 const norm=String(raw).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const type=norm.startsWith('class')?'classification':norm.startsWith('sec')?'secondary':norm.startsWith('gab')?'answer':norm.startsWith('anul')?'annulled':norm.startsWith('desat')?'outdated':norm.startsWith('extr')?'extraction':norm.startsWith('adapt')?'adaptation':'other';
 let proposed={};
 if(type==='classification'||type==='secondary'){
  const disc=prompt('Disciplina sugerida:',q.discipline);if(disc===null)return;
  const topic=prompt('Assunto sugerido:',q.topic);if(topic===null)return;
  if(!disc.trim()||!topic.trim()){toast('Disciplina e assunto são obrigatórios.');return;}
  const dc=prompt('Sigla da disciplina (ex.: LP):',q.disciplineCode||'');if(dc===null)return;
  const tc=prompt('Sigla do assunto (ex.: G):',q.topicCode||'');if(tc===null)return;
  proposed={discipline:disc.trim(),topic:topic.trim(),disciplineCode:dc.trim(),topicCode:tc.trim()};
 }
 if(type==='answer'){
  const answer=prompt('Qual é a alternativa correta? A, B, C, D ou E',q.answer||'');
  if(answer===null)return;
  if(!validAnswer(answer.trim().toUpperCase())){toast('Informe uma alternativa válida.');return;}
  proposed={answer:answer.trim().toUpperCase()};
 }
 if(type==='annulled'||type==='outdated')proposed={status:type};
 const note=prompt('Justifique a sinalização. A alteração depende de aprovação no GitHub.','');
 if(note===null||!note.trim())return;
 state.flags.push({id:newId(),profileId,questionId:qid,type,note:note.trim().slice(0,1500),proposed,status:'pending',at:new Date().toISOString()});
 save();toast('Sinalização registrada. Confira o status de sincronização no topo.');
}
function showLog(qid){
  const q=question(qid),entries=state.attempts.filter(a=>a.questionId===qid&&a.profileId===profileId).slice().reverse();
  alert((q?.code||'Questão')+'\nHistórico de respostas:\n'+(entries.length?entries.map(a=>niceDate(a.at)+' — '+a.answer+' — '+(q?.answer===a.answer?'acerto':'erro')).join('\n'):'Nenhuma resposta registrada.'));
}
function issueInvalid(qid){showFlag(qid)}
function markPrinted(simId){
  const s=sim(simId);if(!s||s.profileId!==profileId||s.status!=='pending')return;
  const text=prompt('Digite o cartão de respostas do simulado, por exemplo:\n1A2B3C4D\nDeixe sem resposta as questões não marcadas.');
  if(text===null)return;
  const key=parseKey(text);
  for(let i=0;i<s.questionIds.length;i++)if(validAnswer(key[i+1]))s.answers[s.questionIds[i]]=key[i+1];
  save();selectedSimId=s.id;view='session';refresh();toast('Respostas lançadas. Confira antes de finalizar.');
}
function answerSingle(qid){
  const q=question(qid);const input=document.querySelector(`[data-question-card="${qid}"] input[type=radio]:checked`);
  if(!q||!input){toast('Marque uma alternativa ou deixe a questão sem responder.');return}
  recordAttempt(state,profileId,qid,input.value);
  save();updateQuestionFeedback(qid);
}
function beginSim(id){const s=sim(id);if(!s||s.profileId!==profileId)return;selectedSimId=id;view=s.status==='finished'?'result':'session';refresh();window.scrollTo(0,0)}
function finishCurrent(){
  const s=sim(selectedSimId);if(!s||s.status!=='pending')return;
  const blanks=s.questionIds.filter(id=>!validAnswer(s.answers[id])).length;
  if(blanks&&!confirm(`Você deixou ${blanks} questão(ões) em branco. Elas não contarão como acertos ou erros. Deseja finalizar mesmo assim?`))return;
  if(!blanks&&!confirm('Finalizar e corrigir este simulado?'))return;
  finishSimulation(state,s);save();view='result';refresh();window.scrollTo(0,0);
}
document.addEventListener('submit',async e=>{
  const form=e.target;
  if(!['profile-form','import-form','filter-form','generate-form'].includes(form.id))return;
  e.preventDefault();
  if(form.id==='profile-form'){
    const name=$('#profile-name').value.trim();
    if(!name)return;
    const old=state.profiles.find(p=>p.name.toLowerCase()===name.toLowerCase());
    if(old){toast('Esse perfil já existe.');return}
    const p={id:newId(),name,createdAt:new Date().toISOString()};state.profiles.push(p);save();$('#profile-name').value='';chooseProfile(p.id);return;
  }
  if(form.id==='import-form'){await importData(form);return}
  currentFilter=formsFilter(form);
  if(currentFilter.studyArea!=='original'&&!automaticAdaptationChecked)await refreshAutomaticAdaptations();
  const beforeTerritory=filtered(state,profileId,currentFilter);
  const candidates=beforeTerritory.filter(q=>eligibleForList(q,exam(q.examId),currentFilter.studyArea||'candeias'));
  const count=Math.max(1,Math.min(1000,Number(new FormData(form).get('count')||10)));
  if(form.id==='filter-form'){
    limitAvulsas=count;currentPool=prioritize(state,profileId,candidates).slice(0,count);refresh();return;
  }
  if(!candidates.length){toast(beforeTerritory.length?'Legislação municipal sem adaptação validada para Candeias. Selecione Prova original para consultá-la.':'Não há questões que correspondam aos filtros.');return}
  const seen=new Set(),picked=[];
  for(const q of prioritize(state,profileId,candidates)){
    const group=q.duplicateGroup||q.id;
    if(seen.has(group))continue;
    seen.add(group);picked.push(q);
    if(picked.length>=count)break;
  }
  const s=createSimulation(state,profileId,picked,{kind:'random'});save();beginSim(s.id);
});
document.addEventListener('change',e=>{
  const input=e.target;
  if(input.matches('#import-form input[type="file"]')){
    const label=document.getElementById(input.name==='examPdf'?'exam-pdf-info':'key-pdf-info');
    if(label)label.textContent=input.files?.[0]?'Selecionado: '+input.files[0].name:'Nenhum PDF selecionado';
    return;
  }
  if(input.matches('input[type=radio][data-scope=sim]')){
    const s=sim(selectedSimId);if(!s||s.status!=='pending')return;
    s.answers[input.dataset.qid]=input.value;save();
    const label=$('#screen .card-header .muted');
    if(label)label.textContent=s.questionIds.length+' questões · '+Object.values(s.answers).filter(validAnswer).length+' com alternativa marcada';
  }
  if(input.id==='restore-input'&&input.files?.[0]){
    if(!confirm('Substituir todos os dados locais pelo backup selecionado?'))return;
    input.files[0].text().then(t=>{
      try{const data=normalizeState(JSON.parse(t));state=data;save();profileId=null;view='home';showProfilePicker();toast('Backup restaurado.')}catch{toast('Arquivo JSON inválido.')}
    });
  }
});
document.addEventListener('click',e=>{
  const button=e.target.closest('button[data-action],button[data-view]');
  if(!button)return;
  if(button.dataset.view){navigate(button.dataset.view);return}
  const action=button.dataset.action,id=button.dataset.id;
  switch(action){
    case 'choose-profile':chooseProfile(id);break;
    case 'go-questions':navigate('questions');break;
    case 'go-sim':navigate('sim');break;
    case 'go-stats':navigate('stats');break;
    case 'show-pending':navigate('sim');break;
    case 'toggle-eliminate':toggleElimination(id,button.dataset.letter,button.dataset.scope);break;
    case 'answer-single':answerSingle(id);break;
    case 'explain-question':showExplanation(id);break;
    case 'flag-explanation':flagExplanation(id);break;
    case 'flag-question':issueInvalid(id);break;
    case 'question-log':showLog(id);break;
    case 'open-sim':case 'see-result':beginSim(id);break;
    case 'finish-sim':finishCurrent();break;
    case 'start-exam':{
      const ex=exam(id);if(!ex)return;
      const qs=ex.questionIds.map(question).filter(Boolean);
      const s=createSimulation(state,profileId,qs,{kind:'exam',examId:ex.id});save();beginSim(s.id);break;
    }
    case 'open-original-pdf':{const ex=exam(id);if(ex?.pdfPath&&sync.getUrl())window.open(sync.getUrl()+'/api/file?examId='+encodeURIComponent(ex.id),'_blank','noopener');else toast('PDF original indisponível neste dispositivo.');break;}
     case 'print-exam':{
      const ex=exam(id);if(ex)printQuestions(ex.questionIds.map(question).filter(Boolean),ex.title,{original:true});break;
    }
    case 'print-current':printQuestions(currentPool,'Questões');break;
    case 'print-sim':{
      const s=sim(selectedSimId);if(s)printQuestions(s.questionIds.map(question).filter(Boolean),'Simulado — '+profileName(),{original:s.kind==='exam',answers:s.answers,includeKey:s.status==='finished'});break;
    }
    case 'mark-print':markPrinted(id);break;
    case 'save-sync-url':{try{sync.configure($('#sync-url').value);toast('Endereço salvo. Verifique o indicador no topo.');}catch(error){toast(error.message);}break;}
     case 'sync-now':sync.sync().then(async ok=>{if(ok)await refreshAutomaticAdaptations();toast(ok?'Dados consultados e sincronizados.':'Não foi possível sincronizar. Confira o endereço e a conexão.')});break;
     case 'export-json':downloadFile(JSON.stringify(state,null,2),'estatistica-das-provas-backup-'+new Date().toISOString().slice(0,10)+'.json');break;
    case 'import-json':$('#restore-input').click();break;
  }
});
$('#switch-user').addEventListener('click',()=>showProfilePicker());
$('#profile-form').addEventListener('submit',()=>{});
showProfilePicker();
save();
if(sync.isConfigured())sync.sync().then(ok=>{if(ok)refreshAutomaticAdaptations()});
window.addEventListener('online',()=>sync.sync());
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&sync.isConfigured())sync.sync();});
setInterval(()=>{if(sync.isConfigured()&&!document.hidden)sync.sync();},45000);
