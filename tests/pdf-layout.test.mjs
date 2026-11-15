import test from 'node:test';
import assert from 'node:assert/strict';
import {spatialLines,spatialQuestions,chosenAnswerSection,questionIntegrity,humanizePdfText} from '../pdf-layout.mjs';
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


test('PDF de duas colunas não mantém hifens de fim de linha nem estreita texto na tela',()=>{
 assert.equal(humanizePdfText('IPSec é usado para esta-\nbelecer comunicação em redes'), 'IPSec é usado para estabelecer comunicação em redes');
 assert.equal(humanizePdfText('A Procuradoria da Câmara Municipal, ten-\ndo em vista a Resolução'), 'A Procuradoria da Câmara Municipal, tendo em vista a Resolução');
 assert.equal(humanizePdfText('Uma rede tem 5 pontos\ncom conectividade segura'), 'Uma rede tem 5 pontos com conectividade segura');
});
test('símbolos de fonte privada só viram setas onde o contexto identifica menus',()=>{
 const u='\uF0E0';
 assert.equal(humanizePdfText('Guia '+u+' Item de menu'),'Guia → Item de menu');
 assert.equal(humanizePdfText('Inserir '+u+' Objeto OLE'),'Inserir → Objeto OLE');
 assert.equal(humanizePdfText('Figura '+u+' Retângulo'),'Figura '+u+' Retângulo');
});
test('fração vertical 3 sobre 8 é reconstituída como 3/8 sem alterar a tabela numérica',()=>{
 const text=(str,x,y,width=5)=>({str,transform:[1,0,0,1,x,842-y],width});
 const items=[
 text('A razão de homens é ',51,244,112),
 text('3',164.6,240.3,5.4),
 text('8',164.5,254.3,5.4),
 text('. Com a intenção de aumentar',171.7,244.2,120),
 ];
 const rows=spatialLines(items,595,842);
 assert.match(rows.map(r=>r.text).join(' '),/3\/8/);
 assert.equal(rows.map(r=>r.text).join(' ').match(/3\/8/g).length,1);
 const table=[text('ANO',55,100,32),text('2022',120,100,22),text('2023',120,114,22)];
 assert.ok(!spatialLines(table,595,842).some(r=>r.text.includes('2022/2023')));
});
test('figura interna mantém texto antes e depois e alternativas separadas',()=>{
 const source=[
 {text:'17. O desenho representa um terreno.',y:25,col:0},
 {text:'AB = 2x e CD = x.',y:43,col:0},
 {text:'(Imagem usada com autorização)',y:258,col:0},
 {text:'O perímetro deste terreno é',y:278,col:0},
 ...['A','B','C','D','E'].map((l,i)=>({text:'('+l+') Intervalo '+i,y:320+i*20,col:0}))
 ];
 const q=spatialQuestions([{number:8,width:595,height:842,lines:source}]).questions[0];
 assert.equal(q.imageOnly,true);
 assert.ok(q.visualSegments);
 assert.match(q.visualSegments.beforeText,/desenho/);
 assert.match(q.visualSegments.afterText,/perímetro/);
 assert.deepEqual(q.options.map(o=>o.letter),['A','B','C','D','E']);
});

