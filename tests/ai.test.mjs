import test from 'node:test';
import assert from 'node:assert/strict';
import {canExplain,contentFingerprint,explanationPath,promptFor,modelResponseText,isDailyLimitError} from '../worker/explanations.mjs';
const q={
 id:'questao-1',code:'Q2026LP1',stem:'Qual palavra está grafada corretamente?',
 options:'ABCDE'.split('').map((letter,i)=>({letter,text:'Resposta '+i})),
 answer:'B',status:'active',discipline:'Língua Portuguesa',topic:'Ortografia'
};
test('somente questão íntegra e com gabarito pode ser explicada',()=>{
 assert.equal(canExplain(q).ok,true);
 assert.equal(canExplain({...q,answer:''}).ok,false);
 assert.equal(canExplain({...q,status:'annulled'}).ok,false);
 assert.equal(canExplain({...q,imageOnly:true}).ok,false);
 assert.equal(canExplain({...q,visualSegments:{top:100,bottom:200}}).ok,false);
});
test('legislação municipal não pode ser explicada sem fonte jurídica',()=>{
 const law={...q,discipline:'Legislação',disciplineCode:'LE',stem:'Segundo a Câmara Municipal de Votorantim, a Procuradoria é vinculada a quê?'};
 assert.equal(canExplain(law).ok,false);
});
test('fingerprint depende do gabarito e do enunciado, não do usuário',async()=>{
 const dig=async bytes=>new Uint8Array([...bytes].reduce((a,b,i)=>{a[i%8]=(a[i%8]+b+i)%256;return a},Array(8).fill(0))).buffer;
 const a=await contentFingerprint(q,dig);
 assert.equal(a,await contentFingerprint(q,dig));
 assert.notEqual(a,await contentFingerprint({...q,answer:'C'},dig));
 assert.notEqual(a,await contentFingerprint({...q,stem:'Outro enunciado'},dig));
});
test('prompt mantém o gabarito e instrui a não inventar fontes',()=>{
 const out=promptFor(q);
 assert.equal(out.length,2);
 assert.match(out[0].content,/Não invente artigos/);
 assert.match(out[1].content,/GABARITO FORNECIDO: B/);
 assert.match(out[1].content,/Qual palavra/);
});
test('caminho do cache é restrito ao ID da questão',()=>{
 assert.equal(explanationPath(q),'data/explanations/questao-1.json');
 assert.throws(()=>explanationPath({...q,id:'../state.json'}));
});
test('limite diário é distinguido de falha técnica',()=>{
 assert.equal(isDailyLimitError(new Error('Quota exceeded: 10000 neurons')),true);
 assert.equal(isDailyLimitError(new Error('Falha na conexão com GitHub')),false);
 assert.equal(modelResponseText({response:' Explicação objetiva. '}),'Explicação objetiva.');
});
