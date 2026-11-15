import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,addExam} from '../core.mjs';
import {deltaSince,mergeLocal,hasChanges} from '../sync-client.mjs';
import {applyDelta} from '../worker/index.mjs';

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
