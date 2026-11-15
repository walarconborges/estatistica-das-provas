// Extração espacial: separa colunas e preserva a posição das questões na página.
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const noise=s=>/^(?:PCIMARKPCI\b|WWW\.PCICONCURSOS\.|CVOT\d+|CONFIDENCIAL ATE|\d{1,2}\s*$|R\s*A\s*S\s*C\s*U\s*N\s*H\s*O\s*$)/i.test(norm(s.trim()))||/MDAwM[A-Za-z0-9+/=]{35}/.test(s);
const questionRx=/^(?:QUEST[AÃ]O\s*)?(\d{1,3})\s*[.):\-]\s*(.*)$/i;
const altRx=/^\s*(?:\(([A-E])\)|([A-E])\s*[.):\-])\s*(.*)$/i;
const isHeading=s=>/^(?:L[IÍ]NGUA PORTUGUESA|MATEM[AÁ]TICA|RACIOC[IÍ]NIO L[OÓ]GICO|LEGISLA[CÇ][AÃ]O|CONHECIMENTOS ESPEC[IÍ]FICOS|INFORM[AÁ]TICA|DIREITO ADMINISTRATIVO|DIREITO CONSTITUCIONAL|CONHECIMENTOS GERAIS)$/i.test(s.trim());

export function spatialLines(items,pageWidth,pageHeight,{split=true}={}){
 const pieces=[];
 for(const item of items){
  const str=String(item.str||'').replace(/[\u0000-\u001f\u007f\u0090\u00ad]/g,'').trim();
  const x=Number(item.transform?.[4]||0),y=pageHeight-Number(item.transform?.[5]||0);
  if(!str||!Number.isFinite(x)||!Number.isFinite(y)||y<13||y>pageHeight-24||/^PCIMARKPCI\b|^WWW\.PCICONCURSOS\.|^CVOT\d+|^CONFIDENCIAL/i.test(str))continue;
  pieces.push({x,y,col:split?(x<pageWidth/2-1?0:1):0,str,width:Number(item.width||0)});
 }
 const lines=[];
 for(const col of split?[0,1]:[0]){
  const group=pieces.filter(i=>i.col===col).sort((a,b)=>a.y-b.y||a.x-b.x),rows=[];
  for(const item of group){
   let row=rows.at(-1);
   if(!row||Math.abs(item.y-row.y)>3.2){row={col,y:item.y,x:item.x,items:[]};rows.push(row)}
   row.items.push(item);
  }
  for(const row of rows){
   row.items.sort((a,b)=>a.x-b.x);
   let line='',prev=null;
   for(const it of row.items){if(prev&&it.x>prev.x+prev.width+1)line+=' ';line+=it.str;prev=it;}
   row.text=line.replace(/\s+/g,' ').trim();
   if(row.text&&!noise(row.text))lines.push({text:row.text,y:row.y,x:row.x,col,pageHeight,pageWidth});
  }
 }
 return lines;
}
function contextMarker(line){
 const m=line.match(/(?:LEIA|CONSIDERE)\s+(?:O\s+)?TEXTO\s+PARA\s+RESPONDER\s+[ÀA]S?\s+QUEST[OÕ]ES?\s+(?:DE\s*)?0?(\d{1,3})\s*A\s*0?(\d{1,3})\s*:/i);
 return m?{from:Number(m[1]),to:Number(m[2])}:null;
}
function needsImage(stem){
 const t=norm(stem);
 // "Tabela MAC" é uma estrutura lógica de um switch, não uma tabela desenhada no PDF.
 if(/\bTABELA\s+MAC\b/.test(t)&&!/\b(?:TABELA|QUADRO)\s+(?:A SEGUIR|ABAIXO)\b/.test(t))return false;
 return /\b(TABELA|DESENHO|FIGURA|GR[AÁ]FICO|PLANILHA|DIAGRAMA|ESQUEMA|CONTORNO DE UM TERRENO)\b/i.test(stem)
  ||/\b\d+\s*\/\s*\d+\b/.test(stem)||/O EQUIVALENTE A/i.test(stem);
}
export function spatialQuestions(pages){
 const questions=[],contexts=[];let heading='';
 for(const page of pages){
  if(!page.lines?.length)continue;
  for(const col of [0,1]){
   const lines=page.lines.filter(l=>l.col===col);
   if(!lines.length)continue;
   let current=null,collecting=null;
   function finish(at){
    if(!current)return;
    current.endY=Math.max(current.startY+12,Math.min(page.height-25,at));
    current.stem=current.stem.join('\n').trim();
    current.options=current.options.map(o=>({...o,text:o.text.trim()})).filter(o=>o.text);
    current.extractionReview=current.options.length!==5||current.options.some((o,i)=>o.letter!==String.fromCharCode(65+i));
    current.imageOnly=needsImage(current.stem);
    // Imagens do enunciado asseguram tabelas e fórmulas sem alterar as alternativas de resposta.
    if(current.stem&&current.options.length>=2)questions.push(current);
    current=null;
   }
   for(const row of lines){
    const s=row.text.trim();if(!s||noise(s))continue;
    const foundContext=contextMarker(s);
    if(foundContext){finish(row.y-2);collecting={...foundContext,text:[],page:page.number,col,startY:row.y};continue;}
    if(isHeading(s)){if(!current||!current.options.length)heading=s;continue;}
    const qm=s.match(questionRx);
    if(qm&&Number(qm[1])>=1&&Number(qm[1])<=300){
     if(current&&current.options.length<3&&Number(qm[1])!==current.originalNumber+1){
      current.stem.push(s);continue; // Frações tipográficas como 2.520 não criam questões novas.
     }
     finish(row.y-15);
     if(collecting){const shared={...collecting,text:collecting.text.join('\n').trim()};if(shared.text)contexts.push(shared);collecting=null;}
     const n=Number(qm[1]),context=contexts.find(x=>n>=x.from&&n<=x.to)||null;
     current={originalNumber:n,heading,stem:[qm[2]||''],options:[],sourcePage:page.number,sourceColumn:col,startY:row.y,endY:0,contextText:context?.text||'',contextRange:context?[context.from,context.to]:null,confidence:'média'};
     continue;
    }
    if(collecting){collecting.text.push(s);continue;}
    if(!current)continue;
    const am=s.match(altRx);
    if(am){current.options.push({letter:am[1]||am[2],text:am[3]||''});continue;}
    if(current.options.length)current.options.at(-1).text+='\n'+s;
    else current.stem.push(s);
   }
   finish(page.height-33);
  }
 }
 questions.sort((a,b)=>a.originalNumber-b.originalNumber);
 return {questions,contexts};
}
export function chosenAnswerSection(text,examText=''){
 const source=String(text||'').replace(/\r/g,'');
 const marks=[...source.matchAll(/(?:^|\n)\s*0{0,2}(\d{1,3})\s*[.]\s*PROVA\s+OBJETIVA\b/gim)];
 if(!marks.length)return {text:source,section:'única',error:null};
 const exam=norm(examText),code=exam.match(/\b0{0,2}(\d{1,3})\s*[.]\s*PROVA\s+OBJETIVA/),cargo=exam.includes('ANALISTA DE INFORMATICA')?'ANALISTA DE INFORMATICA':null;
 const sections=marks.map((m,i)=>({code:Number(m[1]),text:source.slice(m.index,marks[i+1]?.index||source.length)}));
 let found=code?sections.find(x=>x.code===Number(code[1])):null;
 if(!found&&cargo)found=sections.find(x=>norm(x.text.slice(0,140)).includes(cargo));
 if(!found&&sections.length===1)found=sections[0];
 if(!found)return {text:'',section:null,error:'O documento contém vários gabaritos e não foi possível encontrar o cargo correspondente.'};
 if(cargo&&!norm(found.text.slice(0,145)).includes(cargo))return {text:'',section:null,error:'O código da prova não corresponde ao cargo identificado no gabarito.'};
 return {text:found.text,section:String(found.code).padStart(3,'0'),error:null};
}
export function questionIntegrity(questions,answers,expected=0){
 const numbers=questions.map(q=>q.originalNumber),unique=[...new Set(numbers)].sort((a,b)=>a-b),issues=[];
 if(!unique.length)issues.push('Nenhuma questão identificada');
 if(unique[0]!==1)issues.push('A numeração não começa em 1');
 if(unique.length!==numbers.length)issues.push('Numeração repetida');
 if(expected&&unique.length!==expected)issues.push('Foram identificadas '+unique.length+' questões, mas o PDF declara '+expected);
 if(unique.length){for(let n=1;n<=unique.at(-1);n++)if(!unique.includes(n))issues.push('Questão ausente: '+n);}
 for(const q of questions){if(q.options.length!==5)issues.push('Questão '+q.originalNumber+' contém '+q.options.length+' alternativas');if(q.extractionReview)issues.push('Questão '+q.originalNumber+' tem alternativas não reconhecidas');}
 if(Object.keys(answers).length!==unique.length)issues.push('O gabarito possui '+Object.keys(answers).length+' respostas para '+unique.length+' questões');
 for(const n of unique)if(!answers[n])issues.push('Gabarito ausente para questão '+n);
 return issues;
}
