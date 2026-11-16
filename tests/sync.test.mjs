import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,addExam} from '../core.mjs';
import {deltaSince,mergeLocal,hasChanges} from '../sync-client.mjs';
import {applyDelta,extractionOnlyUpgrade} from '../worker/index.mjs';

test('sincronização incremental preserva usuários, provas e respostas de aparelhos diferentes',()=>{
 const server=fresh();
 const phone=fresh(),computer=fresh();
 phone.profiles.push({id:'perfil-phone',name:'Wilber'});
 computer.profiles.push({id:'perfil-computer',name:'Usuário 2'});
 const first=applyDelta(server,deltaSince(fresh(),phone)).state;
 const second=applyDelta(first,deltaSince(fresh(),computer)).state;
 assert.deepEqual(second.profiles.map(p=>p.name),['Wilber','Usuário 2']);
 assert.equal(new Set(second.profiles.map(p=>p.id)).size,2);
});

test('requisições repetidas não duplicam os registros já gravados',()=>{
 const original=fresh(),local=fresh();
 local.profiles.push({id:'perfil-1',name:'Teste'});
 const patch=deltaSince(original,local);
 const one=applyDelta(original,patch).state;
 const two=applyDelta(one,patch).state;
 assert.equal(two.profiles.length,1);
});

test('participantes não conseguem alterar gabarito, anulação ou classificação já cadastrada',()=>{
 const base=fresh();
 const ex=addExam(base,{title:'Prova 2026',year:'2026',banca:'IBGP',orgao:'SEMED'},[{originalNumber:1,stem:'Assinale a correta.',options:[{letter:'A',text:'A'},{letter:'B',text:'B'}],discipline:'Língua Portuguesa',disciplineCode:'LP',topic:'Gramática',topicCode:'G'}],{1:'A'});
 const original=base.questions[0];
 const changed={...original,answer:'B',discipline:'Incorreta',status:'annulled'};
 const patch=deltaSince(fresh(),{...fresh(),questions:[changed]});
 const actual=applyDelta(base,patch).state.questions[0];
 assert.equal(actual.answer,'A');assert.equal(actual.discipline,'Língua Portuguesa');assert.equal(actual.status,'active');
});

test('edição posterior no mesmo simulado é preservada na sincronização',()=>{
 const base=fresh();
 base.profiles.push({id:'p01',name:'Primeiro'});
 const sim={id:'sim123',profileId:'p01',questionIds:['questao-1'],answers:{},status:'pending'};
 base.simulations.push(sim);
 const next=applyDelta(base,{simulations:[{...sim,answers:{'questao-1':'A'}}]}).state;
 assert.equal(next.simulations[0].answers['questao-1'],'A');
 const done=applyDelta(next,{simulations:[{...sim,answers:{'questao-1':'B'},status:'finished'}]}).state;
 assert.equal(done.simulations[0].status,'finished');
 assert.equal(done.simulations[0].answers['questao-1'],'B');
});

test('alterações locais durante download são preservadas na fusão',()=>{
 const old=fresh(),remote=fresh(),local=fresh();
 remote.profiles.push({id:'r01',name:'Remoto'});
 local.profiles.push({id:'l01',name:'Local'});
 assert.equal(hasChanges(deltaSince(old,local)),true);
 const merged=mergeLocal(remote,deltaSince(old,local));
 assert.equal(merged.profiles.length,2);
});

test('Worker aceita somente correção fiel de alternativa extraída e preserva o gabarito',()=>{
 const base=fresh();
 const meta={title:'2026 — FEPESE — PM-BRUSQUE — Analista de Informática',year:'2026',banca:'FEPESE',orgao:'PM-BRUSQUE'};
 const original={
  originalNumber:6,sourcePage:6,sourceColumn:0,
  stem:'O Relatório de Riscos Globais apresenta eventos extremos.',
  options:'ABCDE'.split('').map(letter=>({letter,text:''})),
  extractionFallback:true,extractionReview:true,pageImage:'data:image/jpeg;base64,abc',
  discipline:'Conhecimentos Gerais',disciplineCode:'CG',topic:'Geral',topicCode:'G'
 };
 const exam=addExam(base,meta,[original],{6:'E'}),old=base.questions[0];
 const newer={...old,options:'ABCDE'.split('').map(letter=>({letter,text:'Opção '+letter})),
  extractionFallback:false,extractionReview:false,imageOnly:false,
  pageImage:undefined,status:'active'};
 assert.ok(extractionOnlyUpgrade(old,newer));
 const applied=applyDelta(base,{questions:[newer]}).state;
 const q=applied.questions[0];
 assert.equal(q.id,old.id);assert.equal(q.examId,exam.id);
 assert.equal(q.answer,'E');assert.equal(q.code,old.code);
 assert.equal(q.status,'active');assert.equal(q.pageImage,undefined);
 assert.equal(q.options[4].text,'Opção E');
 assert.equal(applied.questions.length,1);assert.equal(applied.exams.length,1);
 // Nenhum segundo upgrade pode reescrever questão agora ativa.
 assert.equal(extractionOnlyUpgrade(q,{...newer,options:'ABCDE'.split('').map(letter=>({letter,text:'Texto alterado'}))}),null);
});
test('Worker rejeita troca de resposta, assunto, texto original ou inserção de marcações',()=>{
 const base=fresh();
 const m={title:'FEPESE S01',year:'2026',banca:'FEPESE',orgao:'PM-BRUSQUE'};
 const orig={originalNumber:1,sourcePage:3,sourceColumn:1,stem:'Qual é a alternativa correta?',
  options:'ABCDE'.split('').map(letter=>({letter,text:''})),
  extractionFallback:true,extractionReview:true,
  discipline:'Língua Portuguesa',disciplineCode:'LP',topic:'Geral',topicCode:'G'};
 addExam(base,m,[orig],{1:'B'});
 const old=base.questions[0],baseNew={...old,
  options:'ABCDE'.split('').map(letter=>({letter,text:'Alternativa '+letter})),
  extractionFallback:false,extractionReview:false,imageOnly:false,status:'active'};
 for(const bad of [
  {...baseNew,answer:'A'},
  {...baseNew,stem:'Enunciado inventado'},
  {...baseNew,discipline:'Informática'},
  {...baseNew,code:'QFAKE'},
  {...baseNew,options:'ABCDE'.split('').map((letter,i)=>({letter,text:i===1?'Check-square resposta':'Alternativa '+letter}))}
 ]){
  assert.equal(extractionOnlyUpgrade(old,bad),null);
  assert.equal(applyDelta(base,{questions:[bad]}).state.questions[0].status,'needs-review');
 }
});
