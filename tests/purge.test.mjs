import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,normalizeState} from '../core.mjs';
import {applyDelta} from '../worker/index.mjs';
import {mergeLocal} from '../sync-client.mjs';

test('limpeza de importação não elimina perfis',()=>{
  const state=fresh();
  state.profiles.push({id:'person-1',name:'TESTE'});
  state.tombstones.exams.push('old-exam');
  state.tombstones.questions.push('old-question');
  const normalized=normalizeState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(normalized.profiles.map(x=>x.name),['TESTE']);
  assert.deepEqual(normalized.tombstones.questions,['old-question']);
});

test('um navegador desatualizado não restaura prova, questões e respostas excluídas',()=>{
  const state=fresh();
  state.profiles.push({id:'person-1',name:'TESTE'});
  state.tombstones.exams.push('old-exam');
  state.tombstones.questions.push('old-question');
  const stale={
    exams:[{id:'old-exam',title:'Importação excluída'}],
    questions:[{id:'old-question',examId:'old-exam',code:'QOLD'}],
    attempts:[{id:'old-attempt',profileId:'person-1',questionId:'old-question',answer:'A'}]
  };
  const response=applyDelta(state,stale).state;
  assert.equal(response.exams.length,0);
  assert.equal(response.questions.length,0);
  assert.equal(response.attempts.length,0);
  assert.equal(response.profiles.length,1);
  const local=mergeLocal(response,stale);
  assert.equal(local.exams.length,0);
  assert.equal(local.questions.length,0);
  assert.equal(local.attempts.length,0);
});

test('limpeza antiga não bloqueia prova nova com outro identificador',()=>{
  const state=fresh();
  state.tombstones.exams.push('old-exam');
  const result=applyDelta(state,{exams:[{id:'new-exam',title:'Reimportação corrigida'}]});
  assert.equal(result.state.exams[0].id,'new-exam');
});
