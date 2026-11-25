import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyForCargo} from '../edital-classification.mjs';
import {PROFESSOR_CARGO_ID} from '../programa-semed-professor.mjs';

const db=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const ids={
 news:'sim-chatgpt-cmcj-noticias-2026-11-21-bateria3',
 hg:'sim-chatgpt-candeias-hg-2026-11-21-caderno3'
};
const get=id=>{
 const exam=db.exams.find(e=>e.id===id);assert.ok(exam,id);
 return [exam,exam.questionIds.map(qid=>db.questions.find(q=>q.id===qid))];
};
test('terceiras baterias contêm dez questões cada, 21–30, alternativas completas e gabaritos do PDF',()=>{
 for(const [id,key] of [[ids.news,'BDAECBDAEC'],[ids.hg,'DBEACADBEC']]){
  const [exam,qs]=get(id);
  assert.equal(exam.banca,'ChatGPT');
  assert.equal(qs.length,10);
  assert.deepEqual(qs.map(q=>q.originalNumber),[21,22,23,24,25,26,27,28,29,30]);
  assert.equal(qs.map(q=>q.answer).join(''),key);
  assert.ok(qs.every(q=>['active','archived'].includes(q.status)&&q.options.map(o=>o.letter).join('')==='ABCDE'&&q.options.every(o=>o.text.length>0)));
 }
});
test('notícias correspondem ao site da Câmara, apenas nos editais de Candeias',()=>{
 const [exam,qs]=get(ids.news);
 for(const q of qs){
  assert.equal(q.newsSource,'cmcj-ro');
  assert.equal(q.disciplineCode,'CG');
  assert.equal(classifyForCargo(q,exam,'202').topicId,'gerais:6');
  assert.equal(classifyForCargo(q,exam,'505').topicId,'gerais:5');
  assert.equal(classifyForCargo(q,exam,'240').status,'fora');
  assert.equal(classifyForCargo(q,exam,PROFESSOR_CARGO_ID).status,'fora');
 }
 for(const n of [23,27]){
  const q=qs.find(q=>q.originalNumber===n);
  assert.match(q.stem,/\nI\./);assert.match(q.stem,/\nII\./);assert.match(q.stem,/\nIII\./);
 }
});
test('História/Geografia municipal nos dois editais pertinentes, sem duplicação dos códigos',()=>{
 const [exam,qs]=get(ids.hg);
 for(const q of qs){
  assert.equal(q.topic,[23,25].includes(q.originalNumber)?'História de Candeias do Jamari':'Geografia de Candeias do Jamari');
  for(const cargo of ['202','505']){
   const classification=classifyForCargo(q,exam,cargo);
   assert.equal(classification.status,'dentro');
   assert.equal(classification.topicId,'gerais:1');
  }
  assert.equal(classifyForCargo(q,exam,'240').status,q.status==='active'?'dentro':'fora');
  assert.equal(classifyForCargo(q,exam,PROFESSOR_CARGO_ID).status,q.status==='active'?'dentro':'fora');
 }
 assert.ok(db.questions.length>=1004);
 assert.ok(db.exams.length>=47);
 assert.equal(new Set(db.questions.map(q=>q.code)).size,db.questions.length);
});
