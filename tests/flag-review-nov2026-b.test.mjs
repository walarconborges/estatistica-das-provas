import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyForCargo} from '../edital-classification.mjs';

const state=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const question=code=>state.questions.find(q=>q.code===code);
const exam=id=>state.exams.find(x=>x.id===id);

test('12 novas sinalizações resolvidas, sem alterar gabaritos nem histórico',()=>{
 const codes={
  "Q2026TI04021": "C",
  "Q2022TI09007": "E",
  "Q2025TI08008": "B",
  "Q2020SAUDE02033": "A",
  "Q2020SAUDE02036": "D",
  "Q2024TI05106": "E",
  "Q2024TI05084": "C",
  "Q2024TI07002": "A",
  "Q2025TI08012": "D",
  "Q2024TI03007": "A",
  "Q2026TI16007": "C"
};
 for(const [code,gabarito] of Object.entries(codes)){
  const q=question(code);assert.ok(q,code);assert.equal(q.answer,gabarito,code);
  assert.ok(state.flags.some(f=>f.questionId===q.id&&f.status==='approved'),code); // nova sinalização não desfaz revisão anterior
 }
 assert.ok(state.questions.length>=944,'não excluir questões antigas ao adicionar novos simulados');
 assert.equal(state.attempts.length>=22,true);
});
test('Rondônia é Conhecimentos Gerais / HGRO, e os itens LP deixam Informática',()=>{
 assert.equal(question('Q2026TI04021').topicCode,'HGRO');
 assert.equal(question('Q2026TI04021').disciplineCode,'CG');
 for(let n=1;n<=15;n++)assert.equal(state.questions.find(q=>q.examId==='curated-ti-09'&&q.originalNumber===n).disciplineCode,'LP');
 for(const code of ['Q2024TI07002','Q2024TI03007','Q2026TI16007','Q2025TI08008'])assert.equal(question(code).disciplineCode,'LP');
});
test('texto Telebras não é parte do item 7, e está acessível nos itens 8–15',()=>{
 assert.ok(!question('Q2022TI09007').stem.includes('No mundo de hoje, as telecomunicações'));
 for(let n=8;n<=15;n++){
  const q=state.questions.find(q=>q.examId==='curated-ti-09'&&q.originalNumber===n);
  assert.match(q.contextText,/terremoto que/);assert.deepEqual(q.contextRange,[8,15]);
 }
});
test('Marília tem os dois blocos corretos e frações restauradas',()=>{
 assert.match(exam('curated-ti-08').title,/Auxiliar de Informática/);
 for(let n=1;n<=20;n++){
  const q=state.questions.find(q=>q.examId==='curated-ti-08'&&q.originalNumber===n);
  if(q)assert.equal(q.disciplineCode,n<=10?'LP':'RLM',q.code);
 }
 assert.match(question('Q2025TI08012').stem,/3\/4/);
 assert.match(question('Q2025TI08013').stem,/4\/5/);
 assert.ok(!question('Q2025TI08008').stem.includes('inves timento'));
});
test('CAPES não contém itens anulados colados, instrução EAP está antes do item 85',()=>{
 const q84=question('Q2024TI05084'),q85=question('Q2024TI05085');
 assert.ok(!q84.stem.includes('No que se refere a EAP'));
 assert.ok(q85.stem.startsWith('No que se refere a EAP'));
 for(const n of [96,102,106,111]){
  const q=state.questions.find(x=>x.examId==='curated-ti-05'&&x.originalNumber===n);
  assert.ok(!/\d+\s*-\s*ANULADA\/DESATUALIZADA/.test(q.stem));
 }
 assert.ok(question('Q2024TI05111').stem.startsWith('A respeito de conteinerização e DevOps'));
});
test('Q116 excluída sem resíduos, saúde não é TI e pertence ao banco geral',()=>{
 const id='curated-ti-05-116';
 assert.ok(!state.questions.some(q=>q.id===id));
 assert.ok(state.tombstones.questions.includes(id));
 assert.ok(!exam('curated-ti-05').questionIds.includes(id));
 assert.ok(!state.attempts.some(a=>a.questionId===id));
 assert.ok(!state.simulations.some(sim=>sim.questionIds?.includes(id)));
 const health=exam('curated-health-02');
 for(const code of ['Q2020SAUDE02033','Q2020SAUDE02036']){
  const q=question(code);
  assert.equal(q.disciplineCode,'CE');
  assert.match(q.discipline,/Saúde/);
  assert.equal(classifyForCargo(q,health,'505').status,'fora');
 }
});

test('sinalização #42 corrige pontuação sem mexer no gabarito',()=>{
 const q=question('Q2026TI13001');
 assert.equal(q.disciplineCode,'LP');assert.equal(q.topicCode,'LPON');
 assert.equal(q.answer,'C');
 assert.equal(state.flags.some(f=>f.questionId===q.id&&f.status==='pending'),false);
});
