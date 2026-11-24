import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filtered,stats,recordAttempt,createSimulation,simulationResult} from '../core.mjs';

const db=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../data/archive-candeias-2026.json',import.meta.url),'utf8'));
const questions=new Map(db.questions.map(q=>[q.id,q]));
const byCode=new Map(db.questions.map(q=>[q.code,q]));
const ids=new Set(audit.entries.map(row=>row.id));

test('auditoria: somente as 103 questões estritamente municipais foram arquivadas',()=>{
 assert.equal(audit.totalArchived,103);
 assert.equal(ids.size,103);
 assert.deepEqual(audit.groups.map(g=>[g.key,g.count]),[
  ['municipal-news',30],['municipal-history-geography',27],['municipal-legislation',40],
  ['specific-municipal-facts',5],['municipal-legal-adaptation',1]
 ]);
 for(const row of audit.entries){
  const q=questions.get(row.id);
  assert.ok(q,'Questão ausente: '+row.id);
  assert.equal(q.code,row.code);
  assert.equal(q.examId,row.examId);
  assert.equal(q.status,'archived');
  assert.equal(q.archive.scope,'candeias-do-jamari-ro');
  assert.equal(q.archive.previousStatus,'active');
  assert.ok(q.stem&&q.options?.length>=2&&q.answer,'Não perder enunciado/alternativas/gabarito: '+q.code);
 }
 assert.equal(db.questions.filter(q=>q.status==='archived').length,103);
 assert.equal(db.questions.filter(q=>q.status==='active').length,987);
 assert.equal(db.questions.filter(q=>q.status==='needs-review').length,4);
 assert.equal(db.exams.length,56);
 assert.ok(db.attempts.length>=169);
 assert.ok(db.flags.length>=99);
});

test('conteúdo geral de Rondônia, BR-364, colonização e ciclo da borracha permanece disponível',()=>{
 const preserved=audit.preservedFromCandeiasCadernos;
 assert.equal(preserved.length,28);
 for(const entry of preserved){
  const q=byCode.get(entry.code);
  assert.ok(q&&q.status==='active','Questão geral indevidamente arquivada: '+entry.code);
 }
 for(const code of ['Q2026CGCDJHISTAUTORAL034','Q2026CGCDJHISTAUTORAL042',
  'Q2026CGCDJHISTAUTORAL054','Q2026CGCDJGEOCHATGPT019']){
  assert.equal(byCode.get(code)?.status,'active',code);
 }
 const ba=db.exams.find(e=>e.id==='curated-ti-07');
 const mg=db.exams.find(e=>e.id==='curated-ti-10');
 assert.ok(ba&&mg);
 for(const e of [ba,mg])assert.ok(e.questionIds.every(id=>questions.get(id)?.status!=='archived'));
});

test('arquivadas saem de filtros, inclusive Todas, e de estatísticas de todos os perfis',()=>{
 for(const profile of db.profiles){
  for(const status of ['', 'all', 'active']){
   const result=filtered(db,profile.id,{status});
   assert.ok(result.every(q=>q.status!=='archived'));
  }
  const report=stats(db,profile.id);
  const done=new Set(db.attempts.filter(a=>a.profileId===profile.id).map(a=>a.questionId));
  assert.ok(report.total<=db.questions.filter(q=>q.status==='active'&&done.has(q.id)).length);
  assert.equal(report.total,report.correct+report.wrong);
  assert.ok(!filtered(db,profile.id,{status:'all'}).some(q=>ids.has(q.id)));
 }
});

test('simulados novos ignoram questões arquivadas, respostas antigas continuam intactas',()=>{
 const copy={...db,attempts:[...db.attempts],simulations:[...db.simulations]};
 const archived=questions.get(audit.entries[0].id);
 const active=db.questions.find(q=>q.status==='active');
 assert.ok(archived&&active);
 const p=db.profiles[0].id,attemptsBefore=copy.attempts.length;
 assert.equal(recordAttempt(copy,p,archived.id,archived.answer),false);
 assert.equal(copy.attempts.length,attemptsBefore);
 const sim=createSimulation(copy,p,[archived,active]);
 assert.deepEqual(sim.questionIds,[active.id]);
 sim.answers[active.id]=active.answer;
 const r=simulationResult(copy,sim);
 assert.equal(r.correct,1);
 assert.equal(r.archived,0);
 const oldSim={...sim,questionIds:[archived.id,active.id],answers:{[archived.id]:archived.answer,[active.id]:active.answer}};
 const oldResult=simulationResult(copy,oldSim);
 assert.equal(oldResult.archived,1);
 assert.equal(oldResult.correct,1);
 assert.equal(copy.attempts.length,attemptsBefore);
});
