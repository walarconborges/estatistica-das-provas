import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyForCargo} from '../edital-classification.mjs';

const examMG={
 orgao:'Prefeitura Municipal de Candeias/MG',
 title:'2021 — PRÓPRIA — Prefeitura Municipal de Candeias/MG — Analista de Tecnologia e Informática'
};
const examRO={
 orgao:'Câmara Municipal de Candeias do Jamari/RO',
 title:'2026 — Câmara Municipal de Candeias do Jamari/RO'
};
function sample(stem,code='Q2021TI10015'){
 return {id:code,code,discipline:'Legislação',disciplineCode:'LE',
  stem,options:[
   {letter:'A',text:'Emendas à Lei Orgânica Municipal.'},
   {letter:'B',text:'Decretos Legislativos.'},
   {letter:'C',text:'Leis Complementares.'},
   {letter:'D',text:'Portarias.'}
  ],answer:'D'};
}
test('Lei Orgânica municipal de Candeias/MG não é do edital de Candeias do Jamari/RO',()=>{
 const q=sample('O processo legislativo municipal compreende a elaboração de, exceto:');
 const classification=classifyForCargo(q,examMG,'505');
 assert.equal(classification.status,'fora');
 assert.match(classification.reason,/outro município/i);
});
test('Lei 004/2001 de Candeias/MG também permanece fora do edital 505',()=>{
 const q=sample('Os cargos em comissão são de recrutamento amplo ou limitado. Diante da Lei 004/2001 e suas alterações, assinale a incorreta:','Q2021TI10011');
 assert.equal(classifyForCargo(q,examMG,'505').status,'fora');
});
test('Lei Orgânica expressamente de Candeias do Jamari continua classificada no edital correto',()=>{
 const q=sample('A Lei Orgânica do Município de Candeias do Jamari dispõe sobre o processo legislativo municipal.','local-regra');
 const classification=classifyForCargo(q,examRO,'505');
 assert.equal(classification.status,'dentro');
 assert.match(classification.topic,/Lei Orgânica/);
});
test('cargo 202 de serviços gerais não recebe legislação municipal',()=>{
 const q=sample('O processo legislativo municipal compreende a elaboração de, exceto:');
 assert.equal(classifyForCargo(q,examMG,'202').status,'fora');
});
