/** API pública de sincronização; o token GitHub existe SOMENTE nos secrets do Worker. */
import {fresh,normalizeState,makeCode} from '../core.mjs';
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
    if(!state.exams.some(e=>e.id===item.examId)&&!(delta.exams||[]).some(e=>e.id===item.examId))throw Error('Questão sem prova correspondente.');
    if(state.questions.some(q=>q.code===item.code))item.code=makeCode(state,item,item);
    item.secondary=[];item.aliases=[];if(!['active','annulled'].includes(item.status))item.status='active';
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
  const {sha,state}=await loadState(env),result=applyDelta(state,delta),next=JSON.stringify(result.state,null,2)+'\n';
  if(next.length>5_000_000)throw Error('O banco compartilhado ultrapassou o limite do protótipo.');
  if(await writeFile(env,'data/state.json',next,sha,'data: sincronização de estudos'))return result;
 }
 throw Error('Conflito ao gravar dados. Tente novamente.');
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
export default {async fetch(req,env){
 let origin='*';
 try{
  origin=originFor(req,env);const url=new URL(req.url);
  if(req.method==='OPTIONS')return reply({},200,origin);
  if(req.method==='GET'&&url.pathname==='/api/health')return reply({status:'ok',repo:setup(env).repo},200,origin);
  if(req.method==='GET'&&url.pathname==='/api/state')return reply((await loadState(env)).state,200,origin);
  if(req.method==='POST'&&url.pathname==='/api/merge'){
   const input=await parseBody(req),{state,newFlags}=await commitDelta(env,input.delta),warnings=[];
   for(const f of newFlags.slice(0,20)){
    try{if(!await createIssue(env,f,state))warnings.push('Não foi possível criar a Issue da sinalização '+f.id);}catch{warnings.push('Não foi possível criar a Issue da sinalização '+f.id);}
   }
   return reply({state,warnings},200,origin);
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
