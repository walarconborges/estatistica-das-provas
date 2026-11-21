import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyForCargo,candeiasMatches,filterCandeiasQuestions} from '../edital-classification.mjs';
import {PROFESSOR_CARGO_ID} from '../programa-semed-professor.mjs';
const db=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const cases=[{"examId":"sim-autoral-candeias-res173-2026-11-21","answers":"CBDEACADCE"},{"examId":"sim-autoral-candeias-lei-organica-2026-11-21","answers":"ACEBDAECBD"},{"examId":"sim-autoral-candeias-regimento-interno-2026-11-21","answers":"CADBECBAED"},{"examId":"sim-autoral-candeias-legislacao-mista-2026-11-21","answers":"DBEACEBDAC"}];
const exam=id=>db.exams.find(x=>x.id===id);
test('4 novos simulados, 40 itens, gabaritos e comentários preservados',()=>{
 for(const v of cases){
  const e=exam(v.examId);assert.ok(e);assert.equal(e.banca,'Autoral');assert.equal(e.questionIds.length,10);
  const qs=e.questionIds.map(id=>db.questions.find(q=>q.id===id));assert.ok(qs.every(Boolean));
  assert.deepEqual(qs.map(q=>q.originalNumber),[1,2,3,4,5,6,7,8,9,10]);
  assert.equal(qs.map(q=>q.answer).join(''),v.answers);
  assert.ok(qs.every(q=>q.options.map(o=>o.letter).join('')==='ABCDE'));
  assert.ok(qs.every(q=>q.options.every(o=>o.text.length>=5)&&q.stem.length>=35));
  assert.ok(qs.every(q=>q.answerComment?.length>=30&&q.status==='active'&&q.disciplineCode==='LE'));
 }
 assert.equal(new Set(db.questions.map(q=>q.code)).size,db.questions.length);
 assert.equal(new Set(db.questions.map(q=>q.id)).size,db.questions.length);
});
test('Candeias 505 inclui as três normas, 202, SEMUSA e professor não incluem',()=>{
 const topics={organica:0,regimento:1,res173:2};
 const qs=cases.flatMap(v=>exam(v.examId).questionIds.map(id=>db.questions.find(q=>q.id===id)));
 for(const q of qs){
  const x=classifyForCargo(q,exam(q.examId),'505');
  assert.equal(x.status,'dentro',q.code);assert.equal(x.topicId,'legislacao:'+topics[q.municipalLawTag]);
  assert.deepEqual(candeiasMatches(q,exam(q.examId)).map(m=>m.cargo),['505']);
  for(const id of ['202','240',PROFESSOR_CARGO_ID])assert.equal(classifyForCargo(q,exam(q.examId),id).status,'fora',q.code);
 }
 assert.equal(filterCandeiasQuestions(qs,exam,{candeiasDisciplines:['legislacao']}).length,40);
 for(let idx=0;idx<3;idx++){
  const selected=filterCandeiasQuestions(qs,exam,{candeiasTopics:['505:legislacao:'+idx]});
  assert.ok(selected.length>0);assert.ok(selected.every(q=>topics[q.municipalLawTag]===idx));
 }
});
test('assertivas I, II e III continuam em linhas separadas',()=>{
 for(const [id,numbers] of [
  ['sim-autoral-candeias-res173-2026-11-21',[2,7,10]],
  ['sim-autoral-candeias-legislacao-mista-2026-11-21',[3]]
 ]){
  for(const n of numbers){
   const q=db.questions.find(q=>q.examId===id&&q.originalNumber===n);
   assert.ok(q);assert.match(q.stem,/\nI\./);assert.match(q.stem,/\nII\./);
   assert.match(q.stem,/\nIII\./);assert.match(q.stem,/\nEstá CORRETO o que se afirma em:/);
  }
 }
});
test('base preexistente preservada',()=>{
 assert.ok(db.questions.length>=1094);
 assert.ok(db.exams.length>=56);
 assert.ok(db.attempts.length>=86);
 assert.ok(db.profiles.length>=3);
 assert.ok(db.flags.length>=64);
});