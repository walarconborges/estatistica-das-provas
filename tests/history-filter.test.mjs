import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,addExam,recordAttempt,filtered,normalizeOutcomeSelection,outcome} from '../core.mjs';

const meta={title:'Prova modelo',year:'2026',banca:'IBGP',orgao:'SEMED'};
function sample(n){
 return {originalNumber:n,stem:'Enunciado único '+n,options:'ABCDE'.split('').map(letter=>({letter,text:'Resposta '+letter})),discipline:'Língua Portuguesa',disciplineCode:'LP',topic:'Geral',topicCode:'G'};
}
function fixture(){
 const s=fresh();
 addExam(s,meta,[sample(1),sample(2),sample(3)],{1:'A',2:'B',3:'C'});
 const byNumber=n=>s.questions.find(q=>q.originalNumber===n);
 recordAttempt(s,'perfil',byNumber(2).id,'A'); // errada
 recordAttempt(s,'perfil',byNumber(3).id,'C'); // acertada
 return {s,byNumber};
}
const numbers=items=>items.map(q=>q.originalNumber).sort((a,b)=>a-b);

test('sem marcas, exibe todas as questões do histórico',()=>{
 const {s}=fixture();
 assert.deepEqual(numbers(filtered(s,'perfil',{outcomes:[]})),[1,2,3]);
 assert.deepEqual(normalizeOutcomeSelection({outcomes:[]}),[]);
});
test('cada uma das três categorias de histórico pode ser selecionada isoladamente',()=>{
 const {s}=fixture();
 assert.deepEqual(numbers(filtered(s,'perfil',{outcomes:['unanswered']})),[1]);
 assert.deepEqual(numbers(filtered(s,'perfil',{outcomes:['wrong']})),[2]);
 assert.deepEqual(numbers(filtered(s,'perfil',{outcomes:['correct']})),[3]);
});
test('duas categorias são combinadas por OU, nunca por E',()=>{
 const {s}=fixture();
 assert.deepEqual(numbers(filtered(s,'perfil',{outcomes:['unanswered','wrong']})),[1,2]);
 assert.deepEqual(numbers(filtered(s,'perfil',{outcomes:['wrong','correct']})),[2,3]);
 assert.deepEqual(numbers(filtered(s,'perfil',{outcomes:['unanswered','correct']})),[1,3]);
});
test('selecionar as três categorias é equivalente a selecionar todas',()=>{
 const {s}=fixture();
 assert.deepEqual(numbers(filtered(s,'perfil',{outcomes:['unanswered','wrong','correct']})),[1,2,3]);
});
test('combinações não modificam respostas ou histórico de outros perfis',()=>{
 const {s,byNumber}=fixture();
 const before=JSON.stringify(s.attempts);
 assert.deepEqual(numbers(filtered(s,'outro-perfil',{outcomes:['unanswered']})),[1,2,3]);
 assert.deepEqual(numbers(filtered(s,'perfil',{outcomes:['wrong','correct']})),[2,3]);
 assert.equal(outcome(s,'perfil',byNumber(2)),'wrong');
 assert.equal(JSON.stringify(s.attempts),before);
});
test('mantém compatibilidade com o filtro antigo de seleção única',()=>{
 const {s}=fixture();
 assert.deepEqual(numbers(filtered(s,'perfil',{outcome:'wrong'})),[2]);
 assert.deepEqual(numbers(filtered(s,'perfil',{outcome:'all'})),[1,2,3]);
 assert.deepEqual(numbers(filtered(s,'perfil',{outcome:'wrong',outcomes:[]})),[1,2,3]);
 assert.deepEqual(normalizeOutcomeSelection({outcomes:['correct','wrong','correct','invalido']}),['correct','wrong']);
});
test('o formulário apresenta rótulos em português e envia múltiplos valores',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 assert.match(app,/Não respondidas/);
 assert.match(app,/Erradas/);
 assert.match(app,/Acertadas/);
 assert.match(app,/type="checkbox" name="outcome"/);
 assert.match(app,/f\.getAll\('outcome'\)/);
 assert.doesNotMatch(app,/selectField\('outcome'/);
});
