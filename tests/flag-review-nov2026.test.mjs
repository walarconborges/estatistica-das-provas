import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyForCargo} from '../edital-classification.mjs';
import {splitAssertionItems} from '../assertion-guide.mjs';

const healthExam={title:'2020 — GS ASSESSORIA — Auxiliar de Serviços de Saúde Pública',orgao:'Diversos (provas preparadas)'};
const techExam={title:'2026 — VUNESP — Câmara Municipal de Votorantim/SP — Analista de Tecnologia e Informática',orgao:'Câmara Municipal de Votorantim/SP'};
const base={discipline:'Conhecimentos Específicos',disciplineCode:'CE',options:[],answer:'C'};
test('produtos químicos e primeiros socorros não pertencem aos específicos de TI do cargo 505',()=>{
 for(const stem of ['Muitos produtos químicos exigem segurança e EPI ao usar na limpeza de ambientes de saúde.',
                    'Primeiros socorros são medidas de emergência para pessoas com mal súbito.']){
  const q={...base,stem,topic:'Rotinas profissionais e organização do trabalho'};
  assert.equal(classifyForCargo(q,healthExam,'505').status,'fora');
  assert.equal(classifyForCargo(q,healthExam,'240').status,'dentro');
 }
});
test('saúde coletiva mantém pertinência ao cargo 240, não ao cargo 505',()=>{
 const q={...base,stem:'Segundo a PNAB, a territorialização organiza o território da Atenção Básica.',
  topic:'Saúde coletiva, atenção básica e SUS'};
 assert.equal(classifyForCargo(q,healthExam,'505').status,'fora');
 assert.equal(classifyForCargo(q,healthExam,'240').status,'dentro');
});
test('conhecimentos específicos de TI autênticos continuam dentro do edital 505',()=>{
 const q={...base,discipline:'Informática',disciplineCode:'IN',
  stem:'A memória RAM, os barramentos e a CPU são componentes do hardware.',
  topic:'Hardware, periféricos, tipos e hierarquia de memória, drivers, CPU e barramentos'};
 assert.equal(classifyForCargo(q,techExam,'505').status,'dentro');
});
test('o item Q2023SAUDE08041 é separado corretamente em duas afirmações de julgamento C/E',()=>{
 const stem='Segundo a Política Nacional de Atenção Básica (PNAB), marcar C para as afirmativas Certas e E para as Erradas: ( ) O processo de territorialização aproxima os serviços de saúde e a população. ( ) O território inclui relações sociais e psicológicas, hábitos, crenças e cultura.';
 const parsed=splitAssertionItems(stem);
 assert.equal(parsed.kind,'blanks');
 assert.equal(parsed.items.length,2);
 assert.match(parsed.items[0].text,/territorialização/);
 assert.match(parsed.items[1].text,/território/);
});
test('as 10 sinalizações foram finalizadas sem modificar os gabaritos das questões remanescentes',()=>{
 const s=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
 const codes={Q2026TI02037:'A',Q2024TI05012:'E',Q2025TI06005:'A',
  Q2025TI12004:'D',Q2023SAUDE08041:'A',Q2020SAUDE02035:'C',
  Q2020SAUDE02038:'E',Q2022TI09091:'E',Q2023SAUDE07023:'A'};
 for(const [code,expected] of Object.entries(codes)){
  const q=s.questions.find(q=>q.code===code);
  assert.equal(q?.answer,expected,code);
 }
 const removed='curated-ti-09-106';
 assert.ok(!s.questions.some(q=>q.id===removed));
 assert.ok(s.tombstones.questions.includes(removed));
 assert.ok(!s.attempts.some(a=>a.questionId===removed));
 assert.ok(!s.simulations.some(a=>a.questionIds?.includes(removed)));
 assert.ok(s.exams.every(e=>!e.questionIds.includes(removed)));
});
