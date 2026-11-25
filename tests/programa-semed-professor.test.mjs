import test from 'node:test';
import assert from 'node:assert/strict';
import {PROGRAM_505} from '../programa-candeias-505.mjs';
import {PROGRAM_PROFESSOR,PROFESSOR_CARGO_ID,matchProfessorNewTopic} from '../programa-semed-professor.mjs';
import {CATALOGS,classifyForCargo,approveEdictReview,allTopics} from '../edital-classification.mjs';

const exam={title:'2025 — IBGP — Prefeitura de Porto Velho — Professor Nível II',
 banca:'IBGP',orgao:'SEMED-PVH'};
const q=(code,discipline,stem,topic='Geral')=>({
 disciplineCode:code,discipline,stem,topic,
 options:'ABCDE'.split('').map(letter=>({letter,text:'Alternativa '+letter}))
});

test('Professor 519 a 552 cadastrado com fonte e cinco blocos de ensino superior',()=>{
 assert.equal(PROFESSOR_CARGO_ID,'519-552');
 assert.equal(CATALOGS[PROFESSOR_CARGO_ID].cargo,'Professor Nível II — Séries Iniciais');
 assert.match(PROGRAM_PROFESSOR.edital,/24\/2026/);
 assert.deepEqual(PROGRAM_PROFESSOR.sections.map(x=>x.id),
  ['portugues','raciocinio','gerais','legislacao-educacao','especificos']);
 assert.equal(PROGRAM_PROFESSOR.sections.find(x=>x.id==='especificos').pages,'5–6');
 assert.ok(allTopics(PROFESSOR_CARGO_ID).length>60);
});

test('reaproveita Português e RLM do cargo 505; acrescenta só as lacunas',()=>{
 const base=id=>PROGRAM_505.sections.find(s=>s.id===id).topics;
 const newSection=id=>PROGRAM_PROFESSOR.sections.find(s=>s.id===id).topics;
 assert.equal(newSection('portugues'),base('portugues'));
 assert.deepEqual(newSection('raciocinio').slice(0,base('raciocinio').length),base('raciocinio'));
 assert.deepEqual(newSection('gerais').slice(0,6),base('gerais').slice(0,6));
 assert.match(newSection('gerais').at(-1),/Prefeitura de Porto Velho/);
 assert.ok(!newSection('gerais').at(-1).includes('Candeias'));
 for(const topic of ['Porcentagem','Equações','Média aritmética','proporcionais']){
  assert.ok(newSection('raciocinio').some(t=>t.includes(topic)),topic);
 }
 assert.ok(matchProfessorNewTopic('raciocinio','Regra de três composta')>=0);
});

test('questões gerais de LP/RLM aproveitam classificação anterior por assunto',()=>{
 for(const item of [
  [q('LP','Língua Portuguesa','Assinale a colocação pronominal correta.'),'portugues'],
  [q('RL','Raciocínio Lógico','Qual é a negação de uma proposição composta?'),'raciocinio'],
  [q('RL','Raciocínio Lógico','Calcule o desconto de 20% no preço.'),'raciocinio'],
  [q('MA','Matemática','Resolva um sistema de equações do primeiro grau.'),'raciocinio'],
  [q('RL','Raciocínio Lógico','Calcule a média aritmética simples.'),'raciocinio'],
  [q('CG','Conhecimentos Gerais','Notícias da Prefeitura de Porto Velho/RO.'),'gerais']
 ]){
  const result=classifyForCargo(item[0],exam,PROFESSOR_CARGO_ID);
  assert.equal(result.status,'dentro',item[0].stem+': '+result.reason);
  assert.ok(result.topicId.startsWith(item[1]+':'));
 }
});

test('legislação educacional e conhecimento pedagógico têm assuntos próprios',()=>{
 for(const item of [
  [q('LE','Legislação Educação','Segundo a LDB, Lei Federal nº 9.394/1996, a educação básica...'),'legislacao-educacao'],
  [q('LE','Legislação Educação','O Estatuto do Magistério, Lei Municipal nº 643/1986.'),'legislacao-educacao'],
  [q('LE','Legislação Educação','O que prevê o Fundeb, Lei nº 14.113/2020?'),'legislacao-educacao'],
  [q('CE','Conhecimentos Específicos','Segundo Emilia Ferreiro, qual hipótese de escrita?'),'especificos'],
  [q('CE','Conhecimentos Específicos','Noções de primeiros socorros no ambiente escolar.'),'especificos'],
  [q('CE','Conhecimentos Específicos','Interações e brincadeiras nos campos de experiências da Educação Infantil.'),'especificos']
 ]){
  const res=classifyForCargo(item[0],exam,PROFESSOR_CARGO_ID);
  assert.equal(res.status,'dentro',item[0].stem+': '+res.reason);
  assert.ok(res.topicId.startsWith(item[1]+':'));
 }
});

test('assuntos distantes são aproximados sem afirmar previsão literal no edital de Professor',()=>{
 const other={title:'2026 — Analista de Tecnologia e Informática',orgao:'CMCJ'};
 const it=q('CE','Conhecimentos Específicos','A CPU executa instruções do computador.');
 const local=q('LE','Legislação','Lei Orgânica do Município de Candeias do Jamari.');
 assert.equal(classifyForCargo(it,other,PROFESSOR_CARGO_ID).status,'pendente');
 assert.equal(classifyForCargo(local,other,PROFESSOR_CARGO_ID).status,'pendente');
 assert.match(classifyForCargo(local,other,PROFESSOR_CARGO_ID).reason,/outra localidade/);
 const adapted={...q('LE','Legislação','A Lei Orgânica de Candeias determina...'),originalQuestionId:'orig123'};
 assert.equal(classifyForCargo(adapted,exam,PROFESSOR_CARGO_ID).status,'fora');
});

test('revisões do novo cargo não alteram a classificação de 505 nem o original',()=>{
 const item=q('LE','Legislação Educação','Assunto ambíguo para conferência');
 const original=JSON.stringify(item);
 const prev505=classifyForCargo(item,exam,'505');
 approveEdictReview(item,{editalCargo:PROFESSOR_CARGO_ID,status:'dentro'});
 assert.equal(classifyForCargo(item,exam,PROFESSOR_CARGO_ID).status,'dentro');
 assert.equal(classifyForCargo(item,exam,'505').status,prev505.status);
 assert.deepEqual({...item,editalReview:undefined},{...JSON.parse(original),editalReview:undefined});
});
