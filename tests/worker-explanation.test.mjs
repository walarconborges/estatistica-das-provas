import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';
import {fresh} from '../core.mjs';

const exQuestion=(id,stem='Qual alternativa está correta?')=>({
 id,code:'Q2026LP'+id,examId:'exam-1',year:'2026',banca:'VUNESP',
 orgao:'CMVOTORANTIM',discipline:'Língua Portuguesa',topic:'Gramática',
 stem,options:'ABCDE'.split('').map(letter=>({letter,text:'Resposta '+letter})),
 answer:'B',status:'active'
});
const state=fresh();
state.exams.push({id:'exam-1',title:'Prova modelo',questionIds:['q-1','q-2']});
state.questions.push(exQuestion('q-1'),exQuestion('q-2'));
const encoded=s=>Buffer.from(s).toString('base64');
const db=new Map([['data/state.json',{sha:'first-state-sha',content:JSON.stringify(state)}]]);
let count=0;
function githubMock(url,request={}){
 const u=new URL(url),path=decodeURIComponent(u.pathname.split('/contents/')[1]||'');
 if(u.hostname!=='api.github.com'||!path)throw Error('Chamada externa inesperada: '+url);
 const saved=db.get(path);
 if((request.method||'GET')==='GET'){
  if(!saved)return Promise.resolve(Response.json({message:'Not Found'},{status:404}));
  return Promise.resolve(Response.json({sha:saved.sha,content:encoded(saved.content)}));
 }
 if(request.method==='PUT'){
  const payload=JSON.parse(request.body);
  if(saved?.sha!==payload.sha&&!(saved===undefined&&payload.sha===undefined))
   return Promise.resolve(Response.json({message:'Conflict'},{status:409}));
  const content=Buffer.from(payload.content,'base64').toString('utf8');
  db.set(path,{sha:'sha-'+(++count),content});
  return Promise.resolve(Response.json({content:{sha:db.get(path).sha}},{status:200}));
 }
 throw Error('Método inesperado');
}
const env={
 GITHUB_OWNER:'tester',GITHUB_REPO:'repo',GITHUB_TOKEN:'secret',GITHUB_BRANCH:'main',
 ALLOWED_ORIGINS:'https://walarconborges.github.io',
 AI:{run:async()=>({response:'A alternativa B é a correta porque atende ao conteúdo exigido. As demais alternativas não cumprem o critério do enunciado.'})}
};
async function call(method,id){
 const url='https://worker.example/api/explanation'+(method==='GET'?'?questionId='+id:'');
 const request=new Request(url,{method,headers:{Origin:'https://walarconborges.github.io',...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify({questionId:id})}:{})});
 const response=await worker.fetch(request,env);
 return {status:response.status,body:await response.json()};
}
test('primeira explicação é gerada, armazenada e reutilizada sem outra chamada ao modelo',async()=>{
 const old=globalThis.fetch;globalThis.fetch=githubMock;
 let aiCount=0;
 env.AI.run=async()=>{aiCount++;return {response:'A alternativa B é a correta porque atende ao critério do enunciado; as demais opções não estão de acordo com a regra solicitada.'}};
 try{
  const initial=await call('GET','q-1');
  assert.equal(initial.body.status,'not-generated');
  const first=await call('POST','q-1');
  assert.equal(first.status,200);
  assert.equal(first.body.status,'ready');
  assert.equal(first.body.cached,false);
  assert.equal(aiCount,1);
  const second=await call('GET','q-1');
  assert.equal(second.status,200);
  assert.equal(second.body.cached,true);
  assert.equal(aiCount,1);
  assert.equal(state.questions.length,2,'A IA não altera questões ou gabaritos.');
  assert.ok(db.has('data/explanations/q-1.json'));
 }finally{globalThis.fetch=old}
});
test('limite gratuito não modifica questões e retorna aviso sem cobrança',async()=>{
 const old=globalThis.fetch;globalThis.fetch=githubMock;
 env.AI.run=async()=>{throw Error('Quota exceeded: neurons limit')};
 try{
  const failed=await call('POST','q-2');
  assert.equal(failed.status,429);
  assert.equal(failed.body.status,'limited');
  assert.match(failed.body.reason,/franquia gratuita/);
  assert.equal(state.questions.length,2);
  const cached=await call('GET','q-1');
  assert.equal(cached.body.status,'ready');
 }finally{globalThis.fetch=old}
});
