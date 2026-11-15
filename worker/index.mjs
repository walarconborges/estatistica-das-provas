/** API pública de sincronização; o token GitHub existe SOMENTE nos secrets do Worker. */
import {fresh,normalizeState,makeCode} from '../core.mjs';
import {canExplain,contentFingerprint,explanationPath,promptFor,modelResponseText,isDailyLimitError,DEFAULT_AI_MODEL} from './explanations.mjs';
import {appendAutomaticAdaptations} from '../legal-adapt.mjs';
const HOST='https://api.github.com';
const LISTS=['profiles','exams','questions','attempts','simulations','flags'];
const HEAD={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'estatistica-provas-sync'};
const clone=x=>JSON.parse(JSON.stringify(x));
function setup(env){
 if(!env.GITHUB_OWNER||!env.GITHUB_REPO||!env.GITHUB_TOKEN)throw Error('Configure GITHUB_OWNER, GITHUB_REPO e o segredo GITHUB_TOKEN no Cloudflare Worker.');
 return {repo:encodeURIComponent(env.GITHUB_OWNER)+'/'+encodeURIComponent(env.GITHUB_REPO),branch:env.GITHUB_BRANCH||'main'};
}
function encodeText(text){const bytes=new TextEncoder().encode(text);let output='';for(let i=0;i<bytes.length;i+=16384)output+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(output);}
function decodeText(value){return new TextDecoder().decode(Uint8Array.from(atob(String(value).replace(/\s/g,'')),c=>c.charCodeAt(0)));}
async function github(env,path,opts={}){
 const s=setup(env),res=await fetch(HOST+'/repos/'+s.repo+'/'+path,{...opts,headers:{...HEAD,Authorization:'Bearer '+env.GITHUB_TOKEN,...opts.headers}});
 const body=await res.json().catch(()=>({}));return {ok:res.ok,status:res.status,body};
}
async function loadState(env){
 const r=await github(env,'contents/data/state.json?ref='+encodeURIComponent(setup(env).branch));
 if(r.status===404)return {sha:null,state:fresh()};
 if(!r.ok)throw Error('Não foi possível ler o banco do GitHub ('+r.status+').');
 let content=r.body.content;
 if(!content){const b=await github(env,'git/blobs/'+r.body.sha);if(!b.ok)throw Error('Falha na leitura dos dados.');content=b.body.content;}
 return {sha:r.body.sha,state:normalizeState(JSON.parse(decodeText(content)))};
}
async function writeFile(env,path,body,sha,message){
 const request={message,content:encodeText(body),branch:setup(env).branch,...(sha?{sha}:{})};
 const result=await github(env,'contents/'+path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
 if(result.status===409||result.status===422)return false;
 if(!result.ok)throw Error('Falha de gravação no GitHub ('+result.status+').');
 return true;
}
function readRow(value){if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.id!=='string'||value.id.length<3||value.id.length>100)throw Error('Identificador de registro inválido.');return clone(value);}
export function applyDelta(existing,delta){
 const state=normalizeState(clone(existing));if(!delta||typeof delta!=='object')throw Error('Dados de sincronização inválidos.');
 let quantity=0;const newFlags=[];
 for(const type of LISTS){
  const items=delta[type]||[];
  if(!Array.isArray(items)||items.length>250)throw Error('Lote inválido: '+type);
  const found=new Map(state[type].map((row,index)=>[row.id,index]));
  for(const itemRaw of items){
   const item=readRow(itemRaw);
   if((state.tombstones?.[type]||[]).includes(item.id))continue;
   if(type==='questions'&&(state.tombstones?.exams||[]).includes(item.examId))continue;
   if(type==='attempts'&&(state.tombstones?.questions||[]).includes(item.questionId))continue;
   if(type==='flags'&&(state.tombstones?.questions||[]).includes(item.questionId))continue;
   if(type==='simulations'&&item.questionIds?.some(id=>(state.tombstones?.questions||[]).includes(id)))continue;
   if(++quantity>350)throw Error('Lote grande demais.');
   if(found.has(item.id)){
    if(type==='simulations'){
     const old=state.simulations[found.get(item.id)];
     if(old.status!=='pending'||old.profileId!==item.profileId||JSON.stringify(old.questionIds)!==JSON.stringify(item.questionIds))continue;
     const next={...old,answers:{...old.answers,...item.answers}};
     if(item.status==='finished'){next.status='finished';next.finishedAt=item.finishedAt||new Date().toISOString();}
     state.simulations[found.get(item.id)]=next;
    }
    continue; // questões, gabaritos, classificações e sinalizações existentes são imutáveis para participantes
   }
   if(type==='questions'){
    if(item.id.startsWith('cj-'))throw Error('Identificador reservado para adaptação automática.');
    if(!state.exams.some(e=>e.id===item.examId)&&!(delta.exams||[]).some(e=>e.id===item.examId))throw Error('Questão sem prova correspondente.');
    if(state.questions.some(q=>q.code===item.code))item.code=makeCode(state,item,item);
    delete item.adaptation; // Apenas o Worker gera adaptações legais verificadas.
    delete item.originalQuestionId;
    delete item.legalBasis;
    delete item.legalExplanation;
    item.secondary=[];item.aliases=[];if(!['active','annulled','needs-review'].includes(item.status))item.status='needs-review';
   }
   if(type==='flags'){
    if(!state.questions.some(q=>q.id===item.questionId)&&!(delta.questions||[]).some(q=>q.id===item.questionId))throw Error('Sinalização sem questão.');
    item.status='pending';newFlags.push(item);
   }
   if(type==='simulations'||type==='attempts'){
    if(!state.profiles.some(p=>p.id===item.profileId)&&!(delta.profiles||[]).some(p=>p.id===item.profileId))throw Error('Registro sem usuário existente.');
   }
   state[type].push(item);found.set(item.id,state[type].length-1);
  }
 }
 return {state,newFlags};
}
async function commitDelta(env,delta){
 for(let retries=0;retries<5;retries++){
  const {sha,state}=await loadState(env),result=applyDelta(state,delta);
  result.adaptedCount=appendAutomaticAdaptations(result.state).length;
  const next=JSON.stringify(result.state,null,2)+'\n';
  if(next.length>5_000_000)throw Error('O banco compartilhado ultrapassou o limite do protótipo.');
  if(await writeFile(env,'data/state.json',next,sha,'data: sincronização de estudos'))return result;
 }
 throw Error('Conflito ao gravar dados. Tente novamente.');
}
async function commitAutoAdaptations(env){
 for(let retries=0;retries<5;retries++){
  const {sha,state}=await loadState(env);
  const created=appendAutomaticAdaptations(state);
  if(!created.length)return {added:0,total:state.questions.filter(q=>q.originalQuestionId).length};
  const data=JSON.stringify(state,null,2)+'\n';
  if(data.length>5_000_000)throw Error('O banco ultrapassou o limite do protótipo.');
  if(await writeFile(env,'data/state.json',data,sha,'legal: gerar adaptações automáticas Candeias'))
   return {added:created.length,total:state.questions.filter(q=>q.originalQuestionId).length};
 }
 throw Error('Conflito ao armazenar adaptações; tente novamente.');
}

