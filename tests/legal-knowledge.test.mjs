import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lawIdForQuestion,selectLegalEvidence,legalContextForPrompt} from '../worker/legal-knowledge.mjs';
import {canExplain,promptFor,contentFingerprint} from '../worker/explanations.mjs';

const load=id=>JSON.parse(readFileSync(new URL('../data/laws/'+id+'.json',import.meta.url),'utf8'));
const question={
 id:'lc-001',code:'Q2026LECDJMIXAUTORAL001',sourceType:'simulado-autoral-candeias-legislacao',
 municipalLawTag:'organica',disciplineCode:'LE',discipline:'Legislação',
 stem:'A Lei Orgânica do Município de Candeias do Jamari estabelece regras específicas para sua alteração, incluindo legitimidade para apresentação de propostas, procedimento de votação e promulgação. Considerando essas disposições, assinale a alternativa CORRETA.',
 topic:'Lei Orgânica Municipal',
 options:[
 {letter:'A',text:'A proposta de emenda poderá ser apresentada por um terço dos vereadores, dependendo de aprovação por maioria absoluta em dois turnos.'},
 {letter:'B',text:'O Prefeito poderá alterar diretamente a Lei Orgânica por decreto.'},
 {letter:'C',text:'A proposta de emenda será apreciada em turno único.'},
 {letter:'D',text:'A proposta será discutida e votada em dois turnos, com intervalo mínimo de dez dias, exigindo voto favorável de dois terços dos membros da Câmara em ambas as votações.'},
 {letter:'E',text:'A emenda aprovada dependerá de sanção do Prefeito.'}
 ],
 answer:'D',status:'active'
};
test('normas diferentes são identificadas e não vazam para outros municípios',()=>{
 assert.equal(lawIdForQuestion(question),'lei-organica');
 assert.equal(lawIdForQuestion({...question,municipalLawTag:'res173'}),'resolucao-173-2025');
 assert.equal(lawIdForQuestion({...question,municipalLawTag:'regimento'}),'regimento-1993');
 assert.equal(lawIdForQuestion({...question,sourceType:'outro',municipalLawTag:'',orgao:'Prefeitura de Brusque',stem:'Lei Orgânica do município de Brusque',topic:'Gramática'}),null);
 assert.equal(lawIdForQuestion({stem:'Lei nº 1.459/2023 de Candeias do Jamari',discipline:'Legislação'}),'lei-1459-2023');
});
test('o documento de 48 páginas é consultável e cita a página do art. 63',()=>{
 const doc=load('lei-organica');
 assert.equal(doc.pages.length,45);
 const ev=selectLegalEvidence(question,doc);
 assert.ok(ev);
 assert.ok(ev.passages.some(p=>p.page===18),'A alteração da Lei Orgânica deve apontar para a página 18.');
 assert.ok(ev.passages.some(p=>/Art\.\s*63/.test(p.text)));
 assert.match(legalContextForPrompt(ev),/Página 18/);
 assert.match(legalContextForPrompt(ev),/interstício mínimo de dez dias/);
 assert.equal(canExplain(question,ev).ok,true);
 const prompt=promptFor(question,ev);
 assert.match(prompt[1].content,/DOCUMENTO NORMATIVO FORNECIDO/);
 assert.match(prompt[1].content,/GABARITO FORNECIDO: D/);
});
test('regimento de 1993 não é confundido com versão atual consolidada',()=>{
 const doc=load('regimento-1993');
 assert.equal(doc.readable,false);
 assert.equal(selectLegalEvidence({...question,municipalLawTag:'regimento'},doc),null);
 assert.match(doc.legalValidity,/2026/);
});
test('demais normas são separadas por origem e mantêm referência do PDF',()=>{
 const res=load('resolucao-173-2025');
 const budget=load('lei-1459-2023');
 assert.equal(res.kind,'resolucao');
 assert.ok(res.pages.some(p=>/Art\.\s*7º/.test(p.text)));
 assert.equal(budget.kind,'lei-orcamentaria');
 assert.ok(budget.pages.some(p=>/1\.459|1 459/.test(p.text)));
 assert.ok(!budget.title.includes('Lei Orgânica'));
});
test('alterar trecho legal invalida o cache de explicação sem mudar a questão',async()=>{
 const ev=selectLegalEvidence(question,load('lei-organica'));
 const digest=async buffer=>new Uint8Array([...buffer].reduce((arr,n,i)=>{arr[i%16]=(arr[i%16]+n+i)%256;return arr},Array(16).fill(0))).buffer;
 const base=await contentFingerprint(question,digest);
 const withLaw=await contentFingerprint(question,digest,ev);
 assert.notEqual(base,withLaw);
 const changed={...ev,revision:'alterada'};
 assert.notEqual(withLaw,await contentFingerprint(question,digest,changed));
});
