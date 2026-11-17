import test from 'node:test';
import assert from 'node:assert/strict';
import {canExplain,DEFAULT_AI_MODEL,EXPLANATION_REVISION} from '../worker/explanations.mjs';
import {fresh,normalizeState} from '../core.mjs';

const options=n=>['A','B','C','D','E'].slice(0,n)
 .map((letter,i)=>({letter,text:'Alternativa '+letter+' ('+(i+1)+')'}));
const question=(n=4)=>({
 id:'questao-exemplo',code:'Q2026ASG01017',discipline:'Raciocínio Lógico/Matemático',
 disciplineCode:'RLM',stem:'Qual é o valor correto do troco?',status:'active',
 answer:'C',options:options(n)
});

test('permite explicar a questão de quatro alternativas A-D',()=>{
 assert.deepEqual(canExplain(question(4)),{ok:true,reason:''});
});
test('continua aceitando questões de cinco, três e duas alternativas válidas',()=>{
 for(const count of [2,3,5]){
  const q=question(count);
  if(count===2)q.answer='B';
  assert.equal(canExplain(q).ok,true,'alternativas: '+count);
 }
});
test('rejeita alternativas insuficientes, gabarito ausente e letras repetidas',()=>{
 assert.equal(canExplain(question(1)).ok,false);
 const duplicate=question(4);duplicate.options[3].letter='A';
 assert.equal(canExplain(duplicate).ok,false);
 const absent=question(4);absent.answer='E';
 assert.equal(canExplain(absent).ok,false);
});
test('mantém restrições para questões sem texto, dependentes de imagem ou legislação municipal',()=>{
 const image=question(4);image.imageOnly=true;
 assert.equal(canExplain(image).ok,false);
 const municipal=question(4);
 municipal.discipline='Legislação';
 municipal.disciplineCode='LE';
 municipal.stem='Segundo a Lei Orgânica do Município de Candeias do Jamari, qual é a regra?';
 assert.equal(canExplain(municipal).ok,false);
});
test('modelo de produção é um identificador existente de Workers AI',()=>{
 assert.equal(DEFAULT_AI_MODEL,'@cf/meta/llama-3.1-8b-instruct-fast');
 assert.ok(EXPLANATION_REVISION>=2);
});
test('a correção editorial mantém gabarito, alternativa certa e identificador',()=>{
 const q=question(4);
 q.stem='Qual será o valor do troco em cédulas que o servidor deverá receber?';
 q.options[0].text='R$ 1e6,00';q.options[2].text='R$ 176,00';
 const state=normalizeState({...fresh(),questions:[q]});
 const saved=state.questions[0];
 assert.equal(saved.id,q.id);
 assert.equal(saved.answer,'C');
 assert.match(saved.stem,/troco que o servidor/);
 assert.doesNotMatch(saved.stem,/troco em cédulas/);
 assert.equal(saved.options[0].text,'R$ 166,00');
 assert.equal(saved.options[2].text,'R$ 176,00');
});
