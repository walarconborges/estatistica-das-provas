import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CATALOGS,FOCUS_CARGOS,classifyForCargo} from '../edital-classification.mjs';
const state=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../data/import-secretaria-2026-11-24.json',import.meta.url),'utf8'));
const imported=state.questions.filter(q=>q.sourceType==='pdf-selecao-secretaria-escolar-2026-11-24');
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
test('177 questões preservadas em seis cadernos, sem duplicar dados anteriores',()=>{
 assert.equal(imported.length,177);
 assert.equal(state.questions.length,1271);
 assert.equal(state.exams.length,62);
 assert.equal(state.questions.filter(q=>q.status==='active').length,1164);
 assert.equal(state.questions.filter(q=>q.status==='archived').length,103);
 assert.equal(state.attempts.length,169);
 assert.equal(state.flags.length,99);
 assert.deepEqual(audit.groupCounts.map(x=>x.count),[37,28,27,36,29,20]);
 assert.equal(new Set(state.questions.map(q=>q.id)).size,state.questions.length);
 assert.equal(new Set(state.questions.map(q=>q.code)).size,state.questions.length);
 const fps=imported.map(q=>norm(q.stem)+'|'+q.options.map(o=>norm(o.text)).join('|'));
 assert.equal(new Set(fps).size,177);
});
test('gabaritos oficiais e alternativas íntegras, inclusive prova com quatro opções',()=>{
 for(const q of imported){
  assert.ok(q.stem.length>=12,q.code);
  assert.equal(q.options.map(o=>o.letter).join(''),q.examId==='selected-sec-2013-itapipoca'?'ABCD':'ABCDE',q.code);
  assert.ok(q.options.some(o=>o.letter===q.answer),q.code);
  assert.ok(q.options.every(o=>o.text&&o.text.length),q.code);
 }
 const venn=imported.find(q=>q.examId==='selected-sec-2012-funcab-buzios'&&q.originalNumber===11);
 assert.equal(venn.answer,'E');
 assert.match(venn.options[4].text,/diferença simétrica/);
});
test('a mesma questão pode ter classificação válida em mais de um cargo sem replicação',()=>{
 assert.deepEqual(FOCUS_CARGOS,['519-552','343','240']);
 const exams=new Map(state.exams.map(e=>[e.id,e]));
 let twoOrMore=0;
 for(const q of imported){
  let direct=0;
  for(const cargo of FOCUS_CARGOS){
   const cls=classifyForCargo(q,exams.get(q.examId),cargo);
   assert.ok(['dentro','pendente'].includes(cls.status),q.code+'/'+cargo);
   assert.ok(CATALOGS[cargo].sections.some(s=>s.topics.some((_,i)=>cls.topicId===s.id+':'+i)),q.code+'/'+cargo);
   if(cls.status==='dentro')direct++;
  }
  if(direct>=2)twoOrMore++;
 }
 assert.ok(twoOrMore>30);
});
