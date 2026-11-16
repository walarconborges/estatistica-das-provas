import test from 'node:test';
import assert from 'node:assert/strict';
import {PROGRAM_505,MUNICIPAL_LAWS_505,PREAMBLE_ONLY_MUNICIPAL_ACTS,listedMunicipalAct} from '../programa-candeias-505.mjs';
import {STUDY_CONTEXT} from '../study-context.mjs';
test('Anexo IV separa seis grupos e identifica corretamente o cargo 505',()=>{
 assert.equal(PROGRAM_505.cargoCode,'505');
 assert.equal(PROGRAM_505.sections.length,6);
 assert.deepEqual(PROGRAM_505.sections.map(s=>s.id),
  ['portugues','raciocinio','informatica-basica','legislacao','gerais','especificos']);
});
test('Legislação Municipal do cargo 505 cobra exclusivamente três atos',()=>{
 const laws=PROGRAM_505.sections.find(s=>s.id==='legislacao').topics;
 assert.equal(laws.length,3);
 assert.deepEqual(laws,[...MUNICIPAL_LAWS_505]);
 assert.equal(STUDY_CONTEXT.assessedMunicipalLegislation.length,3);
 assert.match(laws.join(' '),/001\/CMCJ-93/);
 assert.match(laws.join(' '),/173\/CMCJ\/2025/);
});
test('leis do preâmbulo não são acrescentadas indevidamente ao conteúdo municipal',()=>{
 const laws=PROGRAM_505.sections.find(s=>s.id==='legislacao').topics.join(' ');
 for(const act of PREAMBLE_ONLY_MUNICIPAL_ACTS)assert.ok(!laws.includes(act));
 assert.equal(listedMunicipalAct('Lei Municipal nº 100/1997'),null);
 assert.equal(listedMunicipalAct('Lei Municipal nº 1.267/2021'),null);
 assert.equal(listedMunicipalAct('Lei Municipal nº 1.268/2021'),null);
});
test('LGPD é classificada nos específicos, não como legislação municipal',()=>{
 const rules=PROGRAM_505.sections.find(s=>s.id==='legislacao').topics.join(' ');
 const ti=PROGRAM_505.sections.find(s=>s.id==='especificos').topics.join(' ');
 assert.match(ti,/13\.709\/2018/);
 assert.ok(!/13\.709/.test(rules));
 assert.equal(listedMunicipalAct('Lei Federal nº 13.709/2018'),null);
});
test('identifica as normas municipais expressas sem aceitar outras leis',()=>{
 assert.match(listedMunicipalAct('Lei Orgânica do Município de Candeias do Jamari'),/Lei Orgânica/);
 assert.match(listedMunicipalAct('Resolução n.º 001/CMCJ-93'),/001\/CMCJ-93/);
 assert.match(listedMunicipalAct('Resolução nº 173/CMCJ/2025'),/173\/CMCJ\/2025/);
 assert.equal(listedMunicipalAct('Lei nº 14.133/2021'),null);
});
test('o programa mantém páginas específicas e blocos tecnológicos cobrados',()=>{
 const topics=PROGRAM_505.sections.find(s=>s.id==='especificos');
 assert.equal(topics.pages,'7');
 const body=topics.topics.join(' ');
 for(const keyword of ['BIOS/UEFI','roteadores','Linux','programação estruturada','orientada a objetos','LGPD'])
  assert.ok(body.toLowerCase().includes(keyword.toLowerCase()),keyword);
});
