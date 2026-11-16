import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKey,inferExamMetadata,classifyByExamDivision} from '../core.mjs';
import {isInstructionSheet,spatialQuestions,repairPageBreakContinuations,
 cargoColumnAnswerTables,chosenAnswerSection,declaredQuestionCount} from '../pdf-layout.mjs';
import {questionCropBounds} from '../pdf-import.mjs';

const cover=[
 'PREFEITURA DO MUNICÍPIO DE OURO PRETO DO OESTE – RO - EDITAL Nº 08/2016 - CONCURSO PÚBLICO',
 'PROVA OBJETIVA DE MÚLTIPLA ESCOLHA – OPÇÃO 2',
 'CARGO: PROFESSOR NÍVEL II – PEDAGOGO – SÉRIES INICIAIS',
 'Leia atentamente as INSTRUÇÕES:',
 ...Array.from({length:15},(_,i)=>(i+1)+'. '+(
  i===5?'Sua prova tem 40 questões, com 5 alternativas.':
  'Confira os seus dados no cartão-resposta antes da prova.')),
 'BOA PROVA!'
].join('\n');
const expected='D B E B A D B A E C D A D B A C A B E D D E B E C E B A C E D E A B E E E A A E'.split(' ');
assert.equal(expected.length,40);
function keyPage(n,role,letters=expected){
 return '[[PAGE:'+n+']]\nGABARITO PROVA OBJETIVA - PRELIMINAR\n'+
 'PREFEITURA DO MUNICÍPIO DE OURO PRETO DO OESTE - RO\n'+
 'EDITAL Nº 08/2016 - CONCURSO PÚBLICO\nCARGO: '+role+'\n'+
 'QUESTÃO RESPOSTA VALOR DA QUESTÃO ÁREA DE CONHECIMENTO\n'+
 letters.map((a,i)=>(i+1)+' '+a+' '+(i<25?2:4)+' '+
  (i<10?'LÍNGUA PORTUGUESA':i<15?'RACIOCÍNIO LÓGICO':
   i<20?'INFORMÁTICA BÁSICA':i<25?'CONHECIMENTOS GERAIS':'CONHECIMENTOS ESPECÍFICOS'))
 .join('\n');
}
const professor='PROFESSOR NÍVEL II PEDAGOGO SÉRIES INICIAIS';
const other='PROFESSOR NÍVEL II EDUCAÇÃO FÍSICA';
const key=Array.from({length:37},(_,i)=>keyPage(i+1,i===29?professor:i===26?other:'AGENTE ADMINISTRATIVO '+(i+1))).join('\n');

