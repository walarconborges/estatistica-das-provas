import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,addExam,parseExamText,parseKey,inferExamMetadata,sameQuestion,recordAttempt,outcome,stats,createSimulation,finishSimulation,simulationResult,filtered,prioritize} from '../core.mjs';
const meta={title:'Prova IBGP 2026',year:'2026',banca:'IBGP',orgao:'SEMED'};
const sample=()=>({stem:'Qual é o plural de cidadão?',originalNumber:1,options:[{letter:'A',text:'Cidadãos'},{letter:'B',text:'Cidadões'}],discipline:'Língua Portuguesa',disciplineCode:'LP',topic:'Gramática',topicCode:'G'});
function data(){const s=fresh();const e=addExam(s,meta,[sample(),{...sample(),originalNumber:2,stem:'Outra questão'}],{1:'A',2:'B'});return {s,e,q:s.questions[0]}}
test('código vincula ano, disciplina, assunto, banca e órgão sem zeros retroativos',()=>{
  const {s,q}=data();assert.equal(q.code,'Q2026LPGIBGPSEMED1');
  assert.equal(s.questions[1].code,'Q2026LPGIBGPSEMED2');
});
test('leitor de texto identifica questões e disciplinas distintas',()=>{
 const x=parseExamText('LÍNGUA PORTUGUESA\n1) Marque a correta.\nA) Sim\nB) Não\nMATEMÁTICA\n2) Qual é 20% de 100?\nA) 10\nB) 20');
 assert.equal(x.length,2);assert.equal(x[0].disciplineCode,'LP');assert.equal(x[1].disciplineCode,'MA');
 assert.equal(x[1].topic,'Porcentagem');
});
test('gabarito compacto mantém todas as respostas',()=>assert.deepEqual(parseKey('1A2B3C4D'),{1:'A',2:'B',3:'C',4:'D'}));
test('enunciado e alternativas idênticos em outra ordem são duplicados',()=>{
 const a=sample(),b={...sample(),options:[{letter:'A',text:'Cidadões'},{letter:'B',text:'Cidadãos'}]};
 assert.ok(sameQuestion(a,b));
});
test('branco não substitui acerto anterior nem entra no aproveitamento',()=>{
 const {s,q}=data();recordAttempt(s,'perfil',q.id,'A');recordAttempt(s,'perfil',q.id,'');
 assert.equal(outcome(s,'perfil',q),'correct');assert.equal(stats(s,'perfil').total,1);assert.equal(stats(s,'perfil').wrong,0);
});
test('a última resposta efetivamente marcada prevalece',()=>{
 const {s,q}=data();recordAttempt(s,'perfil',q.id,'A');recordAttempt(s,'perfil',q.id,'B');
 assert.equal(outcome(s,'perfil',q),'wrong');assert.equal(stats(s,'perfil').wrong,1);
});
test('anulação retira questão do resultado geral',()=>{
 const {s,q}=data();recordAttempt(s,'perfil',q.id,'A');q.status='annulled';
 assert.equal(stats(s,'perfil').total,0);
 assert.equal(filtered(s,'perfil',{}).length,1);
 assert.equal(filtered(s,'perfil',{status:'annulled'}).length,1);
});
test('classificação secundária integra outro assunto sem dobrar total',()=>{
 const {s,q}=data();recordAttempt(s,'perfil',q.id,'A');q.secondary=[{discipline:'Informática',topic:'Planilhas'}];
 assert.equal(stats(s,'perfil').total,1);assert.equal(stats(s,'perfil').byTopic.length,2);
});
test('simulado guarda em branco sem criar erro',()=>{
 const {s}=data();const simulation=createSimulation(s,'perfil',s.questions);
 simulation.answers[s.questions[0].id]='A';finishSimulation(s,simulation);
 const result=simulationResult(s,simulation);
 assert.equal(result.correct,1);assert.equal(result.blank,1);assert.equal(stats(s,'perfil').total,1);
});
test('filtro e sorteio não alteram o banco',()=>{
 const {s}=data();const candidates=filtered(s,'perfil',{discipline:'Língua Portuguesa'}),ordered=prioritize(s,'perfil',candidates);
 assert.equal(ordered.length,2);assert.equal(s.questions.length,2);
});


test('metadados da prova são encontrados nos PDFs sem digitação',()=>{
 const m=inferExamMetadata('CONCURSO PÚBLICO - IBGP - SECRETARIA MUNICIPAL DE EDUCAÇÃO','2026 prova.pdf','GABARITO OFICIAL','gabarito.pdf');
 assert.equal(m.year,'2026');assert.equal(m.banca,'IBGP');assert.equal(m.orgao,'SEMED');assert.deepEqual(m.missing,[]);
});
test('metadados não identificados são sinalizados, não inventados',()=>{
 const m=inferExamMetadata('Enunciado sem cabeçalho','prova.pdf','','gabarito.pdf');
 assert.equal(m.year,'0000');assert.equal(m.banca,'NI');assert.equal(m.orgao,'NI');
 assert.deepEqual(m.missing,['ano','banca','órgão']);
});
