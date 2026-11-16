import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,stripExamFooter,normalizeState,addExam,upgradeRecoveredExam,findPreviouslyImportedExam,parseExamText,parseKey,inferExamMetadata,completeExamMetadata,classifyByExamDivision,repeatedSupportText,sameQuestion,recordAttempt,outcome,stats,createSimulation,finishSimulation,simulationResult,filtered,prioritize} from '../core.mjs';
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


test('marcas do PCI e rascunho não grudam as questões 18 e 19',()=>{
 const raw=[
  'MATEMÁTICA',
  '18. Uma loja vende estes seis produtos: F, G, H, J, K e L.',
  'A) R$ 45,00.',
  'B) R$ 46,00.',
  'C) R$ 47,00.',
  'D) R$ 48,00.',
  'E) R$ 49,00.',
  'www.pciconcursos.com.br',
  'pcimarkpci',
  'MDAwMDAwOjAwMDA6MDAwMDowMDAwOmZmZmY6MmRiZTo4ZWZh',
  'r a s c u n H o 19. Considere a tabela a seguir:',
  'VENDEDORES NÚMERO DE UNIDADES VENDIDAS',
  'A vendedora Cátia vende 2x unidades e a média aritmética é...',
  'A) 6.', 'B) 7.', 'C) 8.', 'D) 9.', 'E) 10.'
 ].join('\n');
 const x=parseExamText(raw);
 assert.deepEqual(x.map(q=>q.originalNumber),[18,19]);
 assert.equal(x[0].options.length,5);assert.equal(x[1].options.length,5);
 assert.equal(x[0].options[4].text,'R$ 49,00.');
 assert.equal(x[0].discipline,'Matemática');
 assert.equal(x[1].discipline,'Matemática');
});
test('identificar disciplinas pelo enunciado, não por cabeçalho contaminado',()=>{
 const cases=[
  ['As vírgulas são empregadas nas três passagens com a função de separar','Língua Portuguesa'],
  ['Um ataque de ransomware criptografou arquivos com AES-256 e RSA-2048','Informática'],
  ['O protocolo responsável por distribuir endereços IP automaticamente é o','Informática'],
  ['No sistema operacional Windows 11, as permissões de uma pasta são','Informática'],
  ['O editorial deixa claro que a falta de consenso entre os países-membros','Língua Portuguesa'],
  ['Tendo em vista a Resolução n o 04 da Câmara Municipal de Votorantim','Legislação']
 ];
 for(const [stem,discipline] of cases){
  const parsed=parseExamText('CIÊNCIAS\n1. '+stem+'\nA) Sim\nB) Não');
  assert.equal(parsed[0].discipline,discipline,stem);
 }
});
test('marcadores de página preservam referência sem invadir os enunciados',()=>{
 const parsed=parseExamText('[[PAGE:2]]\n1. Considere a tabela a seguir:\nA) 5\nB) 6\n[[PAGE:3]]\n2. O que é DHCP?\nA) DNS\nB) DHCP');
 assert.equal(parsed.length,2);assert.equal(parsed[0].sourcePage,2);assert.equal(parsed[1].sourcePage,3);
 assert.ok(!parsed[0].stem.includes('[[PAGE'));
});


test('texto de apoio repetido aparece aberto na primeira questão e pode ser recolhido nas seguintes',()=>{
 const first={examId:'prova-1',originalNumber:1,contextText:'Leia o texto para responder às questões 1 a 5.',contextRange:[1,5]};
 const next={...first,originalNumber:2};
 const another={...first,examId:'prova-2',originalNumber:3};
 const changed={...first,contextText:'Outro texto de apoio',originalNumber:4};
 assert.equal(repeatedSupportText(null,first),false,'Primeira da seleção mostra texto');
 assert.equal(repeatedSupportText(first,next),true,'Contíguas da mesma prova e texto podem recolher');
 assert.equal(repeatedSupportText(first,another),false,'Provas diferentes não compartilham texto');
 assert.equal(repeatedSupportText(first,changed),false,'Passagens diferentes ficam visíveis');
 assert.equal(repeatedSupportText({examId:'prova-1'},first),false,'Sem texto anterior, manter visível');
});
test('texto de apoio volta a abrir quando outra questão quebra a sequência',()=>{
 const q1={examId:'prova-1',contextText:'Texto comum',contextRange:[1,5]};
 const independent={examId:'prova-1',contextText:'',contextRange:null};
 const q3={...q1,originalNumber:3};
 assert.equal(repeatedSupportText(q1,independent),false);
 assert.equal(repeatedSupportText(independent,q3),false);
});


