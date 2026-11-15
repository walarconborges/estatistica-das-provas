import test from 'node:test';
import assert from 'node:assert/strict';
import {questionCropBounds,renderVisualQuestions} from '../pdf-import.mjs';

function canvas(){
 return {
  width:0,height:0,
  getContext(){return {drawImage(){}};},
  toDataURL(){return 'data:image/jpeg;base64,/9j/mockimage';}
 };
}
function question(number,page=8){
 return {originalNumber:number,sourcePage:page,sourceColumn:0,startY:25,endY:360,imageOnly:true,
  options:'ABCDE'.split('').map(letter=>({letter,text:'Alternativa '+letter})),extractionReview:false};
}
test('recorte usa os limites da coluna correta',()=>{
 const left=questionCropBounds(question(17),595.28,841.89);
 const right=questionCropBounds({...question(17),sourceColumn:1},595.28,841.89);
 assert.ok(left.right<=595.28/2);
 assert.ok(right.left>=595.28/2);
 assert.ok(left.width>200&&left.height>200);
});
test('imagem renderizada não altera o reconhecimento das alternativas',async()=>{
 let renders=0;
 const pdf={async getPage(){return {getViewport({scale}){return {width:595.28*scale,height:841.89*scale}},render(){renders++;return {promise:Promise.resolve()}}}}};
 const a=question(17),b=question(19);
 const errors=await renderVisualQuestions(pdf,[a,b],{createCanvas:canvas});
 assert.deepEqual(errors,[]);
 assert.equal(renders,1,'uma renderização para questões na mesma página');
 for(const q of [a,b]){
  assert.match(q.pageImage,/^data:image\/jpeg;base64/);
  assert.deepEqual(q.options.map(x=>x.letter),'ABCDE'.split(''));
  assert.equal(q.extractionReview,false);
 }
});
test('falha na imagem não é confundida com falha nas alternativas',async()=>{
 const pdf={async getPage(){return {getViewport({scale}){return {width:595.28*scale,height:841.89*scale}},render(){return {promise:Promise.reject(Error('falha de renderização'))}}}}};
 const q=question(11);
 const errors=await renderVisualQuestions(pdf,[q],{createCanvas:canvas});
 assert.equal(errors.length,1);
 assert.equal(errors[0].question,11);
 assert.equal(q.extractionReview,false);
 assert.ok(q.imageError);
 assert.deepEqual(q.options.map(x=>x.letter),'ABCDE'.split(''));
});
test('renderizador tenta outra resolução se a primeira falha',async()=>{
 let count=0;
 const pdf={async getPage(){return {getViewport({scale}){return {width:595.28*scale,height:841.89*scale}},render(){return {promise:++count===1?Promise.reject(Error('memória insuficiente')):Promise.resolve()}}}}};
 const q=question(26);
 const errors=await renderVisualQuestions(pdf,[q],{createCanvas:canvas});
 assert.equal(count,2);
 assert.deepEqual(errors,[]);
 assert.ok(q.pageImage);
});
