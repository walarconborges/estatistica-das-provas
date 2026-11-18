import test from 'node:test';
import assert from 'node:assert/strict';
import {difficultySummary,pieSectors,renderDifficultyPie} from '../difficulty-pie.mjs';

function q(id,code,topic,status='active'){
 return {id,answer:'A',status,disciplineCode:code,
  discipline:code==='LP'?'Língua Portuguesa':'Informática',topic,topicCode:topic};
}
const a=(id,answer)=>({profileId:'p',questionId:id,answer});
test('menor número de acertos, abaixo de 50% e filtro de área',()=>{
 const state={questions:[q('1','LP','Pontuação'),q('2','LP','Pontuação'),q('3','IN','Redes'),q('4','IN','Redes'),q('5','LP','Compreensão')],
  attempts:[a('1','B'),a('2','B'),a('3','A'),a('4','B'),a('5','A')]};
 const all=difficultySummary(state,'p');
 assert.equal(all.hardest.topic,'Pontuação');
 assert.deepEqual(all.belowHalf.map(x=>x.topic),['Pontuação']);
 assert.equal(all.totalAnswered,5);
 const onlyLP=difficultySummary(state,'p','all','LP');
 assert.equal(onlyLP.rows.length,2);
 assert.equal(onlyLP.totalAnswered,3);
 assert.match(renderDifficultyPie(state,'p','all','LP'),/Menos acertos: Pontuação/);
});
test('50% não é menor que 50% e cada questão tem uma única resposta válida',()=>{
 const state={questions:[q('1','LP','Gramática'),q('2','LP','Gramática'),q('3','IN','Hardware','annulled'),q('4','LP','Gramática')],
 attempts:[a('1','B'),a('1','A'),a('2','B'),a('3','B')]};
 const result=difficultySummary(state,'p');
 assert.equal(result.rows.length,1);
 assert.equal(result.totalAnswered,2);
 assert.equal(result.rows[0].rate,50);
 assert.equal(result.belowHalf.length,0);
});
test('o banco geral desconsidera questão adaptada para não duplicar',()=>{
 const state={questions:[q('1','LP','Pontuação'),{...q('2','LP','Pontuação'),originalQuestionId:'1'}],
 attempts:[a('1','A'),a('2','B')]};
 assert.equal(difficultySummary(state,'p').totalAnswered,1);
});
test('fatias proporcionais aos totais fecham uma pizza de 360 graus',()=>{
 const parts=pieSectors([{total:1},{total:3}]);
 assert.deepEqual(parts.map(x=>[x.start,x.end]),[[-90,0],[0,270]]);
 assert.equal(pieSectors([{total:5}])[0].end,270);
 assert.equal(pieSectors([]).length,0);
});
