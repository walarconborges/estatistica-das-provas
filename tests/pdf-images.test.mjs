import test from 'node:test';
import assert from 'node:assert/strict';
import {questionCropBounds,renderVisualQuestions,pdfMetadataHints} from '../pdf-import.mjs';
import {spatialQuestions,questionIntegrity,spatialLines} from '../pdf-layout.mjs';

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


test('recorte de questão recuperada inclui todas as alternativas, sem truncar na primeira',()=>{
 const q={...question(25,5),extractionFallback:true,optionsStartY:180,startY:44,endY:250};
 const fallback=questionCropBounds(q,595.28,841.89);
 const ordinary=questionCropBounds({...q,extractionFallback:false},595.28,841.89);
 assert.ok(fallback.bottom>=250);
 assert.ok(fallback.bottom>ordinary.bottom);
});
test('títulos QUESTÃO e número separados são reunidos pela posição original',()=>{
 const H=841.89;
 const item=(str,x,y,width)=>({str,transform:[1,0,0,1,x,H-y],width,height:10});
 const lines=spatialLines([item('QUESTÃO',313.7,52,38),item('17',354.4,56,10),
  item('Um ninja escolhe três passagens.',313.2,76,171)],595.28,H);
 assert.ok(lines.some(row=>row.text==='QUESTÃO 17'));
});
test('Quadrix 50 questões: alternativas perdidas são recuperadas visualmente sem omissão',async()=>{
 const pages=[];
 const cases=new Set([16,17,18,20,25,43]);
 for(let p=0;p<10;p++){
  const page={number:p+1,width:595.28,height:841.89,lines:[]};
  for(let n=p*5+1;n<=p*5+5;n++){
   const within=n-p*5-1,col=within<3?0:1,y=45+(within%3)*230;
   page.lines.push({col,y,text:'QUESTÃO '+n});
   page.lines.push({col,y:y+25,text:'Enunciado original da questão '+n+'.'});
   const count=cases.has(n)?n===25?2:n===43?4:0:5;
   for(let i=0;i<count;i++)page.lines.push({col,y:y+70+i*16,text:'('+String.fromCharCode(65+i)+') '+(i+1)});
  }
  pages.push(page);
 }
 const parsed=spatialQuestions(pages).questions;
 assert.equal(parsed.length,50);
 assert.deepEqual(parsed.map(x=>x.originalNumber),Array.from({length:50},(_,i)=>i+1));
 for(const number of cases){
  const q=parsed.find(x=>x.originalNumber===number);
  assert.equal(q.extractionFallback,true,'Questão '+number);
  assert.equal(q.imageOnly,true);
  assert.equal(q.extractionReview,true);
  assert.equal(q.options.map(x=>x.letter).join(''),'ABCDE');
 }
 const pdf={async getPage(){return {
  getViewport({scale}){return {width:595.28*scale,height:841.89*scale}},
  render(){return {promise:Promise.resolve()}}
 }}};
 const errors=await renderVisualQuestions(pdf,parsed,{createCanvas:canvas});
 assert.deepEqual(errors,[]);
 for(const q of parsed.filter(x=>x.extractionFallback))assert.match(q.pageImage,/^data:image\/jpeg/);
 const key=Object.fromEntries(Array.from({length:50},(_,i)=>[i+1,'A']));
 assert.deepEqual(questionIntegrity(parsed,key,50),[]);
 const failedImage={...parsed[24],pageImage:null};
 assert.match(questionIntegrity([failedImage],{25:'A'},0).join('; '),/alternativas não reconhecidas/);
});

test('FEPESE: tirinha original de Brusque não perde os 12 pontos da borda direita',()=>{
 const q={...question(2,4),sourceLayout:'FEPESE',sourceColumn:0,
  visualSegments:{top:85,bottom:390,beforeText:'Analise a imagem abaixo',
   afterText:'Assinale a alternativa correta'},
  startY:68,endY:480};
 const crop=questionCropBounds(q,581.1,779.53);
 assert.ok(crop.right>=297.63,'A imagem da página 4 termina em x=297.62');
 assert.ok(crop.right<304,'Não incluir texto da coluna direita.');
 assert.ok(crop.top<=91.7&&crop.bottom>=384.7,'A figura completa deve estar no recorte');
});

test('VUNESP: assinatura no rodapé excluído da página continua disponível para metadados',()=>{
 const items=[
  {str:'002. Prova Objetiva',transform:[1,0,0,1,204,642],width:190},
  {str:'VNSP2511/002-AnInfor-II-DesenvSistemasInstitucionais',
   transform:[1,0,0,1,34,19],width:280}
 ];
 const visible=spatialLines(items,595.28,841.89).map(r=>r.text).join('\n');
 assert.ok(!visible.includes('VNSP2511'));
 assert.match(pdfMetadataHints(items,visible),/VNSP2511\/002/);
 assert.equal(pdfMetadataHints(items,visible+'\n'+items[1].str),'');
});
