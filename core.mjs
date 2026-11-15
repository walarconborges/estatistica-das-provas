// Núcleo de dados e regras. Não depende da interface.
export const STORAGE_KEY='estatistica-das-provas-v1';
export const newId=()=>globalThis.crypto?.randomUUID?.() || ('id-'+Date.now()+'-'+Math.random().toString(36).slice(2));
export const fresh=()=>({version:1,profiles:[],exams:[],questions:[],attempts:[],simulations:[],flags:[]});
export function normalizeState(data){
  const base=fresh();
  if(!data || typeof data!=='object')return base;
  for(const k of Object.keys(base))if(Array.isArray(base[k])&&Array.isArray(data[k]))base[k]=data[k];
  return base;
}
export const textNorm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
export function codePart(s,def='XX'){const v=textNorm(s).replace(/[^A-Z0-9]/g,'');return v||def}
export const categories=[
  {match:/L[IÍ]NGUA PORTUGUESA|PORTUGU[EÊ]S/i,name:'Língua Portuguesa',code:'LP'},
  {match:/MATEM[AÁ]TICA/i,name:'Matemática',code:'MA'},
  {match:/RACIOC[IÍ]NIO L[OÓ]GICO/i,name:'Raciocínio Lógico',code:'RL'},
  {match:/INFORM[AÁ]TICA|TECNOLOGIA DA INFORMA[CÇ][AÃ]O/i,name:'Informática',code:'IN'},
  {match:/DIREITO ADMINISTRATIVO/i,name:'Direito Administrativo',code:'DA'},
  {match:/DIREITO CONSTITUCIONAL/i,name:'Direito Constitucional',code:'DC'},
  {match:/LEGISLA[CÇ][AÃ]O/i,name:'Legislação',code:'LE'},
  {match:/CONHECIMENTOS ESPEC[IÍ]FICOS/i,name:'Conhecimentos Específicos',code:'CE'},
  {match:/HIST[OÓ]RIA/i,name:'História',code:'HI'},
  {match:/GEOGRAFIA/i,name:'Geografia',code:'GE'},
  {match:/CI[EÊ]NCIAS/i,name:'Ciências',code:'CI'}
];
export function classify(stem,heading=''){
  const match=categories.find(c=>c.match.test(heading));
  const name=match?.name||'Não classificada',discCode=match?.code||'NC';
  let topic='Geral',topicCode='G';
  const t=textNorm(stem);
  if(discCode==='LP'){
    if(/CONCORDANCIA|REGENCIA|CRASE|PONTUACAO|ORTOGRAFIA|ACENTUACAO|GRAMATICA|SINTAXE|VERBO|SUBSTANTIVO/.test(t)){topic='Gramática';topicCode='G'}
    else if(/INTERPRETACAO|COMPREENS[AÃ]O|IDEIA CENTRAL|TEXTO/.test(t)){topic='Interpretação de texto';topicCode='IT'}
  }else if(discCode==='MA'){
    if(/PORCENTAGEM|PERCENTUAL|%/.test(t)){topic='Porcentagem';topicCode='P'}
    else if(/FRACAO|DENOMINADOR/.test(t)){topic='Frações';topicCode='F'}
    else if(/EQUACAO/.test(t)){topic='Equações';topicCode='E'}
  }else if(discCode==='IN'){
    if(/EXCEL|PLANILHA|CALC/.test(t)){topic='Planilhas eletrônicas';topicCode='PE'}
    else if(/WORD|EDITOR DE TEXTO/.test(t)){topic='Editores de texto';topicCode='ET'}
    else if(/INTERNET|NAVEGADOR|E.MAIL/.test(t)){topic='Internet';topicCode='WEB'}
  }
  return {discipline:name,disciplineCode:discCode,topic,topicCode,confidence:match?'média':'baixa'};
}
export function parseExamText(input){
  const lines=String(input||'').replace(/\r/g,'').split('\n');
  const questions=[];let current=null,heading='';
  const qre=/^(?:(?:QUEST[AÃ]O|QUESTAO|Q)\s*)?(\d{1,3})\s*[).:\-]\s*(.*)$/i;
  const are=/^\s*(?:\(([A-E])\)|([A-E])\s*[).:\-])\s*(.*)$/i;
  function finish(){
    if(!current)return;
    current.stem=current.stem.join('\n').trim();
    current.options=current.options.filter(a=>a.text.trim());
    if(current.stem || current.pageImage) questions.push({...current,...classify(current.stem,current.heading)});
  }
  for(const line of lines){
    const trimmed=line.trim();
    if(!trimmed)continue;
    if(categories.some(c=>c.match.test(trimmed))&&trimmed.length<85&&!/^\d/.test(trimmed)&&!current?.options?.length){heading=trimmed;continue}
    if(categories.some(c=>c.match.test(trimmed))&&trimmed.length<80&&!/^\d/.test(trimmed)&&current?.options?.length){finish();current=null;heading=trimmed;continue}
    const qm=trimmed.match(qre);
    if(qm){
      finish();current={originalNumber:Number(qm[1]),stem:[qm[2]||''],options:[],heading};
      continue;
    }
    if(!current)continue;
    const am=trimmed.match(are);
    if(am){current.options.push({letter:am[1]||am[2],text:am[3]||''});continue}
    if(current.options.length)current.options.at(-1).text+='\n'+trimmed;
    else current.stem.push(trimmed);
  }
  finish();
  return questions.filter(q=>q.originalNumber>0);
}
export function parseKey(raw){
  const out={};const src=textNorm(raw);
  const re=/(\d{1,3})\s*(?:[.):-]\s*)?([A-E]|CERTO|ERRADO|C|E|ANULADA|ANULADO|X)/g;
  for(const m of src.matchAll(re)){
    let a=m[2];if(a==='CERTO')a='C';if(a==='ERRADO')a='E';if(['ANULADA','ANULADO','X'].includes(a))a='X';
    out[Number(m[1])]=a;
  }
  return out;
}
export function sameQuestion(a,b){
  const opts=q=>(q.options||[]).map(o=>textNorm(o.text)).sort().join('¶');
  // A mesma imagem precisa coincidir; não basta o tema.
  return textNorm(a.stem)===textNorm(b.stem)&&opts(a)===opts(b)&&String(a.pageImage||'')===String(b.pageImage||'');
}
export function makeCode(state,meta,q){
  const prefix='Q'+codePart(meta.year,'0000')+codePart(q.disciplineCode,'NC')+codePart(q.topicCode,'G')+codePart(meta.bancaCode||meta.banca,'BANCA')+codePart(meta.orgaoCode||meta.orgao,'ORGAO');
  let n=1;const used=new Set(state.questions.map(x=>x.code));
  while(used.has(prefix+n))n++;
  return prefix+n;
}
export function addExam(state,meta,parsed,key={}){
  const exam={id:newId(),title:meta.title||'Prova sem título',year:String(meta.year||''),banca:String(meta.banca||''),bancaCode:codePart(meta.bancaCode||meta.banca,'BANCA'),orgao:String(meta.orgao||''),orgaoCode:codePart(meta.orgaoCode||meta.orgao,'ORGAO'),createdAt:new Date().toISOString(),questionIds:[]};
  for(const item of parsed){
    const equivalent=state.questions.find(x=>sameQuestion(x,item));
    const q={...item,id:newId(),examId:exam.id,code:'',year:exam.year,banca:exam.banca,orgao:exam.orgao,answer:key[item.originalNumber]||'',status:key[item.originalNumber]==='X'?'annulled':'active',secondary:[],aliases:[],duplicateGroup:equivalent?.duplicateGroup||equivalent?.id||null};
    if(equivalent&&!equivalent.duplicateGroup)equivalent.duplicateGroup=equivalent.id;
    q.code=makeCode(state,exam,q);
    state.questions.push(q);exam.questionIds.push(q.id);
  }
  state.exams.push(exam);return exam;
}
export function validAnswer(answer){return /^[A-E]$/.test(String(answer||'').toUpperCase())}
export function latestAnswer(state,profileId,questionId){
  for(let i=state.attempts.length-1;i>=0;i--){
    const a=state.attempts[i];
    if(a.profileId===profileId&&a.questionId===questionId&&validAnswer(a.answer))return a;
  }
  return null;
}
export function outcome(state,profileId,q){
  if(q.status==='annulled')return'annulled';
  if(q.status==='outdated')return'outdated';
  const a=latestAnswer(state,profileId,q.id);
  if(!a)return'unanswered';
  if(!validAnswer(q.answer))return'no-key';
  return a.answer===q.answer?'correct':'wrong';
}
export function recordAttempt(state,profileId,qid,answer,simId=''){
  if(!validAnswer(answer))return false;
  state.attempts.push({id:newId(),profileId,questionId:qid,answer,simulationId:simId,at:new Date().toISOString()});return true;
}
export function stats(state,profileId){
  const items=state.questions.filter(q=>q.status==='active');
  const done=items.map(q=>({q,r:outcome(state,profileId,q)})).filter(x=>x.r==='correct'||x.r==='wrong');
  const correct=done.filter(x=>x.r==='correct').length,wrong=done.length-correct;
  const group=(kind)=>{
    const map=new Map();
    for(const {q,r} of done){
      const values=kind==='discipline'?[q.discipline,...(q.secondary||[]).map(s=>s.discipline)]:[[q.discipline,q.topic].join(' / '),...(q.secondary||[]).map(s=>[s.discipline,s.topic].join(' / '))];
      for(const value of new Set(values)){
        const item=map.get(value)||{name:value,correct:0,wrong:0,total:0};
        item.total++;item[r]++;map.set(value,item);
      }
    }
    return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  };
  return {total:done.length,correct,wrong,rate:done.length?correct/done.length*100:0,byDiscipline:group('discipline'),byTopic:group('topic')};
}
export function filtered(state,profileId,f={}){
  let result=state.questions.filter(q=>{
    if(f.examId&&q.examId!==f.examId)return false;
    if(f.year&&q.year!==f.year)return false;
    if(f.banca&&q.banca!==f.banca)return false;
    if(f.orgao&&q.orgao!==f.orgao)return false;
    if(f.code&&![q.code,...(q.aliases||[])].some(c=>c.includes(f.code.toUpperCase())))return false;
    const types=[{discipline:q.discipline,topic:q.topic},...(q.secondary||[])];
    if(f.discipline&&!types.some(x=>x.discipline===f.discipline))return false;
    if(f.topic&&!types.some(x=>x.topic===f.topic))return false;
    if(f.status&&f.status!=='all'&&q.status!==f.status)return false;
    if(!f.status&&q.status!=='active')return false;
    if(f.outcome&&f.outcome!=='all'&&outcome(state,profileId,q)!==f.outcome)return false;
    return true;
  });
  return result;
}
export function prioritize(state,profileId,qs){
  const shuffled=[...qs];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
  return shuffled.sort((a,b)=>{
    const rank=q=>{const r=outcome(state,profileId,q);return r==='unanswered'?0:r==='wrong'?1:2};
    return rank(a)-rank(b);
  });
}
export function createSimulation(state,profileId,questions,options={}){
  const now=new Date(),examId=options.examId||'';
  const sim={id:newId(),profileId,examId,kind:options.kind||'random',createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+30*86400000).toISOString(),status:'pending',questionIds:questions.map(q=>q.id),answers:{},finishedAt:null};
  state.simulations.push(sim);return sim;
}
export function finishSimulation(state,sim){
  if(sim.status!=='pending')return;
  sim.status='finished';sim.finishedAt=new Date().toISOString();
  for(const qid of sim.questionIds)recordAttempt(state,sim.profileId,qid,sim.answers[qid],sim.id);
}
export function simulationResult(state,sim){
  let correct=0,wrong=0,blank=0,annulled=0;
  for(const id of sim.questionIds){
    const q=state.questions.find(q=>q.id===id);
    if(!q)continue;
    if(q.status==='annulled'||q.status==='outdated'){annulled++;continue}
    const answer=sim.answers[id];
    if(!validAnswer(answer)){blank++;continue}
    if(answer===q.answer)correct++;else wrong++;
  }
  const answered=correct+wrong;
  return {correct,wrong,blank,annulled,answered,total:sim.questionIds.length,rate:answered?correct/answered*100:0};
}
export function expire(state){
  const now=Date.now();
  for(const sim of state.simulations)if(sim.status==='pending'&&new Date(sim.expiresAt).getTime()<now){sim.status='expired';sim.answers={};}
}

