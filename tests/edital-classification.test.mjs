import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,addExam,recordAttempt} from '../core.mjs';
import {CATALOGS,CARGO_202,allTopics,classifyForCargo,subjectSummary} from '../edital-classification.mjs';

const meta={title:'2026 — FEPESE — PM-BRUSQUE — Analista de Informática',year:'2026',banca:'FEPESE',orgao:'PM-BRUSQUE'};
const question=(number,code,discipline,stem)=>({
 originalNumber:number,stem,
 options:'ABCDE'.split('').map(letter=>({letter,text:'Alternativa '+letter})),
 discipline,disciplineCode:code,topic:'Geral',topicCode:'G'
});

test('Anexo IV tem os dois cargos e não atribui informática ou legislação ao cargo 202',()=>{
 assert.deepEqual(Object.keys(CATALOGS).sort(),['202','505']);
 assert.equal(CARGO_202.cargo,'Auxiliar de Serviços Gerais');
 assert.deepEqual(CARGO_202.sections.map(x=>x.title),['Português','Matemática','Conhecimentos Gerais']);
 assert.ok(!CARGO_202.sections.some(x=>/Informática|Legislação/.test(x.title)));
 assert.equal(CATALOGS['505'].sections.length,6);
 assert.equal(allTopics('202').length,34);
 assert.ok(allTopics('505').length>30);
});

test('equivalências dentro do edital são aceitas mesmo com outras palavras',()=>{
 const cases=[
  [question(1,'LP','Língua Portuguesa','Assinale o sinônimo adequado de uma palavra.'),'202','portugues'],
  [question(2,'MA','Matemática','Uma mercadoria teve desconto de 20%. Qual o preço final?'),'202','matematica'],
  [question(3,'RL','Raciocínio Lógico','Quantas comissões com 3 membros podem ser formadas?'),'505','raciocinio'],
  [question(4,'IN','Informática','Como configurar um switch com endereçamento IP?'),'505','especificos'],
  [question(5,'LE','Legislação','A LGPD dispõe sobre tratamento de dados pessoais.'),'505','especificos'],
  [question(6,'CG','Conhecimentos Gerais','O impacto dos refugiados climáticos nos fluxos migratórios internacionais.'),'202','gerais']
 ];
 for(const [q,id,topicPrefix] of cases){
  const out=classifyForCargo(q,meta,id);
  assert.equal(out.status,'dentro',q.stem);
  assert.ok(out.topicId.startsWith(topicPrefix+':'),q.stem+' => '+out.topicId);
 }
});

test('legislação municipal de Brusque e informática no cargo 202 são fora do edital',()=>{
 const original=question(20,'LE','Legislação',
  'Conforme a Lei Complementar Municipal de Brusque nº 143/2009, a promoção horizontal exige 90 horas de cursos.');
 assert.equal(classifyForCargo(original,meta,'505').status,'fora');
 assert.equal(classifyForCargo(original,meta,'202').status,'fora');
 const genericMunicipal=question(21,'LE','Legislação','Segundo a Lei Orgânica do Município, qual é o prazo?');
 assert.equal(classifyForCargo(genericMunicipal,meta,'505').status,'fora');
 const computer=question(25,'IN','Informática','Sobre BIOS e memória RAM de computadores, assinale a correta.');
 assert.equal(classifyForCargo(computer,meta,'202').status,'fora');
 assert.equal(classifyForCargo(computer,meta,'505').status,'dentro');
});

test('lógica proposicional não é automaticamente Matemática do fundamental',()=>{
 const advanced=question(16,'RL','Raciocínio Lógico',
  'Na tabela verdade com as proposições P e Q, qual o valor da negação da conjunção?');
 assert.equal(classifyForCargo(advanced,meta,'202').status,'fora');
 assert.equal(classifyForCargo(advanced,meta,'505').status,'dentro');
});

test('pendência de equivalência não é descartada como fora do edital',()=>{
 const uncertain=question(3,'LP','Língua Portuguesa',
  'Assinale a alternativa que apresenta a opção correta a respeito do fragmento.');
 assert.equal(classifyForCargo(uncertain,meta,'202').status,'pendente');
 assert.equal(classifyForCargo(uncertain,meta,'505').status,'pendente');
});

test('classificar questões antigas ou novas não altera cadastro, gabarito nem histórico',()=>{
 const state=fresh();
 const old=[question(1,'LP','Língua Portuguesa','Assinale o antônimo adequado da palavra indicada.'),
  question(2,'IN','Informática','O que é ransomware?')];
 const exam=addExam(state,meta,old,{1:'A',2:'B'});
 recordAttempt(state,'usuario',state.questions[0].id,'A');
 const snapshot=JSON.stringify(state);
 const countBefore=subjectSummary(state.questions,qid=>state.exams.find(e=>e.id===qid),'202');
 assert.equal(countBefore.total.dentro,1);
 assert.equal(countBefore.total.fora,1);
 assert.equal(JSON.stringify(state),snapshot);
 const other=addExam(state,{title:'Outra prova',year:'2025',banca:'IBGP',orgao:'CMCJ'},
  [question(1,'MA','Matemática','Uma dívida tem 5% de desconto.')],{1:'C'});
 const countAfter=subjectSummary(state.questions,qid=>state.exams.find(e=>e.id===qid),'202');
 assert.equal(countAfter.total.dentro,2);
 assert.equal(state.exams[0].id,exam.id);
 assert.equal(other.questionIds.length,1);
 assert.equal(state.attempts.length,1);
 assert.equal(state.questions[0].answer,'A');
});