async function createIssue(env,flag,state){
 const q=state.questions.find(x=>x.id===flag.questionId);if(!q)return false;
 const name=state.profiles.find(x=>x.id===flag.profileId)?.name||'Usuário';
 const body='<!-- flag-id:'+flag.id+' -->\n**Questão:** '+q.code+'\n\n**Usuário:** '+name+'\n\n**Tipo:** '+flag.type+'\n\n**Descrição:**\n'+String(flag.note||'').slice(0,1600)+'\n\n**Proposta estruturada:**\n'+JSON.stringify(flag.proposed||{},null,2)+'\n\nSomente o proprietário deve comentar **aprovar** ou **rejeitar** nesta Issue.';
 const r=await github(env,'issues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'[Sinalização] '+q.code+' · '+flag.type,body})});
 return r.ok;
}
function reply(value,status=200,origin='*'){
 return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','X-Content-Type-Options':'nosniff'}});
}
function originFor(req,env){
 const origin=req.headers.get('Origin');
 if(!origin)return '*';
 const allow=String(env.ALLOWED_ORIGINS||'https://walarconborges.github.io').split(',').map(x=>x.trim());
 if(!allow.includes(origin)&&!/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin))throw Error('Origem não autorizada.');
 return origin;
}
async function parseBody(req,max=6_000_000){
 if(Number(req.headers.get('Content-Length')||0)>max)throw Error('Pedido muito grande.');
 const text=await req.text();if(text.length>max)throw Error('Pedido muito grande.');
 try{return JSON.parse(text);}catch{throw Error('JSON inválido.');}
}
async function uploadPDF(req,env){
 const input=await parseBody(req,6_100_000),id=String(input.examId||''),encoded=String(input.base64||'');
 if(!/^[A-Za-z0-9-]{10,100}$/.test(id)||encoded.length>5_700_000)throw Error('Identificador inválido ou PDF acima de 4 MB.');
 let raw;try{raw=atob(encoded);}catch{throw Error('PDF inválido.');}
 if(raw.length>4*1024*1024||raw.slice(0,5)!=='%PDF-')throw Error('PDF inválido ou acima de 4 MB.');
 const path='storage/pdfs/'+id+'.pdf';
 const upload=await github(env,'contents/'+path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'pdf: armazenar prova '+id,content:encoded,branch:setup(env).branch})});
 if(!upload.ok)throw Error('Não foi possível enviar o PDF ao GitHub ('+upload.status+').');
 return {path};
}

