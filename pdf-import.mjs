// Leitura espacial do PDF no navegador. Sem envio dos documentos a terceiros.
import {spatialLines,spatialQuestions} from './pdf-layout.mjs';
let cached;
export async function pdfjs(){
 if(!cached)cached=import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs')
  .then(lib=>{lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';return lib})
  .catch(e=>{cached=null;throw Error('Leitor de PDF indisponível: '+e.message)});
 return cached;
}
async function croppedQuestion(document,q){
 const page=await document.getPage(q.sourcePage);
 const scale=1.9,viewport=page.getViewport({scale});
 const canvas=document.createElement('canvas');
 canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
 await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
 const left=q.sourceColumn===0?27:298,right=q.sourceColumn===0?page.view[2]/2:page.view[2]-26;
 const top=Math.max(16,q.startY-5),bottom=Math.min(page.view[3]-22,q.endY+3);
 const x=Math.floor(left*scale),y=Math.floor(top*scale);
 const width=Math.max(100,Math.floor((right-left)*scale)),height=Math.max(35,Math.ceil((bottom-top)*scale));
 const out=document.createElement('canvas');out.width=width;out.height=height;
 out.getContext('2d').drawImage(canvas,x,y,width,height,0,0,width,height);
 page.cleanup();
 return out.toDataURL('image/jpeg',0.72);
}
export async function readPdf(file,{images=true,extractQuestions=false}={}){
 if(!file)return {text:'',pages:[],questions:[],contexts:[]};
 const lib=await pdfjs();
 const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 try{
  const pages=[];
  for(let number=1;number<=doc.numPages;number++){
   const page=await doc.getPage(number),content=await page.getTextContent();
   const width=page.view[2]-page.view[0],height=page.view[3]-page.view[1];
   const lines=spatialLines(content.items||[],width,height,{split:extractQuestions});
   pages.push({number,width,height,lines,text:lines.map(l=>l.text).join('\n')});
   page.cleanup();
  }
  const extraction=extractQuestions?spatialQuestions(pages):{questions:[],contexts:[]};
  if(images&&extractQuestions){
   for(const q of extraction.questions.filter(q=>q.imageOnly)){
    try{q.pageImage=await croppedQuestion(doc,q)}catch(error){
     q.extractionReview=true;
     console.warn('Falha ao renderizar a questão '+q.originalNumber,error);
    }
   }
  }
  return {text:pages.map(p=>'[[PAGE:'+p.number+']]\n'+p.text).join('\n'),pages,questions:extraction.questions,contexts:extraction.contexts};
 }finally{await doc.destroy();}
}
