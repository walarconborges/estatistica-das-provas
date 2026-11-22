import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const db=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
const get=code=>{const q=db.questions.find(x=>x.code===code);assert.ok(q,code);return q;};

test('sinalizações de novembro aplicadas sem remover gabaritos nem histórico',()=>{
 assert.ok(db.questions.length>=1094);
 assert.ok(db.attempts.length>=143);
 assert.ok(db.exams.length>=56);
 assert.equal(new Set(db.questions.map(q=>q.id)).size,db.questions.length);
 assert.equal(new Set(db.questions.map(q=>q.code)).size,db.questions.length);
 const approved=[
 'Q2022SAUDE04017','Q2026CGCMCJCHATGPT012','Q2026CGCDJHISTAUTORAL042',
 'Q2026ASG01005','Q2025TI15003','Q2025TI01033','Q2026ASG06028',
 'Q2024TI05106','Q2025TI14006','Q2026ASG08001','Q2023SAUDE08003',
 'Q2025TI06006','Q2024TI05063','Q2023SAUDE12029','Q2026CGCDJGEOCHATGPT009',
 'Q2022TI09045','Q2025TI08003','Q2026ASG01010','Q2026ASG08015',
 'Q2023SAUDE12028','Q2024TI03021','Q2023SAUDE06001','Q2026ASG10009'
 ];
 for(const code of approved){
  const q=get(code);
  assert.ok(db.flags.some(f=>f.questionId===q.id&&f.status==='approved'),code);
 }
});
test('assertivas e lacunas legíveis',()=>{
 const q=get('Q2026CGCMCJCHATGPT012');
 assert.match(q.stem,/\nII\. O Pedido/);
 assert.match(q.stem,/\nIII\. A notícia/);
 assert.ok(!q.stem.includes('II. II.'));
 assert.equal(get('Q2025TI08003').stem.match(/____/g)?.length,2);
 assert.deepEqual(get('Q2026ASG08015').optionHighlights?.C,['Pare']);
 assert.deepEqual(get('Q2025TI06006').highlightExpressions,['proibida']);
});
test('revisões de conteúdo técnico sem alterar gabarito',()=>{
 assert.equal(get('Q2024TI05106').editalReview?.['505']?.status,'dentro');
 assert.equal(get('Q2026CGCDJGEOCHATGPT009').answer,'C');
 assert.match(get('Q2026CGCDJGEOCHATGPT009').municipalSource,/rondonia\.ro\.gov\.br/);
 assert.equal(get('Q2023SAUDE12028').disciplineCode,'CE');
 assert.equal(get('Q2023SAUDE12029').disciplineCode,'CE');
 assert.equal(get('Q2025TI06006').disciplineCode,'LP');
 assert.equal(get('Q2025TI14006').disciplineCode,'LP');
 assert.equal(get('Q2022TI09045').disciplineCode,'LE');
 assert.ok(!get('Q2024TI05063').stem.includes('64 - ANULADA'));
 assert.ok(!get('Q2022TI09045').stem.includes('46 - ANULADA'));
});
test('fontes insuficientes continuam marcadas para revisão',()=>{
 for(const code of ['Q2024SAUDE10016','Q2023SAUDE08006','Q2024TI07014','Q2026ASG06027']){
  assert.equal(get(code).status,'needs-review');
  assert.ok(db.flags.some(f=>f.questionId===get(code).id&&f.status==='pending'),code);
 }
 assert.ok(db.flags.some(f=>f.questionId===get('Q2025TI14030').id&&f.status==='pending'));
});
test('apoio foi separado do enunciado e está legível',()=>{
 const q=get('Q2026ASG10009');
 assert.equal(q.answer,'B');
 assert.ok(!q.options.some(o=>/CONCURSO PÚBLICO/.test(o.text)));
 assert.match(q.contextText,/National Geographic Brasil/);
 assert.ok(q.stem.length<400);
 const text=get('Q2023SAUDE06001').contextText;
 assert.match(text,/\n01 /);
 assert.match(text,/\n16 /);
 assert.ok(get('Q2023SAUDE08003').contextTitle);
});