/**
 * Extrai informações de identificação da capa, cabeçalho e nomes dos PDFs.
 * Nunca supõe banca/órgão/ano sem encontrar indícios textuais.
 * Dados ausentes usam NI/0000 e são marcados para conferência.
 */
export function inferExamMetadata(examText='',examFilename='',keyText='',keyFilename=''){
 const filename=String(examFilename||''),head=String(examText||'').slice(0,7000);
 const keyHead=String(keyText||'').slice(0,1300);
 const raw=[filename,head,String(keyFilename||''),keyHead].join('\n');
 const source=textNorm(raw);
 const preferredYear=textNorm(filename+' '+head.slice(0,1500));
 const years=[...preferredYear.matchAll(/\b(?:19|20)\d{2}\b/g)].map(x=>x[0]);
 const year=years.find(x=>Number(x)>=1980&&Number(x)<=new Date().getFullYear()+2)||'0000';
 const bancas=[
  ['CEBRASPE',/\bCEBRASPE\b|\bCESPE\b/],
  ['IBGP',/\bIBGP\b|INSTITUTO BRASILEIRO DE GESTAO E PESQUISA/],
  ['VUNESP',/\bVUNESP\b|FUNDACAO VUNESP/],
  ['FGV',/\bFGV\b|FUNDACAO GETULIO VARGAS/],
  ['FCC',/\bFCC\b|FUNDACAO CARLOS CHAGAS/],
  ['IBFC',/\bIBFC\b|INSTITUTO BRASILEIRO DE FORMACAO E CAPACITACAO/],
  ['IDCAP',/\bIDCAP\b/],
  ['FUNDEP',/\bFUNDEP\b/],
  ['CONSULPLAN',/\bCONSULPLAN\b/],
  ['AOCP',/\bAOCP\b/],
  ['IBADE',/\bIBADE\b/],
  ['IDECAN',/\bIDECAN\b/],
  ['QUADRIX',/\bQUADRIX\b/],
  ['UNOCHAPECO',/\bUNOCHAPECO\b/],
  ['FURB',/\bFURB\b/],
  ['FAUEL',/\bFAUEL\b/]
 ];
 const orgaos=[
  ['SEMUSA',/\bSEMUSA\b|SECRETARIA MUNICIPAL DE SAUDE/],
  ['SEMED',/\bSEMED\b|SECRETARIA MUNICIPAL DE EDUCACAO/],
  ['SEDUC',/\bSEDUC\b|SECRETARIA DE ESTADO DA EDUCACAO/],
  ['IFRO',/\bIFRO\b|INSTITUTO FEDERAL DE RONDONIA/],
  ['ALE-RO',/\bALE[\s-]?RO\b|ASSEMBLEIA LEGISLATIVA DO ESTADO DE RONDONIA/],
  ['TJRO',/\bTJ[\s-]?RO\b|TRIBUNAL DE JUSTICA DO ESTADO DE RONDONIA/],
  ['MPRO',/\bMP[\s-]?RO\b|MINISTERIO PUBLICO DO ESTADO DE RONDONIA/],
  ['TCE-RO',/\bTCE[\s-]?RO\b|TRIBUNAL DE CONTAS DO ESTADO DE RONDONIA/],
  ['CMPV',/\bCMPV\b|CAMARA MUNICIPAL DE PORTO VELHO/],
  ['IPAM',/\bIPAM\b/],
  ['UERN',/\bUERN\b/],
  ['IFSP',/\bIFSP\b/]
 ];
 const find=items=>items.find(([,p])=>p.test(source))?.[0]||'NI';
 const banca=find(bancas),orgao=find(orgaos);
 const missing=[...(year==='0000'?['ano']:[]),...(banca==='NI'?['banca']:[]),...(orgao==='NI'?['órgão']:[])];
 const basename=filename.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().slice(0,90);
 const title=[year==='0000'?'Ano não identificado':year,banca==='NI'?'Banca não identificada':banca,orgao==='NI'?'Órgão não identificado':orgao,basename||'Prova importada'].join(' — ');
 return {title,year,banca,orgao,missing};
}