test('reimportar caderno FEPESE recupera texto sem duplicar ou perder respostas',()=>{
 const state=fresh();
 const examInfo={title:'2026 — FEPESE — PM-BRUSQUE — Analista de Informática',
  year:'2026',banca:'FEPESE',orgao:'PM-BRUSQUE'};
 const letters='ABCDE'.split('');
 const oldItems=Array.from({length:40},(_,i)=>({
  originalNumber:i+1,sourcePage:Math.floor(i/2)+3,
  stem:'Enunciado original da questão '+(i+1),
  options:letters.map(letter=>({letter,text:''})),
  imageOnly:true,pageImage:'data:image/jpeg;base64,abc',
  extractionReview:true,extractionFallback:true,
  discipline:'Informática',disciplineCode:'IN',topic:'Geral',topicCode:'G'
 }));
 const key=Object.fromEntries(oldItems.map(x=>[x.originalNumber,'C']));
 const exam=addExam(state,examInfo,oldItems,key);
 const first=state.questions[0];
 recordAttempt(state,'perfil',first.id,'C');
 const sim=createSimulation(state,'perfil',state.questions.slice(0,2));
 const previousAttempts=state.attempts.length;
 const upgraded=oldItems.map(q=>({
  ...q,options:letters.map(letter=>({letter,text:'Alternativa '+letter})),
  imageOnly:false,extractionReview:false,extractionFallback:undefined,
  pageImage:undefined
 }));
 const result=upgradeRecoveredExam(state,examInfo,upgraded,key);
 assert.equal(result.exam.id,exam.id);
 assert.equal(result.upgraded,40);
 assert.equal(state.exams.length,1);
 assert.equal(state.questions.length,40);
 assert.equal(state.questions[0].id,first.id);
 assert.equal(state.questions[0].code,first.code);
 assert.equal(state.questions[0].status,'active');
 assert.equal(state.questions[0].pageImage,undefined);
 assert.equal(state.questions[0].extractionFallback,undefined);
 assert.equal(state.attempts.length,previousAttempts);
 assert.equal(state.simulations[0].id,sim.id);
 assert.equal(state.simulations[0].questionIds[0],first.id);
 assert.equal(outcome(state,'perfil',state.questions[0]),'correct');
 assert.equal(findPreviouslyImportedExam(state,examInfo,upgraded,key)?.id,exam.id);
 assert.equal(upgradeRecoveredExam(state,examInfo,upgraded,key),null);
});
test('reimportação FEPESE não altera prova ambígua ou de outro gabarito',()=>{
 const state=fresh(),meta={title:'FEPESE S01',year:'2026',banca:'FEPESE',orgao:'PM-BRUSQUE'};
 const make=(stem,review)=>({originalNumber:1,sourcePage:3,stem,
   options:'ABCDE'.split('').map(letter=>({letter,text:review?'':'Opção '+letter})),
   extractionFallback:review,extractionReview:review,
   status:review?'needs-review':'active',pageImage:review?'data:image/jpeg;base64,abc':undefined,
   discipline:'Língua Portuguesa',disciplineCode:'LP',topic:'Geral',topicCode:'G'});
 const exam=addExam(state,meta,[make('Questão sobre uma lei',true)],{1:'B'});
 const prior=state.questions[0];
 assert.equal(upgradeRecoveredExam(state,meta,[make('Outro enunciado',false)],{1:'B'}),null);
 assert.equal(upgradeRecoveredExam(state,meta,[make('Questão sobre uma lei',false)],{1:'C'}),null);
 assert.equal(state.questions[0],prior);
 assert.equal(state.exams[0].id,exam.id);
});

