import test from 'node:test';
import assert from 'node:assert/strict';
import {appendAutomaticAdaptations,matchingLegalFact,makeAutoAdaptation,LEGAL_FACTS} from '../legal-adapt.mjs';
import {studyEligibility} from '../study-context.mjs';
const base=stem=>({
 id:'original-1',code:'Q2026LELIVUNESPCMVOTORANTIM1',examId:'exam-1',originalNumber:21,
 year:'2026',banca:'VUNESP',orgao:'CMVOTORANTIM',
 discipline:'Legislação',disciplineCode:'LE',topic:'Legislação institucional',topicCode:'LI',
 options:'ABCDE'.split('').map(letter=>({letter,text:'Original '+letter})),answer:'D',status:'active',stem
});
const exam={id:'exam-1',orgao:'CMVOTORANTIM',title:'Prova VUNESP Votorantim',questionIds:['original-1']};
test('adaptação automática mantém a questão original e usa artigo e gabarito próprios',()=>{
 const original=base('Qual é o prazo de validade do concurso público, conforme a lei municipal?');
 const copy=JSON.stringify(original),state={exams:[exam],questions:[original]};
 const [adapted]=appendAutomaticAdaptations(state);
 assert.ok(adapted);
 assert.equal(state.questions.length,2);
 assert.equal(state.exams[0].questionIds.length,1);
 assert.equal(JSON.stringify(original),copy,'O original não pode ser modificado.');
 assert.equal(adapted.originalQuestionId,original.id);
 assert.notEqual(adapted.id,original.id);
 assert.notEqual(adapted.code,original.code);
 assert.equal(adapted.options.length,5);
 assert.equal(new Set(adapted.options.map(o=>o.text)).size,5);
 assert.equal(adapted.options.find(o=>o.letter===adapted.answer).text,LEGAL_FACTS.find(x=>x.id==='prazo-concurso').correct);
 assert.equal(adapted.adaptation.sourceArticle,'Art. 7º');
 assert.match(adapted.adaptation.sourceUrl,/^https:\/\/athus4\.candeiasdojamari/);
 assert.equal(studyEligibility(adapted,exam,'candeias').allowed,true);
 assert.equal(studyEligibility(adapted,exam,'original').allowed,false);
 assert.equal(appendAutomaticAdaptations(state).length,0,'Não duplicar variantes.');
});
test('posse de prefeito e vereadores não é posse/investidura de servidor',()=>{
 const original=base('A lavratura dos termos de posse do Prefeito, Vice-Prefeito e Vereadores compete a qual diretoria?');
 assert.equal(matchingLegalFact(original),null);
 const state={exams:[exam],questions:[original]};
 assert.equal(appendAutomaticAdaptations(state).length,0);
});
test('subordinação da Diretoria Legislativa sem equivalente fica inválida somente para Candeias',()=>{
 const original=base('A Diretoria Legislativa é diretamente subordinada à qual órgão da Câmara Municipal?');
 const state={exams:[exam],questions:[original]};
 assert.equal(appendAutomaticAdaptations(state).length,0);
 assert.equal(studyEligibility(original,exam,'candeias').allowed,false);
 assert.equal(studyEligibility(original,exam,'original').allowed,true);
});
test('questão de lei original de Candeias não precisa ser modificada',()=>{
 const original={...base('Segundo a Câmara Municipal de Candeias do Jamari, qual é o prazo de validade do concurso?'),orgao:'CMCJ'};
 const state={exams:[{...exam,id:'exam-1',orgao:'CMCJ',title:'Candeias do Jamari 2026'}],questions:[original]};
 assert.equal(appendAutomaticAdaptations(state).length,0);
});
test('casos com duas possíveis normas não recebem gabarito presumido',()=>{
 const original=base('Qual é o prazo de validade do concurso de provas e títulos?');
 assert.equal(matchingLegalFact(original),null);
});
test('corpo de uma adaptação contém a norma de Candeias, nunca a antiga cidade',()=>{
 const original=base('Como deve ocorrer a admissão de pessoal por concurso de provas?');
 const fact=matchingLegalFact(original);
 assert.equal(fact.id,'admissao-concurso');
 const variant=makeAutoAdaptation(original,fact);
 assert.match(variant.stem,/Candeias do Jamari/);
 assert.doesNotMatch(variant.stem,/Votorantim/);
 assert.equal(variant.adaptation.verifiedAnswer,variant.answer);
 assert.match(variant.adaptation.legalReason,/artigo 6º/);
});
