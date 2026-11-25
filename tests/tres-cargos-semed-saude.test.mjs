import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SECRETARIA_CARGO_ID,PROGRAM_SECRETARIA,matchSecretariaTopic} from '../programa-semed-secretaria.mjs';
import {FOCUS_CARGOS,DEFAULT_CARGO,CATALOGS,allTopics,classifyForCargo,inEditalScope,subjectSummary} from '../edital-classification.mjs';

const exam={id:'prova',title:'Simulado IBGP',orgao:'Porto Velho/RO'};
const q=(disciplineCode,stem,topic='Geral')=>({
 id:'exemplo',disciplineCode,discipline:
  ({LP:'Língua Portuguesa',RL:'Raciocínio Lógico',CG:'Conhecimentos Gerais',LE:'Legislação',CE:'Conhecimentos Específicos',IN:'Informática'})[disciplineCode],
 stem,topic,options:'ABCDE'.split('').map(letter=>({letter,text:'Exemplo '+letter})),answer:'A',status:'active'
});

test('foco inicial nos três cargos dos dois editais retificados',()=>{
 assert.deepEqual(FOCUS_CARGOS,['519-552','343','240']);
 assert.equal(DEFAULT_CARGO,'519-552');
 assert.equal(SECRETARIA_CARGO_ID,'343');
 assert.equal(CATALOGS['343'].cargo,'Agente de Secretaria Escolar');
 assert.equal(CATALOGS['240'].cargo,'Auxiliar de Serviços de Saúde');
 assert.equal(PROGRAM_SECRETARIA.sections.length,5);
 assert.deepEqual(PROGRAM_SECRETARIA.sections.map(s=>s.id),
  ['portugues','raciocinio','gerais','legislacao','especificos']);
 assert.match(PROGRAM_SECRETARIA.edital,/24\/2026/);
 assert.equal(PROGRAM_SECRETARIA.pages,'1–2');
 assert.equal(CATALOGS['240'].pages,'1–2');
 assert.ok(allTopics('343').length>=55);
});

test('Legislação do cargo 343 aponta somente normas de Porto Velho e federais do seu edital',()=>{
 const examples=[
  ['Lei Orgânica do Município de Porto Velho, conforme o edital','legislacao:0'],
  ['Regime Jurídico dos Servidores - Lei 385/2010','legislacao:1'],
  ['Plano de Carreira da Educação - Lei nº 360/2009','legislacao:2'],
  ['Lei Brasileira de Inclusão 13.146/2015','legislacao:3'],
  ['Constituição Federal: direitos e garantias fundamentais','legislacao:4'],
  ['Constituição Federal: artigo 37 e administração pública','legislacao:5'],
  ['Licitações nos termos da Lei nº 14.133/2021','legislacao:6'],
  ['Lei de Acesso à Informação nº 12.527/2011','legislacao:7']
 ];
 for(const [stem,topicId] of examples){
  const item=q('LE',stem);
  const result=classifyForCargo(item,exam,'343');
  assert.equal(result.status,'dentro',stem);
  assert.equal(result.topicId,topicId,stem);
 }
 const foreign=q('LE','Lei Orgânica do Município de Candeias do Jamari');
 const result=classifyForCargo(foreign,exam,'343');
 assert.equal(result.status,'pendente');
 assert.match(result.reason,/outra localidade/);
});

test('Secretaria Escolar: arquivologia, escrituração, LDB, ECA e sistemas de gestão',()=>{
 const examples=[
  ['Conceitos de arquivamento escolar','especificos:0'],
  ['Administração de materiais e almoxarifado','especificos:1'],
  ['Prazo de guarda e conservação preventiva dos documentos','especificos:2'],
  ['Princípios e fins da LDB, Lei nº 9.394/1996','especificos:4'],
  ['Estatuto da Criança e do Adolescente (ECA)','especificos:5'],
  ['Projeto Político-Pedagógico (PPP)','especificos:7'],
  ['Importância do secretário escolar','especificos:8'],
  ['Patrimônio escolar e sustentabilidade','especificos:10'],
  ['Relações interpessoais na escola','especificos:13'],
  ['Sistemas de Gestão Escolar','especificos:15']
 ];
 for(const [stem,topicId] of examples){
  assert.equal(matchSecretariaTopic('especificos',stem),Number(topicId.split(':')[1]),stem);
  const result=classifyForCargo(q('CE',stem),exam,'343');
  assert.equal(result.status,'dentro',stem);
  assert.equal(result.topicId,topicId,stem);
 }
});

test('mesma questão tem enquadramento independente por cargo, inclusive aproximação filtrável',()=>{
 const math=q('RL','Uma mercadoria teve desconto de 20% sobre seu preço.');
 for(const id of FOCUS_CARGOS){
  const matched=classifyForCargo(math,exam,id);
  assert.equal(matched.status,'dentro',id);
  assert.ok(matched.topicId.includes(':'),id);
 }
 const unrelated=q('IN','O computador possui placa de vídeo e processador.');
 const untouched=JSON.stringify(unrelated);
 for(const id of FOCUS_CARGOS){
  const res=classifyForCargo(unrelated,exam,id);
  assert.equal(res.status,'pendente',id);
  assert.equal(res.approximate,true);
  assert.match(res.statusLabel,/Aproximado/);
  assert.ok(res.topicId.includes(':'),id);
  assert.ok(inEditalScope(res,'dentro'),id);
 }
 assert.equal(JSON.stringify(unrelated),untouched);
});

test('questões arquivadas não participam de classificações ativas ou totais',()=>{
 const stored=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
 const active=stored.questions.filter(q=>q.status==='active');
 for(const cargo of FOCUS_CARGOS){
  const summary=subjectSummary(active,id=>stored.exams.find(x=>x.id===id),cargo);
  assert.equal(summary.total.dentro+summary.total.pendente+summary.total.fora,active.length);
  assert.ok(summary.topics.length>0);
  assert.ok(summary.topics.every(x=>x.id&&x.topic));
 }
 const archived=stored.questions.find(q=>q.status==='archived');
 assert.ok(archived);
 assert.equal(archived.status,'archived');
});

test('interface oferece filtragem separada entre enquadramentos diretos e aproximados',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 assert.match(app,/FOCUS_CARGOS\.map/);
 assert.match(app,/name="matchLevel"/);
 assert.match(app,/filters\.matchLevel==='dentro'/);
 assert.match(app,/filters\.matchLevel==='pendente'/);
});
