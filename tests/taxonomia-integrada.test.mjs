import test from 'node:test';
import assert from 'node:assert/strict';
import {unifyQuestionTaxonomy,unifiedRlmTopics} from '../topic-taxonomy.mjs';
import {ensureUniqueQuestionCodes,addExam,fresh} from '../core.mjs';
import {studyAllGroup,filterStudyAllQuestions, classifyForCargo} from '../edital-classification.mjs';
const q=(stem,discipline='Matemática',disciplineCode='MA')=>({
 stem,discipline,disciplineCode,topic:'Geral',topicCode:'G',
 options:[{letter:'A',text:'Resposta A'},{letter:'B',text:'Resposta B'}]
});
test('RLM integra matemática e lógica sem usar assunto Geral',()=>{
 assert.ok(unifiedRlmTopics.length>=20);
 const math=unifyQuestionTaxonomy(q('Calcule 20% de 300.'));
 const logical=unifyQuestionTaxonomy(q('Quantas proposições compostas há?', 'Raciocínio Lógico','RL'));
 assert.equal(math.discipline,'Raciocínio Lógico/Matemático');
 assert.equal(math.disciplineCode,'RLM');
 assert.equal(math.topic,'Porcentagem, juros e descontos');
 assert.equal(logical.disciplineCode,'RLM');
 assert.notEqual(logical.topic,'Geral');
 assert.equal(studyAllGroup({...q('Calcule 20%'),...math}),'RLM');
 const pool=[{id:'a',...math},{id:'b',...logical}];
 assert.equal(filterStudyAllQuestions(pool,'RLM').length,2);
});
test('catálogo tem assunto explícito para Português, Informática e conhecimentos',()=>{
 for(const [d,c,stem] of [['Língua Portuguesa','LP','Assinale a alternativa de concordância verbal.'],
  ['Informática','IN','Uma rede usa protocolo TCP/IP.'],['Conhecimentos Gerais','CG','O Cerrado é um bioma brasileiro.'],
  ['Conhecimentos Específicos','CE','São exemplos de equipamentos de proteção individual EPI']]){
  const result=unifyQuestionTaxonomy(q(stem,d,c));
  assert.ok(result.topic&&result.topic!=='Geral');
 }
});
test('códigos duplicados são corrigidos de forma estável sem alterar identificadores',()=>{
 const s={questions:[{id:'x',year:'2026',code:'Q1'},{id:'y',year:'2026',code:'Q1'},{id:'z',year:'2026',code:'Q1'}]};
 ensureUniqueQuestionCodes(s);
 assert.deepEqual(s.questions.map(x=>x.code),['Q1','Q1-2','Q1-3']);
 ensureUniqueQuestionCodes(s);
 assert.deepEqual(s.questions.map(x=>x.code),['Q1','Q1-2','Q1-3']);
});
test('questões novas são armazenadas na taxonomia integrada',()=>{
 const s=fresh();
 addExam(s,{title:'Teste',year:'2026',banca:'BANCA',orgao:'CÂMARA'},[
  {originalNumber:1,...q('Qual é o mínimo múltiplo comum MMC entre 12 e 18?')},
  {originalNumber:2,...q('Calcule o valor de 25% de 100.')},
 ],{1:'A',2:'B'});
 assert.equal(s.questions.length,2);
 assert.ok(s.questions.every(x=>x.disciplineCode==='RLM'&&x.topic!=='Geral'));
 assert.equal(new Set(s.questions.map(x=>x.code)).size,2);
});
