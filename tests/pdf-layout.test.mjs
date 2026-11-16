import test from 'node:test';
import assert from 'node:assert/strict';
import {spatialLines,spatialQuestions,chosenAnswerSection,parseGridKey,questionIntegrity,humanizePdfText,attachSuperscriptOrdinals,formatQuestionStem} from '../pdf-layout.mjs';
import {parseKey,inferExamMetadata,classifyByExamDivision} from '../core.mjs';
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


test('Q9: cada passagem do enunciado aparece numa linha independente',()=>{
 const original=[
  'Considere as passagens:',
  '• A Índia bloqueia avanços em temas sensíveis, como',
  'tributação digital. (2º parágrafo)',
  '• Ainda assim, o comércio global não desacelerou na',
  'mesma proporção. (3º parágrafo)',
  '• As regras não desapareceram, mas já não dependem',
  'do fórum que as consolidou. (4º parágrafo)',
  '• Isso exige flexibilidade para contornar bloqueios, mas',
  'também algum esforço de coordenação... (5º parágrafo)',
  'As expressões destacadas estabelecem relações de sentido de:'
 ];
 const formatted=formatQuestionStem(original);
 assert.equal(formatted.split('\n').filter(line=>line.trim().startsWith('•')).length,4);
 assert.match(formatted,/passagens:\n\n•/);
 assert.match(formatted,/\(5º parágrafo\)\n\nAs expressões/);
 assert.ok(!/parágrafo\) •/.test(formatted));
});
test('Q37: linhas com nomes e hashes são mantidas separadas',()=>{
 const source=[
  'O trecho a seguir foi obtido por um usuário malicioso.',
  'alice 3102125cae72c19f215480ddf2d0d5c3',
  'bob e10adc3949ba59abbe56e057f20f883e',
  'jason 3102125cae72c19f215480ddf2d0d5c3',
  'mike 688c5070d220ad89af28a7b7eb999352',
  'Considerando as informações apresentadas, assinale a alternativa correta.'
 ];
 const result=formatQuestionStem(source);
 assert.equal(result.split('\n').filter(x=>/^(?:alice|bob|jason|mike) [0-9a-f]{32}$/i.test(x)).length,4);
 assert.match(result,/mike 688c5070d220ad89af28a7b7eb999352\n\nConsiderando/);
});
test('sobrescritos da VUNESP reconstroem 2º parágrafo sem o isolado',()=>{
 const H=841.89;
 const item=(str,x,y,width,height=9.5)=>({str,transform:[1,0,0,height,x,H-y],width,height});
 const rows=spatialLines([
  item('tributação digital. (2',329.3,64,82.9),
  item('o',412.2,60.3,3.7,6.6),
  item(' parágrafo)',415.9,64,47)
 ],595.28,H);
 assert.deepEqual(rows.map(r=>r.text),['tributação digital. (2º parágrafo)']);
});
test('Q21 e Q22: o ordinal da questão seguinte não invade a alternativa E anterior',()=>{
 const H=841.89;
 const item=(str,x,y,width,height=9.5)=>({str,transform:[1,0,0,height,x,H-y],width,height});
 const rows=spatialLines([
  item('(E) Mesa Diretora.',51,245,100),
  item('22. Considerando o que dispõe a Resolução n',34,283,197.5),
  item('o',231.5,279.3,3.7,6.6),
  item(' 04, de 26 de',235.2,283,60)
 ],595.28,H);
 assert.equal(rows.length,2);
 assert.equal(rows[0].text,'(E) Mesa Diretora.');
 assert.match(rows[1].text,/Resolução nº 04,/);
 assert.ok(!rows.some(r=>r.text==='o'));
});
test('Q4 e Q5: o ordinal da nova questão não se junta à resposta de crase',()=>{
 const H=841.89;
 const item=(str,x,y,width,height=9.5)=>({str,transform:[1,0,0,height,x,H-y],width,height});
 const rows=spatialLines([
  item('(E) à ... às ... a ... à ... à',51,245,122),
  item('05. Considere as passagens do 1',34,296.4,142.7),
  item('o',176.7,292.7,3.7,6.6),
  item(' parágrafo:',180.4,296.4,42)
 ],595.28,H);
 assert.equal(rows[0].text,'(E) à ... às ... a ... à ... à');
 assert.match(rows[1].text,/passagens do 1º parágrafo/);
});
test('sem estrutura ordinal, um artigo o legítimo não é apagado',()=>{
 const H=841.89;
 const item=(str,x,y,width,height=9.5)=>({str,transform:[1,0,0,height,x,H-y],width,height});
 const rows=spatialLines([item('o',60,130,5,9.5),item('professor',72,130,50,9.5)],595.28,H);
 assert.equal(rows[0].text,'o professor');
});


