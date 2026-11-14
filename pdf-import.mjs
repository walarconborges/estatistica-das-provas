// Leitor de PDF para navegador. PDF.js é carregado sob demanda; revisão humana continua necessária.
let cached;
export async function pdfjs(){
  if(!cached)cached=import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs')
    .then(lib=>{lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';return lib})
    .catch(e=>{cached=null;throw new Error('Leitor de PDF indisponível. Verifique a conexão e tente novamente. '+e.message)});
  return cached;
}
export async function readPdf(file,{images=true}={}){
  if(!file)return {text:'',pages:[]};
  const lib=await pdfjs(),bytes=new Uint8Array(await file.arrayBuffer());
  const doc=await lib.getDocument({data:bytes}).promise;
  const pages=[];
  for(let i=1;i<=doc.numPages;i++){
    const page=await doc.getPage(i);
    const content=await page.getTextContent();
    let lastY=null,text='';
    for(const item of content.items||[]){
      const y=item.transform?.[5]||0;
      if(lastY!==null&&Math.abs(lastY-y)>6)text+='\n';
      text+=(item.str||'')+' ';
      lastY=y;
    }
    let image=null;
    if(images&&text.trim().length<65){
      const viewport=page.getViewport({scale:1.2});
      const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;
      await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
      image=canvas.toDataURL('image/jpeg',.7);
    }
    pages.push({number:i,text,image});
    page.cleanup();
  }
  return {text:pages.map(p=>p.text).join('\n'),pages};
}
