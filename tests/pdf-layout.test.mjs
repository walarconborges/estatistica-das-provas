import test from 'node:test';
import assert from 'node:assert/strict';
import {spatialLines,spatialQuestions,chosenAnswerSection,questionIntegrity} from '../pdf-layout.mjs';
import {parseKey,inferExamMetadata} from '../core.mjs';
function item(str,x,y,width=40){return {str,transform:[1,0,0,1,x,842-y],width};}
test('leitura espacial separa duas colunas e preserva a numeração original',()=>{
 const entries=[
  item('Língua Portuguesa',40,22),
  item('Leia o texto para responder às questões de 01 a 02:',40,45,200),
  item('Texto-base comum a ambas as questões.',40,65,190),
  item('01. Leia o trecho.',40,150,100),
  item('(A) Primeira',50,180),
  item('(B) Segunda',50,198),
  item('(C) Terceira',50,216),
  item('(D) Quarta',50,234),
  item('(E) Quinta',50,252),
  item('02. Sobre o texto, responda.',315,30,200),
  item('(A) Sim',323,60),
  item('(B) Não',323,78),
  item('(C) Talvez',323,96),
  item('(D) Nenhuma',323,114),
  item('(E) Todas',323,132)
 ];
 const lines=spatialLines(entries,595,842),parsed=spatialQuestions([{number:3,width:595,height:842,lines}]);
 assert.deepEqual(parsed.questions.map(q=>q.originalNumber),[1,2]);
 assert.equal(parsed.contexts.length,1);
 assert.match(parsed.questions[1].contextText,/Texto-base/);
 assert.equal(parsed.questions[0].options.length,5);
});
test('gabarito que contém vários cargos seleciona somente 004 — Analista de Informática',()=>{
 const blocks=['003. PROVA OBJETIVA\nANALISTA ADMINISTRATIVO\n','004. PROVA OBJETIVA\nANALISTA DE INFORMÁTICA\n','005. PROVA OBJETIVA\nANALISTA LEGISLATIVO\n'];
 const row=(letter)=>Array.from({length:50},(_,i)=>(i+1)+' - '+letter).join(' ');
 const text=blocks[0]+row('A')+'\n'+blocks[1]+row('D')+'\n'+blocks[2]+row('E');
 const selected=chosenAnswerSection(text,'004. PROVA OBJETIVA\nANALISTA DE INFORMÁTICA');
 assert.equal(selected.section,'004');
 assert.equal(selected.error,null);
 const key=parseKey(selected.text);
 assert.equal(Object.keys(key).length,50);
 assert.equal(key[1],'D');assert.equal(key[50],'D');
 const mismatch=chosenAnswerSection(text,'009. PROVA OBJETIVA\nANALISTA JUDICIÁRIO');
 assert.ok(mismatch.error);
});
test('metadados da Câmara de Votorantim usam ano registrado no gabarito',()=>{
 const info=inferExamMetadata('004. PROVA OBJETIVA\nANALISTA DE INFORMÁTICA','analista_de_informatica.pdf','CÂMARA MUNICIPAL DE VOTORANTIM\n24 julho de 2026\nFundação Vunesp');
 assert.equal(info.year,'2026');
 assert.equal(info.banca,'VUNESP');
 assert.equal(info.orgao,'CMVOTORANTIM');
 assert.deepEqual(info.missing,[]);
});
test('validação bloqueia provas com questões faltantes ou com gabarito de outro cargo',()=>{
 const qs=[{originalNumber:1,options:'ABCDE'.split('').map(letter=>({letter,text:'Resposta'}))},{originalNumber:3,options:'ABCDE'.split('').map(letter=>({letter,text:'Resposta'}))}];
 const issues=questionIntegrity(qs,{1:'A',3:'C'},3);
 assert.ok(issues.some(x=>x.includes('Questão ausente: 2')));
 assert.ok(issues.some(x=>x.includes('Foram identificadas 2')));
});

test('tabela MAC conceitual não exige captura de imagem, mas tabela gráfica exige',()=>{
 const texts=[
  '34. Um analista instalou um switch Ethernet. A tabela MAC desse switch se destina a:',
  'A) Consultar dados', 'B) Filtrar dados', 'C) Encaminhar dados', 'D) Copiar dados', 'E) Apagar dados',
  '35. Considere a tabela a seguir:', 'A) 1', 'B) 2', 'C) 3', 'D) 4', 'E) 5'
 ];
 const lines=texts.map((text,i)=>({col:0,y:i*16+35,text}));
 const parsed=spatialQuestions([{number:12,width:595,height:842,lines}]);
 assert.equal(parsed.questions.length,2);
 assert.equal(parsed.questions[0].imageOnly,false);
 assert.equal(parsed.questions[1].imageOnly,true);
 assert.deepEqual(parsed.questions[0].options.map(a=>a.letter),['A','B','C','D','E']);
});