/**
 * Modelo executado SOMENTE no servidor. A API aceita ID da questão existente,
 * nunca prompt livre. Cache público reutilizável entre os perfis.
 */
function nextUtcDay(){
 const now=new Date(),tomorrow=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1);
 return new Date(tomorrow).toISOString();
}
async function explanationCache(env,path){
 const r=await github(env,'contents/'+path+'?ref='+encodeURIComponent(setup(env).branch));
 if(r.status===404)return {sha:null,record:null};
 if(!r.ok)throw Error('Não foi possível consultar o cache de explicações ('+r.status+').');
 let raw=r.body.content;
 if(!raw){const blob=await github(env,'git/blobs/'+r.body.sha);if(!blob.ok)throw Error('Falha na leitura da explicação.');raw=blob.body.content;}
 try{return {sha:r.body.sha,record:JSON.parse(decodeText(raw))}}
 catch{return {sha:r.body.sha,record:null}};
}
function explanationReply(record,origin,cached=true){
 return reply({status:record.status||'ready',cached,explanation:record.text||'',model:record.model||'',generatedAt:record.generatedAt||''},200,origin);
}
async function handleExplanation(req,env,origin){
 if(req.method!=='GET'&&req.method!=='POST')return reply({error:'Método não permitido.'},405,origin);
 const input=req.method==='GET'?{questionId:new URL(req.url).searchParams.get('questionId')}:
   await parseBody(req,1024);
 const id=String(input.questionId||'');
 if(!/^[a-zA-Z0-9_-]{3,100}$/.test(id))return reply({error:'Código de questão inválido.'},400,origin);
 const {state}=await loadState(env);
 const q=state.questions.find(item=>item.id===id);
 if(!q)return reply({error:'Questão não encontrada no banco compartilhado.'},404,origin);
 // Explicação normativa fornecida pelo catálogo de dispositivos oficiais:
 // aparece na correção e permanece disponível mesmo sem franquia de IA.
 if(q.status==='active'&&q.originalQuestionId&&q.adaptation?.autoGenerated===true&&q.adaptation.verifiedAnswer===q.answer&&
    q.adaptation.sourceUrl&&q.adaptation.sourceArticle&&q.adaptation.legalReason)
  return reply({status:'ready',cached:true,model:'fundamento-legal',
   explanation:q.adaptation.legalReason+'\nFundamento: '+q.adaptation.law+', '+q.adaptation.sourceArticle+'.\nFonte: '+q.adaptation.sourceUrl,
   legalBasis:{law:q.adaptation.law,article:q.adaptation.sourceArticle,url:q.adaptation.sourceUrl}},200,origin);

 const eligibility=canExplain(q);
 if(!eligibility.ok)return reply({status:'unavailable',reason:eligibility.reason},200,origin);
 const hash=await contentFingerprint(q,x=>crypto.subtle.digest('SHA-256',x));
 const path=explanationPath(q);
 const existing=await explanationCache(env,path);
 const record=existing.record?.fingerprint===hash?existing.record:null;
 if(record?.status==='ready'&&record.text)return explanationReply(record,origin,true);
 if(record?.status==='pending'&&Date.parse(record.retryAt||'')>Date.now())
   return reply({status:'pending',reason:'A explicação está sendo gerada. Consulte novamente em alguns instantes.'},202,origin);
 if(record?.status==='error'&&Date.parse(record.retryAt||'')>Date.now())
   return reply({status:'limited',reason:record.reason||'Não foi possível gerar a explicação.',retryAt:record.retryAt},429,origin);
 if(req.method==='GET')return reply({status:'not-generated'},200,origin);
 if(!env.AI||typeof env.AI.run!=='function')
   return reply({status:'not-configured',reason:'Binding Cloudflare Workers AI não está ativado nesta implantação.'},503,origin);
 const pending={status:'pending',fingerprint:hash,retryAt:new Date(Date.now()+120000).toISOString()};
 const reserved=await writeFile(env,path,JSON.stringify(pending,null,2)+'\n',existing.sha,'ai: reservar explicação '+q.code);
 if(!reserved)return reply({status:'pending',reason:'Outra solicitação já começou a gerar esta explicação.'},202,origin);
 const lock=await explanationCache(env,path);
 try{
  const response=await env.AI.run(DEFAULT_AI_MODEL,{
    messages:promptFor(q),max_tokens:430,temperature:0.15
  });
  const text=modelResponseText(response);
  if(text.length<45)throw Error('A IA retornou uma explicação incompleta.');
  const complete={status:'ready',fingerprint:hash,model:DEFAULT_AI_MODEL,
    generatedAt:new Date().toISOString(),text,revision:1};
  if(!await writeFile(env,path,JSON.stringify(complete,null,2)+'\n',lock.sha,'ai: explicação para '+q.code)){
   const renewed=await explanationCache(env,path);
   if(renewed.record?.status==='ready'&&renewed.record.fingerprint===hash)return explanationReply(renewed.record,origin,true);
   throw Error('Não foi possível armazenar esta explicação. Tente novamente.');
  }
  return explanationReply(complete,origin,false);
 }catch(err){
  const limited=isDailyLimitError(err);
  const reason=limited?'A franquia gratuita do Cloudflare Workers AI foi atingida. As explicações já salvas continuam disponíveis.':
    'Não foi possível gerar uma explicação agora. Tente novamente mais tarde.';
  const errorRecord={status:'error',fingerprint:hash,reason,
    retryAt:limited?nextUtcDay():new Date(Date.now()+120000).toISOString()};
  try{await writeFile(env,path,JSON.stringify(errorRecord,null,2)+'\n',lock.sha,'ai: registrar indisponibilidade temporária');}catch{}
  return reply({status:'limited',reason,retryAt:errorRecord.retryAt},limited?429:503,origin);
 }
}