test('enunciado com texto de apoio remove hifenização e corrige espaços',()=>{
 const lines=[
  [20,'Leia o texto para responder às questões de 1 a 2:'],
  [34,'Comér-'],
  [47,'cio mundial e seus subsí dios continuam crescendo.'],
  [89,'1. De acordo com o texto, qual afirmação é correta?'],
  ...'ABCDE'.split('').map((l,i)=>[120+i*20,'('+l+') Alternativa'])
 ].map(([y,text])=>({col:0,y,text}));
 const parsed=spatialQuestions([{number:5,width:595,height:842,lines}]);
 assert.equal(parsed.contexts.length,1);
 assert.match(parsed.contexts[0].text,/Comércio mundial e seus subsídios/);
 assert.ok(!parsed.contexts[0].text.includes('Comér-'));
});
test('ordinais fragmentados por fonte do PDF não deixam um o solto nas alternativas',()=>{
 assert.equal(humanizePdfText('será criado após o 3 slide. o'),'será criado após o 3º slide.');
 assert.equal(humanizePdfText('clicou no 3o slide'),'clicou no 3º slide');
 assert.equal(humanizePdfText('o texto continua com o artigo o'),'o texto continua com o artigo o');
});
test('a questão 11 com fração simples permanece texto, sem imagem obrigatória',()=>{
 const q=spatialQuestions([{number:6,width:595,height:842,lines:[
  {col:0,y:60,text:'11. A aplicação aumentou 11/9 e depois o equivalente a 3/2 do valor inicial.'},
  ...'ABCDE'.split('').map((letter,i)=>({col:0,y:95+i*18,text:'('+letter+') R$ 500,00'}))
 ]}]).questions[0];
 assert.equal(q.imageOnly,false);
 assert.equal(q.options.length,5);
});
test('legendas de autorização não aparecem no texto nem no recorte do desenho 17',()=>{
 const rows=[
 [25,'17. O desenho a seguir, desenhado fora de escala, representa um terreno'],
 [36,'senta o contorno de um terreno cuja área é de 0,92 km².'],
 [49,'Referências métricas: AB=2x, AF=x+1, CD=x'],
 [61,'DE=x+2.'],
 [258,'(Arquivo pessoal; imagem usada com autorização)'],
 [278,'O perímetro desse terreno está inserido no intervalo de'],
 ...'ABCDE'.split('').map((x,i)=>[312+i*18,'('+x+') 7.100 a 7.399'])
 ].map(([y,text])=>({col:0,y,text}));
 const q=spatialQuestions([{number:8,width:595,height:842,lines:rows}]).questions[0];
 assert.equal(q.visualSegments.top,77);
 assert.equal(q.visualSegments.bottom,252);
 assert.equal(q.visualSegments.afterText,'O perímetro desse terreno está inserido no intervalo de');
 assert.ok(!/arquivo pessoal/i.test(q.stem));
});
test('imagem da questão 19 contempla apenas a tabela, sem legenda e parágrafos',()=>{
 const rows=[[25,'19. Considere a tabela a seguir:'],[49,'LOJA DE AUTOMÓVEIS'],
  ...[71,92,107,122,136,151,166,181,196,211,226,239].map(y=>[y,'VENDEDORES E UNIDADES VENDIDAS']),
  [247,'(Arquivo pessoal; imagem usada com autorização)'],
  [265,'Essa tabela apresenta a vendedora Neide com x unidades vendidas.'],
  [359,'Sendo assim, a diferença é igual a'],
  ...'ABCDE'.split('').map((x,i)=>[405+i*20,'('+x+') Número'])
 ].map(([y,text])=>({col:0,y,text}));
 const q=spatialQuestions([{number:9,width:595,height:842,lines:rows}]).questions[0];
 assert.equal(q.visualSegments.top,41);
 assert.equal(q.visualSegments.bottom,241);
 assert.equal(q.visualSegments.beforeText,'Considere a tabela a seguir:');
 assert.match(q.visualSegments.afterText,/Neide/);
 assert.ok(!/arquivo pessoal/i.test(q.stem));
});
test('imagem da questão 26 contempla só a planilha, mantendo fórmula em texto',()=>{
 const rows=[[60,'26. No Excel foi elaborada a seguinte planilha:'],
  [72,'considerando a versão 2016, uma planilha:'],
  [197,'Posteriormente, a seguinte fórmula foi inserida na célula A5'],
  [227,'=MÁXIMO(A1:C3)-MÍNIMO(B2:D4)'],
  [246,'O resultado é'],
  ...'ABCDE'.split('').map((x,i)=>[265+i*18,'('+x+') Número'])
 ].map(([y,text])=>({col:0,y,text}));
 const q=spatialQuestions([{number:11,width:595,height:842,lines:rows}]).questions[0];
 assert.equal(q.visualSegments.top,88);
 assert.equal(q.visualSegments.bottom,194);
 assert.match(q.visualSegments.afterText,/MÁXIMO\(A1:C3\)/);
});


test('questão 11 real: frações 11/9 ficam nas duas posições originais do enunciado',()=>{
 const height=841.89;
 const piece=(str,x,y,width)=>({str,transform:[1,0,0,1,x,height-y],width});
 const items=[
  piece('o rendimento obtido, de',51,88.5,103.6),
  piece('11',156.5,85.1,10.8),piece('9',158.8,99.2,5.4),
  piece('de X. Esses',168.9,88.5,57.1),
  piece('11',227.9,85.0,10.8),piece('9',230.2,99.0,5.4),
  piece('de X foram',240.4,88.5,52.8)
 ];
 const lines=spatialLines(items,595.28,height);
 assert.equal(lines.length,1);
 assert.equal(humanizePdfText(lines[0].text),
  'o rendimento obtido, de 11/9 de X. Esses 11/9 de X foram');
 assert.equal((lines[0].text.match(/11\/9/g)||[]).length,2);
});
test('questão 15 real: frações 3/8 e 7/8 preservam a ordem e o lugar nas frases',()=>{
 const height=841.89;
 const piece=(str,x,y,width)=>({str,transform:[1,0,0,1,x,height-y],width});
 const items=[
  piece('e o número de mulheres é',51,244.2,112.5),
  piece('3',164.6,240.3,5.4),piece('8',164.5,254.3,5.4),
  piece('. Com a intenção',171.7,244.2,118.8),
  piece('Para que a razão mencionada, que era',51,326.3,164.8),
  piece('3',217.4,322.6,5.4),piece('8',217.3,336.7,5.4),
  piece(', se tornasse',223.9,326.3,56.7),
  piece('7',281.4,322.6,5.4),piece('8',281.5,336.6,5.4),
  piece(',',287.9,326.3,5.4)
 ];
 const lines=spatialLines(items,595.28,height);
 assert.equal(lines.length,2);
 assert.equal(humanizePdfText(lines[0].text),'e o número de mulheres é 3/8. Com a intenção');
 assert.equal(humanizePdfText(lines[1].text),'Para que a razão mencionada, que era 3/8, se tornasse 7/8,');
 assert.equal((lines.map(l=>l.text).join(' ').match(/3\/8/g)||[]).length,2);
});