test('VUNESP/UNESP: capa e gabarito identificam banca, instituição, ano e cargo 002',()=>{
 const cover='002. Prova\nObjetiva\nanalista de informática II\nárea de atuação: desenvolvimento de\nsistemas institucionais\n'+
 '40 questões objetivas.\nVNSP2511/002-AnInfor-II-DesenvSistemasInstitucionais';
 const key='UNIVERSIDADE ESTADUAL PAULISTA “JÚLIO DE MESQUITA FILHO” – UNESP\n'+
 'EDITAL Nº 046/2026 DE DIVULGAÇÃO DO GABARITO\n';
 const m=inferExamMetadata(cover,'analista_de_informatica_ii_desenvolvimento_de_sistemas_institucionais.pdf',
  key,'gabarito (4).pdf');
 assert.equal(m.banca,'VUNESP');
 assert.equal(m.orgao,'UNESP');
 assert.equal(m.year,'2026');
 assert.ok(m.title.includes('Analista de Informática II'));
 assert.ok(m.title.includes('desenvolvimento de sistemas institucionais'));
 assert.deepEqual(m.missing,[]);
 for(const [n,code] of [[1,'LP'],[10,'LP'],[11,'RL'],[15,'RL'],[16,'LE'],[20,'LE'],[21,'IN'],[40,'IN']]){
  const guess={discipline:'Língua Portuguesa',disciplineCode:'LP',topic:'Geral',topicCode:'G'};
  const result=classifyByExamDivision({originalNumber:n},m,guess);
  assert.equal(result.disciplineCode,code,'Questão '+n);
 }
});

test('preenchimento manual resolve apenas metadados ausentes sem trocar informação reconhecida',()=>{
 const missing=inferExamMetadata('Caderno com 40 questões','prova.pdf','','gabarito.pdf');
 const fixed=completeExamMetadata(missing,{year:'2026',banca:'VUNESP',orgao:'UNESP'},2026);
 assert.deepEqual(fixed.missing,[]);
 assert.equal(fixed.title,'2026 — VUNESP — UNESP — prova');
 assert.equal(missing.banca,'NI');
 const known=inferExamMetadata('VNSP2511/002\nUNESP\n2026','prova.pdf','','gabarito.pdf');
 const protectedMeta=completeExamMetadata(known,{year:'2021',banca:'OUTRA',orgao:'OUTRO'},2026);
 assert.equal(protectedMeta.year,'2026');
 assert.equal(protectedMeta.banca,'VUNESP');
 assert.equal(protectedMeta.orgao,'UNESP');
 assert.throws(()=>completeExamMetadata(missing,{year:'9999'},2026),/Ano informado inválido/);
 assert.throws(()=>completeExamMetadata(missing,{orgao:'x'},2026),/nome válido/);
});


test('CISCOPAR: identifica Legalle, órgão, cargo e disciplinas com textos reais da prova',()=>{
 const cover='CADERNO DE PROVA\nConsórcio Intermunicipal de Saúde\nCosta Oeste do Paraná - CISCOPAR\n'+
  'Concurso Público 01/2026\nANALISTA EM IN FORMATICA\neleggll*\n50 questões\n4 alternativas';
 const key='CONSÓRCIO INTERMUNICIPAL DE SAÚDE COSTA OESTE DO PARANÁ - CISCOPAR\n'+
  'CONCURSO PÚBLICO 01/2026\nAnalista em Informática - Tabela 3';
 const m=inferExamMetadata(cover,'analista_em_informatica.pdf',key,'gabarito_definitivo.pdf');
 assert.equal(m.banca,'LEGALLE');
 assert.equal(m.orgao,'CISCOPAR');
 assert.equal(m.year,'2026');
 assert.equal(m.title,'2026 — LEGALLE — CISCOPAR — Analista em Informática');
 assert.deepEqual(m.missing,[]);
 const ranges=[[1,'LP'],[10,'LP'],[11,'MA'],[13,'MA'],[14,'IN'],[16,'IN'],[17,'LE'],[20,'LE'],[21,'IN'],[50,'IN']];
 for(const [n,code] of ranges){
  const guessed={discipline:'Língua Portuguesa',disciplineCode:'LP',topic:'Geral',topicCode:'G'};
  assert.equal(classifyByExamDivision({originalNumber:n},m,guessed).disciplineCode,code,'questão '+n);
 }
});