test('Quadrix: título QUESTÃO 1 sem pontuação e texto de apoio na coluna oposta',()=>{
 const pg={number:1,width:595.28,height:841.89,lines:[]};
 const put=(col,y,text)=>pg.lines.push({col,y,text,x:col?320:36});
 put(0,60,'Texto para as questões de 1 a 15.');
 put(0,78,'A evolução das tecnologias de informação, aliada');
 put(0,96,'à crescente capacidade de coleta e armazenamento de dados.');
 put(1,62,'QUESTÃO 1');
 put(1,84,'A respeito da tese e das ideias defendidas no texto, infere-se que');
 'ABCDE'.split('').forEach((l,i)=>put(1,112+i*22,'('+l+') Alternativa '+l+'.'));
 put(1,284,'QUESTÃO 2');
 put(1,310,'No que concerne às estratégias argumentativas, o texto emprega');
 'ABCDE'.split('').forEach((l,i)=>put(1,341+i*22,'('+l+') Alternativa '+l+'.'));
 const result=spatialQuestions([pg]);
 assert.deepEqual(result.questions.map(q=>q.originalNumber),[1,2]);
 assert.equal(result.contexts.length,1);
 assert.deepEqual(result.questions[0].contextRange,[1,15]);
 assert.match(result.questions[0].contextText,/A evolução das tecnologias/);
 assert.equal(result.questions[1].options.length,5);
});
test('Quadrix: títulos QUESTÃO N até 50 geram cinquenta enunciados e cinco alternativas',()=>{
 const pages=[];
 for(let p=0;p<10;p++){
  const page={number:p+1,width:595.28,height:841.89,lines:[]};
  for(let n=p*5+1;n<=p*5+5;n++){
   const at=n-p*5-1,col=at<3?0:1,y=50+(at%3)*225;
   page.lines.push({col,y,text:'QUESTÃO '+n});
   page.lines.push({col,y:y+18,text:'Assinale a única alternativa correta.'});
   for(let i=0;i<5;i++)page.lines.push({col,y:y+41+21*i,text:'('+String.fromCharCode(65+i)+') Resposta '+i+'.'});
  }
  pages.push(page);
 }
 const qs=spatialQuestions(pages).questions;
 assert.equal(qs.length,50);
 assert.deepEqual(qs.map(q=>q.originalNumber),Array.from({length:50},(_,i)=>i+1));
 assert.ok(qs.every(q=>q.options.map(o=>o.letter).join('')==='ABCDE'));
});
test('gabarito Quadrix seção 2.7 código 401 usa exatamente 50 respostas do Analista',()=>{
 const values1='B A E C B D C D A E E A B C D B D A E C B A D E C'.split(' ');
 const values2='B D A C E C A B D E B D A C E C A B D E B D B E C'.split(' ');
 const nums=s=>Array.from({length:25},(_,i)=>i+s).join(' ');
 const make=(cargo,code,a,b)=>'2.'+(code===401?'7':'8')+' '+cargo+' (CÓDIGO '+code+')\n'+nums(1)+'\n'+a.join(' ')+'\n'+nums(26)+'\n'+b.join(' ')+'\n';
 const keyPDF=make('ANALISTA DE INFORMÁTICA',401,values1,values2)+make('CONTADOR',402,Array(25).fill('E'),Array(25).fill('D'));
 const examText='CONSELHO REGIONAL DE QUÍMICA DA 5ª REGIÃO\nQuadrix | 2026\nAnalista de Informática';
 const chosen=chosenAnswerSection(keyPDF,examText);
 assert.equal(chosen.section,'401');
 assert.equal(chosen.format,'grid');
 assert.equal(chosen.error,null);
 const key=parseGridKey(chosen.text);
 assert.equal(Object.keys(key).length,50);
 assert.equal(key[1],'B');assert.equal(key[2],'A');assert.equal(key[25],'C');
 assert.equal(key[26],'B');assert.equal(key[50],'C');
 assert.equal(chosenAnswerSection(keyPDF,'Prova sem cargo identificável').error!==null,true);
 assert.deepEqual(parseGridKey('1 2 3\nA B C'),{},'Gabarito incompleto deve ser recusado.');
});
test('Quadrix CRQ-V 2026 identifica órgão e disciplina conforme divisão do gabarito',()=>{
 const meta=inferExamMetadata('CONSELHO REGIONAL DE QUÍMICA DA 5ª REGIÃO\nQuadrix | 2026\nAnalista de Informática',
  'analista_de_informatica (2).pdf','','gabarito (2).pdf');
 assert.equal(meta.orgao,'CRQ-V');assert.equal(meta.banca,'QUADRIX');assert.equal(meta.year,'2026');
 assert.deepEqual(meta.missing,[]);
 const wrong={discipline:'Informática',disciplineCode:'IN',topic:'Geral',topicCode:'G'};
 const p=classifyByExamDivision({originalNumber:1},meta,wrong);
 const m=classifyByExamDivision({originalNumber:16},meta,wrong);
 const t=classifyByExamDivision({originalNumber:26},meta,wrong);
 assert.equal(p.discipline,'Língua Portuguesa');
 assert.equal(m.discipline,'Raciocínio Lógico e Matemática');
 assert.equal(t.discipline,'Informática');
});
