import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const q=code=>s.questions.find(x=>x.code===code);
test('equações de Francisco Morato e classificação correta',()=>{
 const exam=s.exams.find(x=>x.id==='curated-ti-15');
 assert.equal(exam.year,'2026');assert.match(exam.title,/Técnico em Informática/);
 assert.equal(q('Q2025TI15018').disciplineCode,'RLM');
 assert.match(q('Q2025TI15018').stem,/1,5x − y = 9/);
 assert.match(q('Q2025TI15018').stem,/3,5x \+ y = 21/);
 assert.equal(q('Q2025TI15018').answer,'D');
});
test('XML, aglutinação e ética reparados',()=>{
 assert.ok(!q('Q2022TI09061').stem.includes('62 - ANULADA'));
 assert.equal(q('Q2024TI07007').disciplineCode,'LP');
 assert.equal(q('Q2025TI14019').disciplineCode,'LE');
 assert.equal(q('Q2025TI14019').answer,'A');
});