test('Objetiva 2026 Sossêgo: reconhece banca, prefeitura, cargo 202 e número de questões',()=>{
 const cover='MUNICÍPIO DE SOSSÊGO/PB\nConcurso Público nº 01/2026\n'+
  'https://concursos.objetivas.com.br\nCADERNO DE PROVA\n'+
  'Auxiliar de Serviços Gerais\nDireitos autorais reservados à Objetiva Concursos Ltda.\n'+
  'este caderno de prova, que contém 40 questões';
 const answer='MUNICÍPIO DE SOSSÊGO/PB\nCONCURSO PÚBLICO Nº 01/2026\nGABARITO PRELIMINAR\n'+
  'AUXILIAR DE SERVIÇOS GERAIS\n01) D 11) C 21) A 31) B';
 const meta=inferExamMetadata(cover,'auxiliar_de_servicos_gerais.pdf',answer,'gabarito(2).pdf');
 assert.equal(meta.banca,'OBJETIVA');
 assert.equal(meta.orgao,'PM-SOSSEGO');
 assert.equal(meta.year,'2026');
 assert.equal(meta.title,'2026 — OBJETIVA — PM-SOSSEGO — Auxiliar de Serviços Gerais');
 assert.deepEqual(meta.missing,[]);
 for(const [number,discipline] of [[1,'LP'],[15,'LP'],[16,'MA'],[25,'MA'],[26,'CE'],[40,'CE']]){
  const inferred={discipline:'Geral',disciplineCode:'CG',topic:'Geral',topicCode:'G'};
  const updated=classifyByExamDivision({originalNumber:number},meta,inferred);
  assert.equal(updated.disciplineCode,discipline,'Questão '+number);
 }
});


test('FCPC / Câmara de Aracati: metadados e blocos oficiais das 50 questões',()=>{
 const exam='CÂMARA MUNICIPAL DE ARACATI\nFUNDAÇÃO CEARENSE DE PESQUISA E CULTURA – FCPC\n'+
 'EDITAL Nº 001\nAuxiliar de Serviços Gerais\nInstruções\n'+
 'Data: 30 de agosto de 2026.\n50 (cinquenta) questões';
 const key='CÂMARA MUNICIPAL DE ARACATI\nFUNDAÇÃO CEARENSE DE PESQUISA E CULTURA – FCPC\n'+
 'GABARITO PRELIMINAR\nAuxiliar de Serviços Gerais';
 const meta=inferExamMetadata(exam,'auxiliar_de_servicos_gerais (1).pdf',key,'gabarito (1)(1).pdf');
 assert.equal(meta.banca,'FCPC');
 assert.equal(meta.orgao,'CM-ARACATI');
 assert.equal(meta.year,'2026');
 assert.equal(meta.title,'2026 — FCPC — CM-ARACATI — Auxiliar de Serviços Gerais');
 assert.deepEqual(meta.missing,[]);
 const guessed={discipline:'Geral',disciplineCode:'CG',topic:'Geral',topicCode:'G'};
 for(const [n,code] of [[1,'LP'],[10,'LP'],[11,'LE'],[20,'LE'],[21,'CE'],[50,'CE']]){
  const answer=classifyByExamDivision({originalNumber:n},meta,guessed);
  assert.equal(answer.disciplineCode,code,'questão '+n);
 }
});


test('FEPESE F1 2026: identifica CIS Grande Florianópolis e os quatro blocos do caderno',()=>{
 const cover='Consórcio Público Interfederativo de Saúde da Região da Grande Florianópolis\n'+
  'Concurso Público • Edital 001/2026\n'+
  'https://2026cpcisgranfpolis.fepese.org.br\nF1 Auxiliar de Serviços Gerais\n'+
  'Para cada questão são apresentadas 5 alternativas\n16 de agosto • 35 questões';
 const key='16 de agosto de 2026\nEmprego Público com exigência de ensino fundamental\n'+
  'F1 Auxiliar de Serviços Gerais\n1 2 3 4 5 6 7 8 9 10 11\nc e b a d a d c a b e';
 const m=inferExamMetadata(cover,'auxiliar_de_servicos_gerais (2).pdf',key,'gabarito (2)(2).pdf');
 assert.equal(m.year,'2026');
 assert.equal(m.banca,'FEPESE');
 assert.equal(m.orgao,'CIS-GRANFPOLIS');
 assert.equal(m.title,'2026 — FEPESE — CIS-GRANFPOLIS — Auxiliar de Serviços Gerais');
 assert.deepEqual(m.missing,[]);
 const guessed={discipline:'Geral',disciplineCode:'CG',topic:'Geral',topicCode:'G'};
 const cases=[
  [1,'LP','Língua Portuguesa'],[5,'LP','Língua Portuguesa'],
  [6,'CG','Conhecimentos Gerais'],[10,'CG','Conhecimentos Gerais'],
  [11,'CE','Higiene e Segurança no Trabalho'],[15,'CE','Higiene e Segurança no Trabalho'],
  [16,'CE','Conhecimentos específicos'],[35,'CE','Conhecimentos específicos']
 ];
 for(const [n,code,title] of cases){
  const category=classifyByExamDivision({originalNumber:n},m,guessed);
  assert.equal(category.disciplineCode,code,'código '+n);
  assert.equal(category.discipline,title,'disciplina '+n);
 }
});