async function getPDF(req,env){
 const id=new URL(req.url).searchParams.get('examId')||'';
 if(!/^[A-Za-z0-9-]{10,100}$/.test(id))return new Response('PDF inválido.',{status:400});
 const r=await github(env,'contents/storage/pdfs/'+id+'.pdf');
 if(!r.ok)return new Response('PDF não encontrado.',{status:r.status});
 let content=r.body.content;
 if(!content){const blob=await github(env,'git/blobs/'+r.body.sha);if(!blob.ok)return new Response('PDF indisponível.',{status:502});content=blob.body.content;}
 const bytes=Uint8Array.from(atob(content.replace(/\s/g,'')),x=>x.charCodeAt(0));
 return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=120','X-Content-Type-Options':'nosniff'}});
}

export default {async fetch(req,env){
 let origin='*';
 try{
  origin=originFor(req,env);const url=new URL(req.url);
  if(req.method==='OPTIONS')return reply({},200,origin);
  if(req.method==='GET'&&url.pathname==='/api/health')return reply({status:'ok',repo:setup(env).repo,purgeGuard:1},200,origin);
  if(req.method==='GET'&&url.pathname==='/api/state')return reply((await loadState(env)).state,200,origin);
  if(url.pathname==='/api/explanation')return handleExplanation(req,env,origin);
  if(req.method==='POST'&&url.pathname==='/api/auto-adapt')return reply(await commitAutoAdaptations(env),200,origin);
  if(req.method==='POST'&&url.pathname==='/api/upload')return reply(await uploadPDF(req,env),200,origin);
  if(req.method==='GET'&&url.pathname==='/api/file')return getPDF(req,env);
  if(req.method==='POST'&&url.pathname==='/api/merge'){
   const input=await parseBody(req),{state,newFlags,adaptedCount}=await commitDelta(env,input.delta),warnings=[];
   for(const f of newFlags.slice(0,20)){
    try{if(!await createIssue(env,f,state))warnings.push('Não foi possível criar a Issue da sinalização '+f.id);}catch{warnings.push('Não foi possível criar a Issue da sinalização '+f.id);}
   }
   return reply({state,warnings,adaptedCount},200,origin);
  }
  if(req.method==='GET'&&url.pathname==='/api/setup'){
   const workerUrl=url.origin;
   if(!/^https:\/\/[a-z0-9.-]+$/i.test(workerUrl))throw Error('URL do Worker inválida.');
   const old=await github(env,'contents/config.js');
   const newConfig='window.APP_CONFIG = {apiBase: '+JSON.stringify(workerUrl)+'};\n';
   if(old.ok&&decodeText(old.body.content)===newConfig)return reply({status:'already-configured',site:'https://walarconborges.github.io/estatistica-das-provas/'},200,origin);
   if(!await writeFile(env,'config.js',newConfig,old.ok?old.body.sha:null,'config: ativar sincronização entre aparelhos'))throw Error('Conflito na configuração. Tente novamente.');
   return reply({status:'configured',site:'https://walarconborges.github.io/estatistica-das-provas/',message:'A ligação foi enviada ao GitHub Pages. Após a publicação, recarregue o site.'},200,origin);
  }
  return reply({error:'Rota inexistente.'},404,origin);
 }catch(error){return reply({error:error?.message||'Erro inesperado.'},400,origin);}
}};
