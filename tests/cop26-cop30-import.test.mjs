import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const s=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const id='sim-autoral-cop26-cop30-2026-11-21';
const e=s.exams.find(x=>x.id===id);
const qs=e?.questionIds.map(qid=>s.questions.find(q=>q.id===qid))||[];
test('COP26 a COP30: dez questões originais da fonte, sem serem atribuídas à banca IBGP',()=>{
 assert.ok(e);
 assert.equal(e.banca,'Autoral');assert.equal(e.sourceType,'simulado-autoral');
 assert.equal(qs.length,10);
 assert.deepEqual(qs.map(x=>x.originalNumber),[1,2,3,4,5,6,7,8,9,10]);
 assert.deepEqual(qs.map(x=>x.heading.split(' |')[0]),['COP26','COP26','COP27','COP27','COP28','COP28','COP29','COP29','COP30','COP30']);
 assert.equal(qs.map(x=>x.answer).join(''),'CEBDACEBDA');
 assert.ok(qs.every(q=>q.stem.length>50&&q.options.map(x=>x.letter).join('')==='ABCDE'));
 assert.ok(qs.every(q=>q.status==='active'&&q.sourceType==='simulado-autoral-cop'));
 assert.ok(qs.every(q=>q.disciplineCode==='CG'&&q.topic==='Meio ambiente e sustentabilidade'));
 assert.ok(qs.every(q=>q.answerComment?.length>20));
});
test('preservação de banco, perfis, respostas e códigos únicos',()=>{
 assert.ok(s.questions.length>=1014);assert.ok(s.exams.length>=48);
 assert.ok(s.attempts.length>=67);
 assert.ok(s.profiles.length>=3);
 assert.ok(s.flags.length>=61);
 assert.equal(new Set(s.questions.map(q=>q.code)).size,s.questions.length);
 assert.equal(new Set(s.questions.map(q=>q.id)).size,s.questions.length);
});
