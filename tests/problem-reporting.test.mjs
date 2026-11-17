import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,normalizeState} from '../core.mjs';
import {applyDelta} from '../worker/index.mjs';
import {classifyForCargo} from '../edital-classification.mjs';

function subjectQuestion(){
 return {
  id:'q-2024-ti-05-005',code:'Q2024TI05005',examId:'exam-example',
  originalNumber:5,year:'2024',status:'active',
  discipline:'Informática',disciplineCode:'IN',
  topic:'Fundamentos de informática',topicCode:'IFUN',
  stem:'Segundo o texto, o estudo da história social da ignorância envolveria descobrir as pessoas que ignoram algo em determinado espaço e época, as causas e os efeitos.',
  contextText:'A história social da ignorância investiga quem ignora o quê, onde e quando.',
  answer:'C',options:[{letter:'C',text:'Certo'},{letter:'E',text:'Errado'}]
 };
}
test('Q2024TI05005 é interpretação de texto, não hardware ou informática',()=>{
 const input=fresh();input.questions.push(subjectQuestion());
 input.profiles.push({id:'profile-01',name:'Pessoa'});
 input.attempts.push({id:'attempt-01',questionId:'q-2024-ti-05-005',profileId:'profile-01',answer:'C'});
 const normalized=normalizeState(input);
 const q=normalized.questions[0];
 assert.equal(q.discipline,'Língua Portuguesa');
 assert.equal(q.disciplineCode,'LP');
 assert.equal(q.topic,'Interpretação e compreensão de textos');
 assert.equal(q.topicCode,'LINT');
 assert.equal(q.id,'q-2024-ti-05-005');
 assert.equal(q.code,'Q2024TI05005');
 assert.equal(q.answer,'C');
 assert.deepEqual(q.options,[{letter:'C',text:'Certo'},{letter:'E',text:'Errado'}]);
 assert.equal(normalized.attempts.length,1);
 assert.equal(normalized.attempts[0].answer,'C');
 const catalog=classifyForCargo(q,{id:'exam-example',orgao:'Diversos'},'505');
 assert.equal(catalog.status,'dentro');
 assert.equal(catalog.discipline,'Português');
 assert.notMatch(catalog.topic,/Hardware|periféricos/i);
 assert.deepEqual(normalizeState(normalized).questions,[q]);
});
test('a correção não reclassifica outras questões técnicas ou com mesmo código e outro texto',()=>{
 const input=fresh();
 input.questions.push({...subjectQuestion(),id:'q-other',code:'Q2024TI05006',stem:'O processador controla as instruções e o barramento de dados.'});
 input.questions.push({...subjectQuestion(),id:'q-same-code',stem:'Quais são os componentes de uma placa-mãe?'});
 const repaired=normalizeState(input);
 assert.equal(repaired.questions[0].disciplineCode,'IN');
 assert.equal(repaired.questions[1].disciplineCode,'IN');
});
test('sinalização genérica sem comentário é armazenada e entra na fila de revisão',()=>{
 const data=fresh();
 data.profiles=[{id:'profile-01',name:'Pessoa'}];
 data.exams=[{id:'exam-example',title:'Prova exemplo'}];
 data.questions=[subjectQuestion()];
 const flagged={id:'flag-123',questionId:'q-2024-ti-05-005',profileId:'profile-01',
  type:'problem',note:'',proposed:{},status:'pending',at:'2026-11-17T20:00:00Z'};
 const merged=applyDelta(data,{flags:[flagged]});
 assert.equal(merged.newFlags.length,1);
 assert.equal(merged.newFlags[0].type,'problem');
 assert.equal(merged.state.flags[0].status,'pending');
 assert.equal(merged.state.flags[0].note,'');
});
test('interface de sinalização exige apenas comentário opcional',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 assert.match(html, /id="problem-comment"[^>]*>/);
 assert.match(html, /Comentário \(opcional\)/);
 assert.doesNotMatch(html, /id="problem-comment"[^>]*required/);
 assert.match(app, /type:'problem'/);
 assert.doesNotMatch(app, /Tipo: classificação, secundária, gabarito, anulada/);
});
