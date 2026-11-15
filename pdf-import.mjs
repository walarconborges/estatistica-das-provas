// Leitura espacial de PDFs e recorte de figuras com PDF.js, executados no navegador.
import {spatialLines,spatialQuestions} from './pdf-layout.mjs';
let cached;
export async function pdfjs(){
 if(!cached)cached=import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs')
  .then(lib=>{lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';return lib})
  .catch(e=>{cached=null;throw Error('Leitor de PDF indisponível: '+e.message)});
 return cached;
}

export function questionCropBounds(q,pageWidth,pageHeight,scale=1.4){
 const separator=pageWidth/2;
 const left=q.sourceColumn===0?23:separator+7;
 const right=q.sourceColumn===0?separator-5:pageWidth-23;
 const top=Math.max(15,Math.min(q.startY-14,pageHeight-55));
 const bottom=Math.min(pageHeight-24,Math.max(top+30,q.endY+4));
 return {
  left,top,right,bottom,scale,
  x:Math.max(0,Math.floor(left*scale)),y:Math.max(0,Math.floor(top*scale)),
  width:Math.max(1,Math.floor((right-left)*scale)),
  height:Math.max(1,Math.ceil((bottom-top)*scale))
 };
}

/**
 * Uma única renderização por página serve todas as figuras dessa página.
 * A leitura dos itens de texto e a renderização ocorrem ANTES de page.cleanup().
 * Não confunde erro de imagem com problema no reconhecimento das alternativas.
 */
export async function renderVisualQuestions(doc,questions,{createCanvas=()=>document.createElement('canvas')}={}){
 const errors=[];
 const groups=new Map();
 for(const q of questions.filter(q=>q.imageOnly)){
  const id=q.sourcePage;
  if(!groups.has(id))groups.set(id,[]);
  groups.get(id).push(q);
 }
 for(const [number,group] of groups){
  const page=await doc.getPage(number);
  let lastError;
  for(const scale of [1.45,1.0]){
   try{
    const viewport=page.getViewport({scale});
    const canvas=createCanvas();
    canvas.width=Math.ceil(viewport.width);
    canvas.height=Math.ceil(viewport.height);
    const ctx=canvas.getContext('2d',{alpha:false})||canvas.getContext('2d');
    if(!ctx)throw Error('Canvas 2D indisponível');
    await page.render({canvasContext:ctx,viewport}).promise;
    for(const q of group){
     const crop=questionCropBounds(q,viewport.width/scale,viewport.height/scale,scale);
     const output=createCanvas();output.width=crop.width;output.height=crop.height;
     const outputCtx=output.getContext('2d');
     if(!outputCtx)throw Error('Não foi possível recortar o Canvas');
     outputCtx.drawImage(canvas,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
     const image=output.toDataURL('image/jpeg',0.67);
     if(!image||!image.startsWith('data:image/'))throw Error('A imagem gerada está vazia');
     q.pageImage=image;
     delete q.imageError;
     output.width=0;output.height=0;
    }
    canvas.width=0;canvas.height=0;
    lastError=null;
    break;
   }catch(e){
    lastError=e;
    console.warn('Renderização da página '+number+' falhou na escala '+scale,e);
   }
  }
  if(lastError){
   for(const q of group.filter(x=>!x.pageImage)){
    q.imageError=String(lastError?.message||lastError);
    errors.push({question:q.originalNumber,page:number,error:q.imageError});
   }
  }
 }
 return errors;
}

export async function readPdf(file,{images=true,extractQuestions=false}={}){
 if(!file)return {text:'',pages:[],questions:[],contexts:[],imageErrors:[]};
 const lib=await pdfjs();
 const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 const loaded=[];
 try{
  const pages=[];
  for(let number=1;number<=doc.numPages;number++){
   const page=await doc.getPage(number);
   loaded.push(page);
   const content=await page.getTextContent();
   const width=page.view[2]-page.view[0],height=page.view[3]-page.view[1];
   const lines=spatialLines(content.items||[],width,height,{split:extractQuestions});
   pages.push({number,width,height,lines,text:lines.map(l=>l.text).join('\n')});
   // A limpeza é adiada porque páginas com tabelas poderão ser renderizadas mais tarde.
  }
  const extraction=extractQuestions?spatialQuestions(pages):{questions:[],contexts:[]};
  const imageErrors=images&&extractQuestions
    ?await renderVisualQuestions(doc,extraction.questions)
    :[];
  return {text:pages.map(p=>'[[PAGE:'+p.number+']]\n'+p.text).join('\n'),pages,questions:extraction.questions,contexts:extraction.contexts,imageErrors};
 }finally{
  for(const page of loaded)try{page.cleanup()}catch{}
  await doc.destroy();
 }
}
