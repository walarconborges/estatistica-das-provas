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

test('adaptação jurídica é gerada e retorna fundamento legal sem chamar Workers AI',async()=>{
 const prior=globalThis.fetch;globalThis.fetch=githubMock;
 const original={
  id:'local-legal-original',code:'Q2026LELIVUNESPCMVOTORANTIM9',
  examId:'exam-1',year:'2026',banca:'VUNESP',orgao:'CMVOTORANTIM',
  discipline:'Legislação',disciplineCode:'LE',topic:'Legislação institucional',topicCode:'LI',
  stem:'Qual o prazo de validade do concurso público da Câmara?',
  options:'ABCDE'.split('').map(letter=>({letter,text:letter})),
  answer:'A',status:'active'
 };
 const oldAI=env.AI.run;let modelCalls=0;
 env.AI.run=async()=>{modelCalls++;throw Error('Modelo não pode ser usado para fundamentação legal estática.')};
 try{
  const current=JSON.parse(db.get('data/state.json').content);
  current.questions.push(original);
  db.set('data/state.json',{sha:'sha-legal-state',content:JSON.stringify(current)});
  const request=new Request('https://worker.example/api/auto-adapt',{method:'POST',
   headers:{Origin:'https://walarconborges.github.io','Content-Type':'application/json'},body:'{}'});
  const response=await worker.fetch(request,env);
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.added,1);
  const persisted=JSON.parse(db.get('data/state.json').content);
  const adapted=persisted.questions.find(q=>q.originalQuestionId===original.id);
  assert.ok(adapted);
  assert.equal(persisted.questions.find(q=>q.id===original.id).answer,'A');
  assert.equal(adapted.adaptation.sourceArticle,'Art. 7º');
  assert.match(adapted.adaptation.legalReason,/dois anos/);
  const explanation=await call('GET',adapted.id);
  assert.equal(explanation.status,200);
  assert.equal(explanation.body.status,'ready');
  assert.match(explanation.body.explanation,/Resolução nº 173/);
  assert.equal(modelCalls,0,'O fundamento legal não consome franquia de IA.');
  const repeat=await worker.fetch(request.clone(),env);
  assert.equal((await repeat.json()).added,0,'Repetir a sincronização não duplica a adaptação.');
 }finally{env.AI.run=oldAI;globalThis.fetch=prior}
});
