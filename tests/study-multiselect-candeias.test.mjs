import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STUDY_CANDEIAS,selectedValues,filterStudyAllQuestions,integratedTopicOptions,
 candeiasDisciplineOptions,candeiasTopicOptions,candeiasMatches,filterCandeiasQuestions} from '../edital-classification.mjs';

const state=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const exam=id=>state.exams.find(e=>e.id===id);
const q=code=>{const found=state.questions.find(x=>x.code===code);assert.ok(found,code);return found;};

test('múltiplas disciplinas e assuntos: OU dentro do grupo e E entre grupos',()=>{
 const list=[
  {id:'a',disciplineCode:'CG',topic:'Notícias'},
  {id:'b',disciplineCode:'LE',topic:'Lei Orgânica'},
  {id:'c',disciplineCode:'LP',topic:'Notícias'},
  {id:'d',disciplineCode:'RLM',topic:'Porcentagem',originalQuestionId:'base'},
  {id:'e',disciplineCode:'RLM',topic:'Porcentagem'}
 ];
 assert.deepEqual(selectedValues(['CG','LE','CG','']),['CG','LE']);
 assert.equal(filterStudyAllQuestions(list).length,4);
 assert.deepEqual(filterStudyAllQuestions(list,['CG','LE']).map(x=>x.id),['a','b']);
 assert.deepEqual(filterStudyAllQuestions(list,['CG','LE'],['Lei Orgânica','Notícias']).map(x=>x.id),['a','b']);
 assert.deepEqual(filterStudyAllQuestions(list,[],['Notícias']).map(x=>x.id),['a','c']);
 assert.deepEqual(filterStudyAllQuestions(list,'LE','Lei Orgânica').map(x=>x.id),['b']);
 assert.deepEqual(integratedTopicOptions(list,['CG','LE']).map(x=>x.id),['Lei Orgânica','Notícias']);
});

test('modo Candeias agrupa 202 e 505 e diferencia identificadores de assuntos',()=>{
 assert.equal(STUDY_CANDEIAS,'candeias');
 const sections=candeiasDisciplineOptions().map(x=>x.id);
 for(const v of ['gerais','legislacao','matematica','raciocinio','especificos'])assert.ok(sections.includes(v));
 const items=candeiasTopicOptions();
 assert.ok(items.some(x=>x.id==='505:legislacao:0'));
 assert.ok(items.some(x=>x.id==='202:gerais:6'));
 assert.equal(new Set(items.map(x=>x.id)).size,items.length);
});

test('notícias de Candeias entram; notícia municipal de outra cidade fica fora',()=>{
 const news=q('Q2026CGCMCJCHATGPT004'),second=q('Q2026CGCMCJCHATGPT023');
 assert.ok(candeiasMatches(news,exam(news.examId)).some(x=>x.sectionId==='gerais'));
 assert.ok(candeiasMatches(second,exam(second.examId)).some(x=>x.sectionId==='gerais'));
 const fake={...news,id:'noticia-estrangeira',sourceType:'',newsSource:'',
  orgao:'Câmara Municipal de Brusque/SC',stem:'Qual é a história do município de Brusque?',
  heading:'Conhecimentos Gerais',topic:'Geografia de Brusque'};
 assert.equal(candeiasMatches(fake,{orgao:'Câmara Municipal de Brusque/SC'}).some(x=>x.sectionId==='gerais'),false);
 assert.equal(filterCandeiasQuestions([news,second,fake],exam,{candeiasDisciplines:['gerais']}).length,2);
});

test('Candeias: unir gerais e legislação municipal sem incluir questão da SEMUSA',()=>{
 const news=q('Q2026CGCMCJCHATGPT004');
 const law=state.questions.find(x=>x.originalQuestionId&&x.adaptation?.target==='candeias-do-jamari-ro');
 assert.ok(law,'Deve existir uma adaptação com fundamento municipal');
 assert.ok(candeiasMatches(law,exam(law.examId)).some(x=>x.sectionId==='legislacao'));
 const semusa=q('Q2023SAUDE12034');
 const got=filterCandeiasQuestions([news,law,semusa],exam,{candeiasDisciplines:['gerais','legislacao']});
 assert.deepEqual(new Set(got.map(x=>x.id)),new Set([news.id,law.id]));
 assert.deepEqual(filterCandeiasQuestions([law,news],exam,{candeiasTopics:['505:legislacao:2']}).map(x=>x.id),[law.id]);
});

test('interface de questões e simulados usam caixas e FormData.getAll',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 for(const name of ['generalDisciplines','generalTopics','candeiasDisciplines','candeiasTopics','editalDisciplines','editalTopics'])
  assert.ok(app.includes("multiChoiceField('"+name+"'"));
 assert.match(app,/f\.getAll\(name\)\.map\(String\)/);
 assert.match(app,/eligibleSyllabusQuestions\(beforeTerritory,currentFilter\)/);
 assert.match(readFileSync(new URL('../styles.css',import.meta.url),'utf8'),/\.filter-multi/);
});
