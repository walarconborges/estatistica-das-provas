import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyForCargo} from '../edital-classification.mjs';

const s=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const exam=s.exams.find(e=>e.id==='sim-chatgpt-cmcj-noticias-2026-11-18');
const originals={"1":"B","2":"C","3":"D","4":"A","5":"E","6":"C","7":"B","8":"D","9":"A","10":"E"};
const ids=Array.from({length:10},(_,i)=>'Q2026CGCMCJCHATGPT'+String(i+1).padStart(3,'0'));
test('10 questões de Notícias do site da CMCJ-RO: banca ChatGPT, 2026 e gabarito integral',()=>{
 assert.ok(exam);assert.equal(exam.banca,'ChatGPT');assert.equal(exam.year,'2026');
 assert.equal(exam.questionIds.length,10);
 for(let n=1;n<=10;n++){
  const q=s.questions.find(q=>q.code===ids[n-1]);assert.ok(q,ids[n-1]);
  assert.equal(q.answer,originals[n]);assert.equal(q.options.length,5);
  assert.deepEqual(q.options.map(o=>o.letter),['A','B','C','D','E']);
  assert.equal(q.disciplineCode,'CG');assert.equal(q.examId,exam.id);
 }
});
test('somente tópico notícias para cargos 505 e 202, não para outros editais',()=>{
 for(const id of exam.questionIds){
  const q=s.questions.find(q=>q.id===id);
  for(const cargo of ['505','202']){
   const result=classifyForCargo(q,exam,cargo);
   assert.equal(result.status,'dentro');assert.match(result.topic,/Notícias/i);
   assert.match(result.topicId,/^gerais:/);
  }
  assert.equal(classifyForCargo(q,exam,'240').status,'fora');
 }
});
test('três novas sinalizações de matéria resolvidas sem alterar gabaritos',()=>{
 const cases={
  Q2025TI14040:['LE','C'],Q2026TI04009:['LP','B'],Q2025TI01033:['LP','D']
 };
 for(const [code,[subject,answer]] of Object.entries(cases)){
  const q=s.questions.find(q=>q.code===code);assert.ok(q);assert.equal(q.disciplineCode,subject);
  assert.equal(q.answer,answer);
  assert.ok(s.flags.some(f=>f.questionId===q.id&&f.status==='approved')); // revisões antigas continuam aprovadas, ainda que haja nova sinalização
 }
 assert.ok(s.profiles.length>=2);
});
