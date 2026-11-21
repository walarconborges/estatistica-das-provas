import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercita a função real sem montar a interface completa.
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const start=source.indexOf('function reviewEdict(qid){');
const end=source.indexOf('\nlet problemQuestionId=null;',start);
assert.ok(start>=0&&end>start,'Função de conferência não encontrada no aplicativo');
const implementation=source.slice(start,end);

function simulate(response){
 const prompts=[],notifications=[],flags=[];
 const question={id:'q1',code:'QTESTE001',examId:'e1'};
 let saves=0;
 const context={
  question:()=>question,exam:()=>({id:'e1'}),currentFilter:{editalCargo:'505'},
  STUDY_CANDEIAS:'candeias',CATALOGS:{'505':{}},
  classifyForCargo:()=>({status:'fora',statusLabel:'Fora do edital'}),
  prompt:(message,initial)=>{prompts.push({message,initial});return response;},
  toast:(message)=>notifications.push(message),
  state:{flags},profileId:'p1',newId:()=>String(flags.length+1),
  save:()=>{saves++;return true;},
  candeiasMatches:()=>[]
 };
 vm.runInNewContext(implementation+';reviewEdict("q1")',context);
 return {prompts,notifications,flags,saves,question};
}

for(const [answer,expected] of [['DENTRO','dentro'],['FORA','fora']]){
 test('Conferir edital aceita '+answer+' sem pedir justificativa',()=>{
  const result=simulate(answer);
  assert.equal(result.prompts.length,1,'Uma única confirmação deve ser suficiente');
  assert.equal(result.flags.length,1);
  assert.equal(result.flags[0].type,'edital-review');
  assert.equal(result.flags[0].status,'pending');
  assert.equal(result.flags[0].proposed.editalCargo,'505');
  assert.equal(result.flags[0].proposed.status,expected);
  assert.equal(result.saves,1);
  assert.ok(result.notifications.at(-1).includes('aprovação'));
  assert.equal(result.question.editalReview,undefined,'A escolha não aprova a classificação automaticamente');
 });
}

test('Cancelar ou inserir outro valor não cria pendências',()=>{
 for(const entry of [null,'TALVEZ']){
  const result=simulate(entry);
  assert.equal(result.prompts.length,1);
  assert.equal(result.flags.length,0);
  assert.equal(result.saves,0);
 }
});
