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
