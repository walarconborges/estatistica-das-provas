import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {splitAssertionItems} from '../assertion-guide.mjs';
const s=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const byCode=code=>{const q=s.questions.find(x=>x.code===code);assert.ok(q,code);return q;};
test('Q2025TI08028: restaura exatamente três lacunas da VUNESP, mantém gabarito e opções',()=>{
 const q=byCode('Q2025TI08028');
 assert.equal((q.stem.match(/_________/g)||[]).length,3);
 assert.match(q.stem,/memória _________ do que está disponível/);
 assert.match(q.stem,/memória _________, usando o arquivo _________/);
 assert.equal(q.answer,'E');
 assert.equal(q.options.length,5);
});
test('Q2024SAUDE01017: portas de entrada do SUS, não Língua Portuguesa',()=>{
 const q=byCode('Q2024SAUDE01017');
 assert.equal(q.disciplineCode,'CE');assert.equal(q.topicCode,'ESUS');assert.equal(q.answer,'C');
 assert.match(q.stem,/Portas\s+de Entrada do SUS/);
});
test('Q2020SAUDE02001: título apartado e quatro assertivas visíveis com anotação',()=>{
 const q=byCode('Q2020SAUDE02001');
 assert.equal(q.answer,'E');
 const rows=splitAssertionItems(q.stem);
 assert.ok(rows);
 assert.equal(rows.kind,'number');
 assert.deepEqual(rows.items.map(x=>x.label),['1','2','3','4']);
 assert.ok(rows.items.every(x=>x.text.length>15));
 assert.match(rows.intro,/Sobre o texto/);
 const group=s.questions.filter(x=>x.examId===q.examId&&x.contextRange?.join('-')==='1-5');
 assert.equal(group.length,5);
 assert.ok(group.every(x=>x.contextTitle==='O CARIOCA E A ROUPA'&&x.contextText===q.contextText));
});
test('Q2026ASG02001: questão corresponde ao texto e título separado para cinco questões',()=>{
 const q=byCode('Q2026ASG02001');
 assert.match(q.contextTitle,/Já notou que seus avós encolhem/);
 assert.match(q.contextText,/Juntas, adoram pintar quadros de gatinhos e paisagens coloridas/);
 assert.equal(q.options.find(x=>x.letter==='C')?.text,'Pintar quadros.');
 assert.equal(q.answer,'C');
 const group=s.questions.filter(x=>x.examId===q.examId&&x.contextRange?.join('-')==='1-5');
 assert.equal(group.length,5);
 assert.ok(group.every(x=>x.contextText===q.contextText&&x.contextTitle===q.contextTitle));
});
test('todas as quatro sinalizações aprovadas sem alterar IDs ou duplicar questões',()=>{
 const codes=['Q2025TI08028','Q2024SAUDE01017','Q2020SAUDE02001','Q2026ASG02001'];
 assert.equal(new Set(s.questions.map(x=>x.code)).size,s.questions.length);
 for(const code of codes){
  const q=byCode(code);
  assert.ok(s.flags.filter(f=>f.questionId===q.id).every(f=>f.status!=='pending'),code);
 }
});