test('Objetiva Sossego Q21: rodapé acidental é retirado sem perder alternativa, gabarito ou tentativas',()=>{
 const wrong='E - C - C. www.objetivas.com.br';
 assert.equal(stripExamFooter(wrong),'E - C - C.');
 assert.equal(stripExamFooter('E - C - C. \nwww.objetivas.com.br'),'E - C - C.');
 assert.equal(stripExamFooter('E - C - C. WWW.OBJETIVAS.COM.BR'),'E - C - C.');
 assert.equal(stripExamFooter('Acesse www.objetivas.com.br para verificar o edital'),'Acesse www.objetivas.com.br para verificar o edital');
 assert.equal(stripExamFooter('https://www.exemplo.com.br'),'https://www.exemplo.com.br');
 assert.equal(stripExamFooter('E - C - C.  '),'E - C - C.  ');
 const data=fresh();
 const id='q-sossego-21';
 data.questions.push({
  id,code:'Q2026MAGOBJETIVAPMSOSSEGO6',
  originalNumber:21,stem:'Avaliar se as afirmativas são certas (C) ou erradas (E).',
  options:[
   {letter:'A',text:'C - C - E.'},
   {letter:'B',text:'E - E - C.'},
   {letter:'C',text:'C - E - E.'},
   {letter:'D',text:wrong}
  ],answer:'A',examId:'sossego-2026',discipline:'Matemática'
 });
 data.attempts.push({id:'a-21',profileId:'perfil1',questionId:id,answer:'A',at:'2026-11-16T00:00:00Z'});
 data.exams.push({id:'sossego-2026',questionIds:[id],title:'Prova da Objetiva'});
 const backup=JSON.stringify(data);
 const fixed=normalizeState(data);
 const q=fixed.questions[0];
 assert.equal(q.options[3].text,'E - C - C.');
 assert.equal(q.options[0].text,'C - C - E.');
 assert.equal(q.answer,'A');
 assert.equal(q.code,'Q2026MAGOBJETIVAPMSOSSEGO6');
 assert.equal(q.originalNumber,21);
 assert.deepEqual(fixed.attempts,data.attempts);
 assert.deepEqual(fixed.exams,data.exams);
 assert.equal(JSON.stringify(data),backup,'normalização não altera objeto do banco original');
 assert.deepEqual(normalizeState(fixed),fixed,'reparação idempotente');
});


test('Legalle 2026 Cândido Godói: metadados detectados pelo gabarito e pela capa sem identificação manual',()=>{
 const cover='[[PAGE:1]]\nAUXILIAR DE SERVIÇOS GERAIS\n'+
  'Município de Cândido Godói/RS\nConcurso Público 01/2026\n'+
  'PROVA TEÓRICO-OBJETIVA\n40 questões\n4 alternativas\n'+
  'RASCUNHO PARA GABARITO';
 const answer='[[PAGE:1]]\nPREFEITURA MUNICIPAL DE CÂNDIDO GODÓI\n'+
  'CONCURSO PÚBLICO 01/2026\nwww.institutolegalle.org.br\n'+
  'GABARITOS PRELIMINARES\nAuxiliar de Serviços Gerais\n'+
  '01) C 02) B 03) A 04) C 05) B 06) C';
 const result=inferExamMetadata(cover,'auxiliar_de_servicos_gerais (3).pdf',
  answer,'gabarito (3)(2).pdf');
 assert.equal(result.year,'2026');
 assert.equal(result.banca,'LEGALLE');
 assert.equal(result.orgao,'PM-CANDIDO-GODOI');
 assert.deepEqual(result.missing,[]);
 assert.equal(result.title,'2026 — LEGALLE — PM-CANDIDO-GODOI — Auxiliar de Serviços Gerais');
});


