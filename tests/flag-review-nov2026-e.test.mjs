import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {splitAssertionItems} from '../assertion-guide.mjs';

const state=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const q=code=>{const record=state.questions.find(item=>item.code===code);assert.ok(record,code);return record;};
const approvedIds=['60252fd7-fb4d-4dfc-97b5-8fe6b590f652','adb12c6d-6847-4244-93dd-f7bde32ac7be','5895f72d-983b-41ce-9d12-2723832726be'];

test('sinalização 90: enunciado de associação apresenta cada carga e modal em sua coluna',()=>{
 const item=q('Q2023SAUDE06018');
 assert.equal(item.answer,'B');
 assert.deepEqual(item.options.map(o=>o.text),[
  '1 – 2 – 3.','1 – 3 – 2.','2 – 1 – 3.','2 – 3 – 1.','3 – 1 – 2.'
 ]);
 assert.match(item.stem,/Coluna 1 — Cargas e situações\n\n1\./);
 assert.match(item.stem,/\n\n2\. Transporte de bovinos/);
 assert.match(item.stem,/\n\n3\. Transporte de toneladas/);
 assert.match(item.stem,/Coluna 2 — Modais de transporte\n\n\(\s+\) Aéreo/);
 assert.match(item.stem,/\(\s+\) Aquaviário/);
 assert.match(item.stem,/\(\s+\) Rodoviário/);
 assert.equal(item.readabilityReviewed,true);
 assert.equal(splitAssertionItems(item.stem),null,'Associação de colunas não é julgamento V/F');
});
test('sinalizações 91 e 92: SUS fica em conhecimento específico de Saúde',()=>{
 const a=q('Q2023SAUDE12023'),b=q('Q2023SAUDE12030');
 for(const item of [a,b]){
  assert.equal(item.disciplineCode,'CE');
  assert.equal(item.discipline,'Conhecimentos Específicos — Saúde');
  assert.equal(item.topicCode,'SUS');
  assert.equal(item.examId,'curated-health-12');
 }
 assert.match(a.topic,/Reforma Sanitária/);
 assert.match(b.topic,/participação complementar/);
 assert.equal(a.answer,'C');
 assert.equal(b.answer,'B');
});
test('três sinalizações ficam concluídas e nenhuma resposta é apagada',()=>{
 for(const id of approvedIds){
  const flag=state.flags.find(item=>item.id===id);
  assert.equal(flag?.status,'approved',id);
  assert.ok(flag.resolvedAt);
 }
 assert.ok(state.questions.length>=1094);
 assert.ok(state.exams.length>=56);
 assert.ok(state.attempts.length>=154);
 assert.equal(new Set(state.questions.map(q=>q.id)).size,state.questions.length);
});
