import test from 'node:test';
import assert from 'node:assert/strict';
import {STUDY_CONTEXT,isLocalLegislation,studyEligibility,eligibleForList} from '../study-context.mjs';
const exam={orgao:'CMVOTORANTIM'};
test('referência atual é Candeias do Jamari sem alterar os originais',()=>{
 assert.equal(STUDY_CONTEXT.municipality,'Candeias do Jamari');
 assert.equal(STUDY_CONTEXT.state,'RO');
});
test('questões comuns permanecem disponíveis para todos os municípios',()=>{
 const q={discipline:'Matemática',disciplineCode:'MA',stem:'Calcule 2 + 2.'};
 assert.equal(isLocalLegislation(q,exam),false);
 assert.equal(studyEligibility(q,exam,'candeias').allowed,true);
});
test('legislação institucional de outra Câmara aguarda validação jurídica',()=>{
 const q={discipline:'Legislação',disciplineCode:'LE',topic:'Legislação institucional',stem:'Segundo a Resolução 04 da Câmara Municipal de Votorantim...' };
 assert.equal(isLocalLegislation(q,exam),true);
 assert.equal(eligibleForList(q,exam,'candeias'),false);
 assert.equal(eligibleForList(q,exam,'original'),true);
});
test('nem a mera troca de localidade nem uma aprovação informal valem como adaptação',()=>{
 const q={discipline:'Legislação',disciplineCode:'LE',stem:'Câmara Municipal de Votorantim',adaptation:{target:STUDY_CONTEXT.id,approved:true}};
 assert.equal(studyEligibility(q,exam,'candeias').allowed,false);
});
test('adaptação verificada com fonte e gabarito pode ser considerada, preservando a questão original',()=>{
 const q={discipline:'Legislação',disciplineCode:'LE',stem:'Câmara Municipal de Candeias',
 adaptation:{target:STUDY_CONTEXT.id,approved:true,sourceUrl:'https://legislacao.candeiasdojamari.ro.leg.br/',sourceArticle:'Art. 1º',verifiedAnswer:'A'}};
 assert.equal(studyEligibility(q,{orgao:'CMCJ'},'candeias').allowed,true);
});