test('capa com quinze instruções numeradas não origina 15 falsas questões',()=>{
 const page={number:1,lines:cover.split('\n').map((text,i)=>({text,y:25+i*18,col:0,x:45})),text:cover};
 assert.equal(isInstructionSheet(page),true);
 assert.equal(declaredQuestionCount([page]),40);
 const result=spatialQuestions([page]);
 assert.equal(result.questions.length,0);
});
test('gabarito preliminar de 37 cargos seleciona apenas Professor na página 30',()=>{
 const tables=cargoColumnAnswerTables(key);
 assert.equal(tables.length,37);
 assert.equal(tables.find(x=>x.pageNumber===30).role,professor);
 assert.equal(tables.find(x=>x.pageNumber===30).count,40);
 const selected=chosenAnswerSection(key,'[[PAGE:1]]\n'+cover,
  {examFilename:'prof_nivel_ii_pedagogo_series_iniciais.pdf'});
 assert.equal(selected.error,null);
 assert.equal(selected.answerPage,30);
 assert.equal(selected.section,professor);
 assert.deepEqual(Object.entries(parseKey(selected.text)).map(([,v])=>v),expected);
 assert.notDeepEqual(parseKey(selected.text),parseKey(tables[0].text.replace(/^1\) [A-E]/,'1) A')));
});
test('gabarito de outro professor não substitui professor de Séries Iniciais',()=>{
 const wrong=keyPage(27,other);
 const s=chosenAnswerSection(wrong,'[[PAGE:1]]\n'+cover,{});
 assert.ok(s.error);
});
test('identificação de banca, órgão e cargo restrita ao edital e caderno verificados',()=>{
 const result=inferExamMetadata('[[PAGE:1]]\n'+cover,
  'prof_nivel_ii_pedagogo_series_iniciais.pdf',key,'gab_preliminar.pdf');
 assert.equal(result.year,'2016');
 assert.equal(result.banca,'MSCONCURSOS');
 assert.equal(result.orgao,'PM-OURO-PRETO-DO-OESTE');
 assert.deepEqual(result.missing,[]);
 assert.match(result.title,/Professor Nível II.*Séries Iniciais/);
 const other=inferExamMetadata('[[PAGE:1]]\n'+cover.replace('08/2016','09/2016'),
  'prof_nivel_ii_pedagogo_series_iniciais.pdf',key,'gab_preliminar.pdf');
 assert.equal(other.banca,'NI');
});
test('divisão oficial do caderno preserva as 40 disciplinas de origem',()=>{
 const meta=inferExamMetadata('[[PAGE:1]]\n'+cover,
  'prof_nivel_ii_pedagogo_series_iniciais.pdf',key,'gab_preliminar.pdf');
 const values=Array.from({length:40},(_,i)=>classifyByExamDivision(
  {originalNumber:i+1},meta,{disciplineCode:'NC',topic:'Geral'}).disciplineCode);
 assert.deepEqual(values.slice(0,10),Array(10).fill('LP'));
 assert.deepEqual(values.slice(10,15),Array(5).fill('RL'));
 assert.deepEqual(values.slice(15,20),Array(5).fill('IN'));
 assert.deepEqual(values.slice(20,25),Array(5).fill('CG'));
 assert.deepEqual(values.slice(25,40),Array(15).fill('CE'));
});
const row=(text,y)=>({text,y,x:45,col:0});
test('questão com charge ou alternativas na página seguinte conserva as duas páginas',()=>{
 const pages=[
  {number:1,width:595,height:842,singleColumn:true,lines:cover.split('\n').map((text,i)=>row(text,30+i*18))},
  {number:2,width:595,height:842,singleColumn:true,lines:[
   row('02. Atente para a charge seguinte e assinale a correta.',725)
  ]},
  {number:3,width:595,height:842,singleColumn:true,lines:[
   row('Disponível em: charge ilustrada na página seguinte.',45),
   ...'ABCDE'.split('').map((letter,i)=>row(letter.toLowerCase()+') Alternativa '+letter,85+i*30)),
   row('03. Qual é o significado do termo?',300),
   ...'ABCDE'.split('').map((letter,i)=>row(letter.toLowerCase()+') Outra '+letter,345+i*25))
  ]}
 ];
 const result=spatialQuestions(pages);
 assert.deepEqual(result.questions.map(x=>x.originalNumber),[2,3]);
 const q=result.questions[0];
 assert.equal(q.imageOnly,true);
 assert.equal(q.extractionFallback,true);
 assert.equal(q.continuation.nextPage,3);
 assert.equal(q.sourcePage,2);
 assert.equal(q.sourceLayout,'SINGLE_COLUMN');
 assert.deepEqual(q.options.map(x=>x.letter),'ABCDE'.split(''));
 const crop=questionCropBounds(q,595,842,1);
 assert.ok(crop.right>550,'recorte não corta a metade direita');
});
test('marcador de texto para as próximas seis questões mantém texto-base comum',()=>{
 const rows=[
  row('Leia o texto a seguir, para responder às próximas seis questões.',25),
  row('Texto de apoio extenso sobre comportamento nas mídias sociais.',55),
  row('01. Considere as afirmações do texto.',95),
  ...'ABCDE'.split('').map((letter,i)=>row(letter.toLowerCase()+') Alternativa '+letter,135+i*22)),
  row('02. Conforme o texto, qual é a conclusão?',285),
  ...'ABCDE'.split('').map((letter,i)=>row(letter.toLowerCase()+') Outra '+letter,325+i*22))
 ];
 const qs=spatialQuestions([{number:2,width:595,height:842,singleColumn:true,lines:rows}]).questions;
 assert.equal(qs[0].contextRange?.[0],1);
 assert.equal(qs[0].contextRange?.[1],6);
 assert.match(qs[1].contextText,/comportamento nas mídias sociais/);
});
