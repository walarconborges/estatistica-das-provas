import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('interface não mostra campos de identificação manual e importa somente com reconhecimento automático',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 for(const name of ['Identificação manual','manualYear','manualBanca','manualOrgao','manualCode','manualAnswerPage','answer-page-review'])
  assert.ok(!app.includes(name),name);
 assert.ok(app.includes('completeExamMetadata(inferred)'));
 assert.ok(app.includes('chosenAnswerSection(keyRead.text,examRead.text,answerMatchInfo)'));
 assert.ok(app.includes('if(selected.error)throw Error(selected.error)'));
});
