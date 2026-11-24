import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyForCargo,candeiasMatches,filterCandeiasQuestions} from '../edital-classification.mjs';
import {PROFESSOR_CARGO_ID} from '../programa-semed-professor.mjs';

const s=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const exams=[{"id":"sim-autoral-clima-amazonia-2026-11-21","answers":"ACEBDACDEB","min":1,"max":10,"local":false},{"id":"sim-autoral-candeias-br364-2026-11-21","answers":"DAEBCAEDCB","min":31,"max":40,"local":true},{"id":"sim-autoral-candeias-incra-2026-11-21","answers":"CADBEBADCE","min":41,"max":50,"local":true},{"id":"sim-autoral-candeias-seringais-2026-11-21","answers":"CAEBDBAECD","min":51,"max":60,"local":true}];
const get=id=>s.exams.find(e=>e.id===id);
test('quatro cadernos importados com 40 questões e alternativas completas, sem atribuição à IBGP',()=>{
 for(const info of exams){
  const e=get(info.id);assert.ok(e,info.id);
  assert.equal(e.banca,'Autoral');
  assert.equal(e.sourceType,'simulado-autoral');
  assert.equal(e.questionIds.length,10);
  const qs=e.questionIds.map(id=>s.questions.find(q=>q.id===id));
  assert.ok(qs.every(Boolean));
  assert.deepEqual(qs.map(q=>q.originalNumber),Array.from({length:10},(_,i)=>info.min+i));
  assert.equal(qs.map(q=>q.answer).join(''),info.answers);
  assert.ok(qs.every(q=>q.options.map(o=>o.letter).join('')==='ABCDE'));
  assert.ok(qs.every(q=>q.options.every(o=>o.text.length>=5)&&q.stem.length>45&&['active','archived'].includes(q.status)));
  assert.ok(qs.every(q=>q.disciplineCode==='CG'));
 }
 assert.equal(new Set(s.questions.map(q=>q.code)).size,s.questions.length);
 assert.equal(new Set(s.questions.map(q=>q.id)).size,s.questions.length);
});
test('o clima amazônico fica no banco geral; três cadernos locais pertencem a Candeias 202/505',()=>{
 for(const info of exams){
  const e=get(info.id),qs=e.questionIds.map(id=>s.questions.find(q=>q.id===id));
  for(const q of qs){
   if(info.local){
    assert.ok(['História de Candeias do Jamari','Geografia de Candeias do Jamari'].includes(q.topic));
    assert.equal(q.municipalSource,'candeias-do-jamari-ro');
    for(const cargo of ['202','505']){
     const cls=classifyForCargo(q,e,cargo);
     assert.equal(cls.status,'dentro',q.code+' / '+cargo);
     assert.equal(cls.topicId,'gerais:1');
    }
    for(const cargo of ['240',PROFESSOR_CARGO_ID])assert.equal(classifyForCargo(q,e,cargo).status,'fora',q.code+'/'+cargo);
    assert.ok(candeiasMatches(q,e).length>=1);
   }else{
    assert.equal(q.topic,'Meio ambiente e sustentabilidade');
    assert.equal(q.sourceType,'simulado-autoral-clima-amazonia');
    assert.equal(candeiasMatches(q,e).some(x=>x.sectionId==='gerais'),false);
   }
  }
 }
 const local=exams.filter(x=>x.local).flatMap(info=>get(info.id).questionIds.map(id=>s.questions.find(q=>q.id===id)));
 const climate=get(exams[0].id).questionIds.map(id=>s.questions.find(q=>q.id===id));
 assert.equal(filterCandeiasQuestions([...local,...climate],get,{candeiasDisciplines:['gerais']}).length,30);
});
test('enunciados em assertivas preservam I, II, III e comando separado',()=>{
 const e=get('sim-autoral-candeias-br364-2026-11-21');
 for(const n of [34,38]){
  const q=s.questions.find(q=>q.examId===e.id&&q.originalNumber===n);
  assert.match(q.stem,/\nI\./);
  assert.match(q.stem,/\nII\./);
  assert.match(q.stem,/\nIII\./);
  assert.match(q.stem,/\nEstá CORRETO o que se afirma em:/);
 }
});
test('gabaritos comentados só nos dois PDFs que os fornecem; registros anteriores preservados',()=>{
 for(const info of exams){
  const questions=get(info.id).questionIds.map(id=>s.questions.find(q=>q.id===id));
  assert.equal(questions.filter(q=>q.answerComment?.length>0).length,
   info.id.includes('clima-amazonia')||info.id.includes('seringais')?10:0);
 }
 assert.ok(s.questions.length>=1054);
 assert.ok(s.exams.length>=52);
 assert.ok(s.profiles.length>=3);
 assert.ok(s.attempts.length>=73);
 assert.ok(s.flags.length>=61);
});
