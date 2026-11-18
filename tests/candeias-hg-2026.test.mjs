import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyForCargo} from '../edital-classification.mjs';
import {PROFESSOR_CARGO_ID} from '../programa-semed-professor.mjs';
const db=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const exam=db.exams.find(e=>e.id==='sim-chatgpt-candeias-hg-2026-11-18');
const questions=exam?.questionIds.map(id=>db.questions.find(q=>q.id===id))||[];
test('PDF autoral: dez questões e gabarito exato na ordem',()=>{
 assert.equal(questions.length,10);
 assert.equal(questions.map(q=>q.answer).join(''),'CAEBDBEACD');
 assert.deepEqual(questions.map(q=>q.originalNumber),[1,2,3,4,5,6,7,8,9,10]);
 assert.ok(questions.every(q=>q.options.length===5&&q.options.map(o=>o.letter).join('')==='ABCDE'));
 assert.ok(questions.every(q=>q.sourceType==='chatgpt-candeias-hg-simulado'&&q.banca==='ChatGPT'));
 assert.ok(questions.slice(0,5).every(q=>q.topic==='História de Candeias do Jamari'));
 assert.ok(questions.slice(5).every(q=>q.topic==='Geografia de Candeias do Jamari'));
 assert.match(questions[4].stem,/\nII\./);
});
test('classificação por edital limitada aos dois cargos de Candeias',()=>{
 for(const q of questions){
  const c202=classifyForCargo(q,exam,'202'),c505=classifyForCargo(q,exam,'505');
  assert.equal(c202.status,'dentro');assert.equal(c505.status,'dentro');
  assert.equal(c202.topicId,'gerais:1');assert.equal(c505.topicId,'gerais:1');
  assert.equal(classifyForCargo(q,exam,'240').status,'fora');
  assert.equal(classifyForCargo(q,exam,PROFESSOR_CARGO_ID).status,'fora');
 }
});
test('sete sinalizações: cinco classificações, uma confirmação e uma formatação',()=>{
 const codes={
  Q2024TI03008:['LP','LCPR','B'],
  Q2024TI03021:['CG','CSAU','C'],
  Q2025TI11003:['LP','LINT','A'],
  Q2024TI07027:['CG','CGEO','C'],
  Q2025TI06001:['LP','LMOR','D'],
  Q2026ASG09011:['RLM','PERC','B'],
  Q2024SAUDE10002:['LP','LINT','E']
 };
 for(const [code,[discipline,topic,answer]] of Object.entries(codes)){
  const q=db.questions.find(x=>x.code===code);
  assert.ok(q,code);assert.equal(q.disciplineCode,discipline);
  assert.equal(q.topicCode,topic);assert.equal(q.answer,answer);
  assert.ok(db.flags.filter(f=>f.questionId===q.id).every(f=>f.status!=='pending'));
 }
 const q=db.questions.find(x=>x.code==='Q2024SAUDE10002');
 assert.match(q.contextTitle,/Texto 09.*A proposta dos catadores/);
 assert.match(q.contextText,/^Catadores e catadoras/);
});
