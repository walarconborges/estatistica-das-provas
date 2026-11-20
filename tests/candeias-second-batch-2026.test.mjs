import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyForCargo} from '../edital-classification.mjs';
import {PROFESSOR_CARGO_ID} from '../programa-semed-professor.mjs';
const state=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
function exam(id){
 const e=state.exams.find(x=>x.id===id);assert.ok(e);
 return [e,e.questionIds.map(qid=>state.questions.find(q=>q.id===qid))];
}
const hg=exam('sim-chatgpt-candeias-hg-2026-11-20-caderno2');
const news=exam('sim-chatgpt-cmcj-noticias-2026-11-20-bateria2');
test('cadernos têm 10 questões novas cada, numeração 11–20 e gabaritos corretos',()=>{
 for(const [[e,qs],key] of [[hg,'BDAECBDAEC'],[news,'CBDAEBDCAE']]){
  assert.equal(e.banca,'ChatGPT');
  assert.equal(qs.length,10);
  assert.deepEqual(qs.map(q=>q.originalNumber),[11,12,13,14,15,16,17,18,19,20]);
  assert.equal(qs.map(q=>q.answer).join(''),key);
  assert.ok(qs.every(q=>q.stem&&q.options.map(o=>o.letter).join('')==='ABCDE'&&q.options.every(o=>o.text)));
 }
});
test('classificação de HG e notícias respeita origem, edital e fonte externa SINTERO',()=>{
 for(const q of hg[1]){
  assert.equal(q.topic,q.originalNumber<=13?'História de Candeias do Jamari':'Geografia de Candeias do Jamari');
  for(const cargo of ['202','505']){
   const c=classifyForCargo(q,hg[0],cargo);assert.equal(c.status,'dentro');assert.equal(c.topicId,'gerais:1');
  }
 }
 for(const q of news[1]){
  const sind=q.originalNumber===20;
  assert.equal(q.newsSource,sind?'sintero-ro':'cmcj-ro');
  for(const cargo of ['202','505']){
   const c=classifyForCargo(q,news[0],cargo);
   assert.equal(c.status,'dentro');assert.equal(c.topicId,sind?'gerais:0':'gerais:'+(cargo==='202'?6:5));
  }
 }
 for(const [e,qs] of [hg,news])for(const q of qs){
  assert.equal(classifyForCargo(q,e,'240').status,'fora');
  assert.equal(classifyForCargo(q,e,PROFESSOR_CARGO_ID).status,'fora');
 }
});
test('não duplicou códigos nem alterou baterias anteriores',()=>{
 assert.equal(state.questions.length,984);assert.equal(state.exams.length,45);
 assert.equal(new Set(state.questions.map(q=>q.code)).size,984);
 const originalHG=exam('sim-chatgpt-candeias-hg-2026-11-18')[1];
 const originalNews=exam('sim-chatgpt-cmcj-noticias-2026-11-18')[1];
 assert.equal(originalHG.map(q=>q.answer).join(''),'CAEBDBEACD');
 assert.equal(originalNews.map(q=>q.answer).join(''),'BCDAECBDAE');
});