test('Legalle Cândido Godói: blocos originais da prova 1–15, 16–25, 26–30 e 31–40',()=>{
 const meta={banca:'LEGALLE',orgao:'PM-CANDIDO-GODOI',
  title:'2026 — LEGALLE — PM-CANDIDO-GODOI — Auxiliar de Serviços Gerais'};
 const guessed={discipline:'Não classificada',disciplineCode:'NC',topic:'Geral',topicCode:'G'};
 const expected=[
  [1,'LP','Língua Portuguesa'],[15,'LP','Língua Portuguesa'],
  [16,'RL','Raciocínio Lógico e Matemática'],
  [25,'RL','Raciocínio Lógico e Matemática'],
  [26,'CG','Atualidades'],[30,'CG','Atualidades'],
  [31,'LE','Legislação'],[40,'LE','Legislação']
 ];
 for(const [n,code,name] of expected){
  const result=classifyByExamDivision({originalNumber:n},meta,guessed);
  assert.equal(result.disciplineCode,code,'questão '+n);
  assert.equal(result.discipline,name,'questão '+n);
 }
 assert.equal(classifyByExamDivision({originalNumber:41},meta,guessed).disciplineCode,'NC');
});


test('Pouso Alto/MG 2025: logotipo Consulplan sem texto é suprido pelo cadastro verificado do edital',()=>{
 const cover='[[PAGE:1]]\nCâmara Municipal de Pouso Alto/MG\n'+
  'CONCURSO PÚBLICO | Edital nº 01/2025\n'+
  'auxiliar de serviços gerais\nTipo 1 – Branca\n'+
  'Este caderno de provas é composto por trinta questões objetivas.\n'+
  'quatro opções de resposta';
 const key='[[PAGE:7]]\nGabarito Preliminar\nConcurso Público\n'+
  'Câmara Municipal de Pouso Alto/MG\n'+
  'AUXILIAR DE SERVIÇOS GERAIS\nPROVA TIPO 1 – BRANCA';
 const result=inferExamMetadata(cover,'auxiliar_de_servicos_gerais (4).pdf',
  key,'gabarito (4)(1).pdf');
 assert.equal(result.year,'2025');
 assert.equal(result.banca,'CONSULPLAN');
 assert.equal(result.orgao,'CM-POUSO-ALTO');
 assert.deepEqual(result.missing,[]);
 assert.equal(result.title,'2025 — CONSULPLAN — CM-POUSO-ALTO — Auxiliar de Serviços Gerais');
 const other=inferExamMetadata(cover.replace('01/2025','02/2025'),
  'auxiliar_de_servicos_gerais.pdf',key,'gabarito.pdf');
 assert.equal(other.banca,'NI','outro edital não herda banca a partir do órgão');
 const anotherYear=inferExamMetadata(cover.replaceAll('2025','2024'),
  'auxiliar_de_servicos_gerais.pdf',key.replaceAll('2025','2024'),'gabarito.pdf');
 assert.equal(anotherYear.banca,'NI');
});

test('Pouso Alto: Português 1–10, Informática 11–20 e Conhecimentos Gerais 21–30',()=>{
 const meta={year:'2025',banca:'CONSULPLAN',orgao:'CM-POUSO-ALTO',
  title:'2025 — CONSULPLAN — CM-POUSO-ALTO — Auxiliar de Serviços Gerais'};
 const guessed={discipline:'Não classificada',disciplineCode:'NC',topic:'Geral',topicCode:'G'};
 for(const [number,code,name] of [
  [1,'LP','Língua Portuguesa'],[10,'LP','Língua Portuguesa'],
  [11,'IN','Informática'],[20,'IN','Informática'],
  [21,'CG','Conhecimentos Gerais'],[30,'CG','Conhecimentos Gerais']]){
  const result=classifyByExamDivision({originalNumber:number},meta,guessed);
  assert.equal(result.disciplineCode,code,'questão '+number);
  assert.equal(result.discipline,name,'questão '+number);
 }
 assert.equal(classifyByExamDivision({originalNumber:31},meta,guessed).disciplineCode,'NC');
});
