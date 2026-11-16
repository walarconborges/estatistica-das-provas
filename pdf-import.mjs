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
 const left=q.sourceLayout==='SINGLE_COLUMN'?23:q.sourceColumn===0?23:separator+7;
 // A arte da FEPESE chega até x≈297,6 no A4 reduzido (largura 581,1),
 // ultrapassando levemente o centro geométrico sem invadir o texto à direita.
 const right=q.sourceLayout==='SINGLE_COLUMN'?pageWidth-23:q.sourceColumn===0?(q.sourceLayout==='FEPESE'?separator+9:separator-5):pageWidth-23;
 const segment=q.visualSegments&&q.visualSegments.bottom-q.visualSegments.top>45?q.visualSegments:null;
 const top=Math.max(15,Math.min(segment?segment.top:q.startY-14,pageHeight-55));
 // Questões com extração incompleta precisam da questão INTEIRA,
 // incluindo todas as alternativas impressas, não apenas do enunciado.
 const bottom=Math.min(pageHeight-24,Math.max(top+30,
  q.extractionFallback?q.endY+4:
  (segment?segment.bottom:q.optionsStartY?Math.min(q.endY,q.optionsStartY-8):q.endY+4)));
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
 for(const q of questions.filter(q=>q.imageOnly&&!q.continuation)){
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
 // Composite two printed pages when one question crosses the break.
 // In particular, alternatives and diagrams must not be dropped.
 for(const q of questions.filter(q=>q.imageOnly&&q.continuation)){
  let lastError=null;
  for(const scale of [1.35,1.0]){
   const canvases=[];
   try{
    const parts=[];
    for(const number of [q.sourcePage,q.continuation.nextPage]){
     const page=await doc.getPage(number),viewport=page.getViewport({scale});
     const canvas=createCanvas();canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
     canvases.push(canvas);
     const ctx=canvas.getContext('2d',{alpha:false})||canvas.getContext('2d');
     if(!ctx)throw Error('Canvas 2D indisponível');
     await page.render({canvasContext:ctx,viewport}).promise;
     const crop=number===q.sourcePage
      ?questionCropBounds(q,viewport.width/scale,viewport.height/scale,scale)
      :(()=>{const left=23,top=15,right=viewport.width/scale-23;
       const bottom=Math.min(viewport.height/scale-24,q.continuation.nextEndY+3);
       return {x:Math.floor(left*scale),y:Math.floor(top*scale),
        width:Math.floor((right-left)*scale),
        height:Math.ceil(Math.max(30,bottom-top)*scale)};})();
     parts.push({canvas,crop});
    }
    const width=Math.max(...parts.map(p=>p.crop.width));
    const height=parts.reduce((sum,p)=>sum+p.crop.height,0);
    const output=createCanvas();output.width=width;output.height=height;
    const ctx=output.getContext('2d',{alpha:false})||output.getContext('2d');
    if(!ctx)throw Error('Canvas 2D indisponível no recorte composto');
    let offsetY=0;
    for(const {canvas,crop} of parts){
     ctx.drawImage(canvas,crop.x,crop.y,crop.width,crop.height,
      0,offsetY,crop.width,crop.height);
     offsetY+=crop.height;
    }
    const image=output.toDataURL('image/jpeg',0.72);
    if(!image||!image.startsWith('data:image/'))throw Error('Imagem composta vazia');
    q.pageImage=image;delete q.imageError;output.width=0;output.height=0;
    lastError=null;break;
   }catch(e){lastError=e;}
   finally{for(const canvas of canvases){canvas.width=0;canvas.height=0;}}
  }
  if(lastError){
   q.imageError=String(lastError?.message||lastError);
   errors.push({question:q.originalNumber,page:q.sourcePage,error:q.imageError});
  }
 }
 return errors;
}

/**
 * O rodapé identifica algumas bancas mesmo quando está fora da área
 * extraída para as questões. Preservar a assinatura como METADADO,
 * sem inserir o rodapé nos enunciados nem nos recortes.
 */
export function pdfMetadataHints(items=[],visibleText=''){
 const signatures=[...new Set(items.map(x=>String(x?.str||'').trim())
  .filter(x=>/\bVNSP\d{3,}\/\d{2,3}/i.test(x)))];
 return signatures.filter(x=>!visibleText.includes(x)).slice(0,4).join('\n');
}
export async function readPdf(file,{images=true,extractQuestions=false}={}){
 if(!file)return {text:'',pages:[],questions:[],contexts:[],imageErrors:[]};
 const lib=await pdfjs();
 const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 const loaded=[];
 try{
  const pages=[];
  let singleColumn=false;
  for(let number=1;number<=doc.numPages;number++){
   const page=await doc.getPage(number);
   loaded.push(page);
   const content=await page.getTextContent();
   const width=page.view[2]-page.view[0],height=page.view[3]-page.view[1];
   if(number===1&&extractQuestions){
    const cover=(content.items||[]).map(x=>String(x.str||'')).join(' ')
     .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    // O caderno de 2016 é de uma coluna, sem separador central.
    singleColumn=/PREFEITURA DO MUNICIPIO DE OURO PRETO DO OESTE/.test(cover)&&
     /PROFESSOR NIVEL II/.test(cover)&&/SERIES INICIAIS/.test(cover);
   }
   const lines=spatialLines(content.items||[],width,height,{split:extractQuestions&&!singleColumn});
   const visible=lines.map(l=>l.text).join('\n');
   const metadataFooter=pdfMetadataHints(content.items||[],visible);
   pages.push({number,width,height,lines,singleColumn,text:visible+(metadataFooter?'\n'+metadataFooter:'')});
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
