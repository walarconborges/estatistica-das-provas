import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {splitAssertionItems} from '../assertion-guide.mjs';
import {classifyForCargo} from '../edital-classification.mjs';
const s=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const get=code=>{const q=s.questions.find(x=>x.code===code);assert.ok(q,code);return q;};
const exam=q=>s.exams.find(e=>e.id===q.examId);
test('56: comando final fora da assertiva III',()=>{
 const q=get('Q2026CGCMCJCHATGPT023'),r=splitAssertionItems(q.stem);
 assert.ok(r);assert.equal(r.kind,'roman');
 assert.deepEqual(r.items.map(i=>i.label),['I','II','III']);
 assert.doesNotMatch(r.items[2].text,/Est[aá] CORRETO/i);
 assert.match(r.outro,/Está CORRETO o que se afirma em:/);assert.equal(q.answer,'A');
});
test('57: projeto 2.279/2026 preservado, conforme pauta oficial',()=>{
 const q=get('Q2026CGCMCJCHATGPT004');assert.match(q.stem,/2\.279\/2026/);
 assert.match(q.options[0].text,/alienação de bens móveis/);assert.equal(q.answer,'A');
});
test('58 e 61: questões SEMUSA no cargo 240, fora dos cargos Candeias',()=>{
 for(const [code,topic,answer,topicId] of [
  ['Q2023SAUDE12026','ESUS','B','especificos:5'],
  ['Q2023SAUDE12034','EROT','A','especificos:0']
 ]){
  const q=get(code),e=exam(q);
  assert.equal(q.answer,answer);assert.equal(q.disciplineCode,'CE');
  assert.equal(q.topicCode,topic);
  const match=classifyForCargo(q,e,'240');
  assert.equal(match.status,'dentro');assert.equal(match.topicId,topicId);
  assert.equal(classifyForCargo(q,e,'202').status,'fora');
  assert.equal(classifyForCargo(q,e,'505').status,'fora');
 }
});
test('59: remove quebra e hifenização artificial, mantém gabarito',()=>{
 const q=get('Q2026ASG02006');
 assert.match(q.stem,/diversidade regional\. De acordo/);
 assert.match(q.options[1].text,/regiões naturais/);
 assert.doesNotMatch(q.options[1].text,/natu- rais/);
 assert.equal(q.answer,'A');
});
test('60: conferência do PDF original, sem alteração da questão 19',()=>{
 const q=get('Q2026CGCMCJCHATGPT019');
 assert.match(q.stem,/15 de setembro de 2026/);
 assert.match(q.stem,/Sobre as inscrições informadas no extrato do edital/);
 assert.equal(q.options[0].text,'Seriam realizadas exclusivamente pela internet, no site do IBGP, de 21 de setembro a 20 de outubro de 2026, observados os horários e as condições do edital.');
 assert.equal(q.answer,'A');
});
test('sinalizações encerradas e IDs, tentativas e perfis preservados',()=>{
 assert.equal(new Set(s.questions.map(q=>q.code)).size,s.questions.length);
 assert.ok(s.profiles.length>=2);assert.ok(s.attempts.length>0);
 const codes=['Q2026CGCMCJCHATGPT023','Q2026CGCMCJCHATGPT004','Q2023SAUDE12026','Q2026ASG02006','Q2026CGCMCJCHATGPT019','Q2023SAUDE12034'];
 for(let i=0;i<codes.length;i++){
  const q=get(codes[i]),f=s.flags.filter(x=>x.questionId===q.id);
  assert.equal(f.some(x=>x.status==='pending'),false);
  assert.ok(f.some(x=>x.status===(i===4?'rejected':'approved')));
 }
});
