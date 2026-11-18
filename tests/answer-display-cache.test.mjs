import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAnswerDisplayCache} from '../answer-display-cache.mjs';

test('resposta e feedback não somem após substituir o estado pela sincronização',()=>{
 const cache=createAnswerDisplayCache();
 const before={answer:'B',at:'2026-11-17T18:00:00Z'};
 assert.equal(cache.remember('perfil-a','questao-1','D'),true);
 const syncedLatest=null;
 assert.deepEqual(cache.displayed('perfil-a','questao-1',syncedLatest).answer,'D');
 assert.equal(cache.selected('perfil-a','questao-1'),'D');
 const newer={answer:'C',at:'2026-11-17T18:01:00Z'};
 assert.equal(cache.displayed('perfil-a','questao-1',newer).answer,'D');
 assert.equal(cache.displayed('perfil-a','questao-2',before),before);
});
test('trocar perfil não mistura alternativas nem a correção',()=>{
 const cache=createAnswerDisplayCache();
 cache.remember('perfil-a','questao-1','A');
 cache.remember('perfil-b','questao-1','E');
 assert.equal(cache.selected('perfil-a','questao-1'),'A');
 assert.equal(cache.selected('perfil-b','questao-1'),'E');
 assert.equal(cache.selected('perfil-a','questao-2'),'');
});
test('a nova resposta atualiza o resultado visível, mas não altera históricos',()=>{
 const cache=createAnswerDisplayCache(),original={answer:'C'};
 cache.remember('p','q','B');
 cache.remember('p','q','A');
 assert.equal(cache.displayed('p','q',original).answer,'A');
 assert.equal(original.answer,'C');
 assert.equal(cache.remember('p','q','invalida'),false);
 assert.equal(cache.selected('p','q'),'A');
});
test('recarregar a página cria uma memória vazia; o histórico oficial continua disponível',()=>{
 const oldPage=createAnswerDisplayCache();
 oldPage.remember('p','q','D');
 const afterRefresh=createAnswerDisplayCache(),historical={answer:'D'};
 assert.equal(afterRefresh.selected('p','q'),'');
 assert.equal(afterRefresh.displayed('p','q',historical),historical);
});
test('interface restaura a marcação e o feedback em cada renderização',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 assert.match(app,/const pageAnswers=createAnswerDisplayCache\(\)/);
 assert.match(app,/const last=visibleAnswer\(q\.id\)/);
 assert.match(app,/const selectedInView=scope==='single'\?\(pageAnswers\.selected/);
 assert.match(app,/alternatives\(q,scope,selectedInView\)/);
 assert.match(app,/const q=question\(qid\),last=visibleAnswer\(qid\)/);
 assert.match(app,/pageAnswers\.remember\(profileId,qid,input\.value\)/);
});
