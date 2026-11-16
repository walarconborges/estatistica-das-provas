// Extração espacial: separa colunas e preserva a posição das questões na página.
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const noise=s=>/^(?:PCIMARKPCI\b|WWW\.PCICONCURSOS\.|CVOT\d+|CONFIDENCIAL ATE|R\s*A\s*S\s*C\s*U\s*N\s*H\s*O\s*$)/i.test(norm(s.trim()))||/MDAwM[A-Za-z0-9+/=]{35}/.test(s);
const questionRx=/^(?:QUEST[AÃ]O\s+0?(\d{1,3})(?:\s*[.):\-]\s*(.*))?|(\d{1,3})\s*[.):\-]\s*(.*))$/i;
const altRx=/^\s*(?:\(([A-E])\)|([A-E])\s*[.):\-])\s*(.*)$/i;
// A FEPESE imprime marcas de quadrinhos, inclusive a opção assinalada.
// Estes glifos não são parte das alternativas e não podem revelar o gabarito.
const stripAnswerBox=s=>String(s||'').replace(/^\s*(?:(?:Check[\s-]*square|SQUARE)\b|[☑☒☐□■])\s*/i,'').trim();
const isHeading=s=>/^(?:L[IÍ]NGUA PORTUGUESA|MATEM[AÁ]TICA(?:\s+E\s+RACIOC[IÍ]NIO\s+L[OÓ]GICO)?|RACIOC[IÍ]NIO L[OÓ]GICO(?:\s+E\s+MATEM[AÁ]TICA)?|LEGISLA[CÇ][AÃ]O|CONHECIMENTOS ESPEC[IÍ]FICOS|INFORM[AÁ]TICA|DIREITO ADMINISTRATIVO|DIREITO CONSTITUCIONAL|CONHECIMENTOS GERAIS)(?:\s+\d{1,3}\s+QUEST[OÕ]ES)?$/i.test(s.trim());
// Números de cadernos/cargos (ex.: "002. PROVA OBJETIVA") não são questões.
const isExamBookletHeader=s=>/^\s*0{0,2}\d{1,3}\s*[.)]\s*(?:PROVA\s+OBJETIVA|CADERNO\s+DE\s+(?:PROVA|QUEST[OÕ]ES)|CARGO\b)/i.test(String(s||''));


/**
 * Remove apenas quebras artificiais de linhas provenientes das colunas do PDF.
 * Substitui o glifo privado da seta SOMENTE no contexto de caminhos de menu.
 * Mantém símbolos desconhecidos para conferência humana, sem inventar significado.
 */
const imageCredit=/\(?\s*arquivo pessoal\s*;\s*imagem usada com autoriza[cç][aã]o\s*\)?/giu;
const creditLine=/^\(?\s*arquivo pessoal\s*;\s*imagem usada com autoriza[cç][aã]o\s*\)?$/iu;

/**
 * Recompõe quebras editoriais sem criar símbolos desconhecidos.
 * NÃO se deve inventar uma seta sempre que algum glifo falhar.
 * Frações simples já são tratadas a partir da geometria da página.
 */
export function humanizePdfText(input){
 let value=String(input||'').replace(/\u00ad/g,'');
 value=value.replace(imageCredit,'');
 // A seta só é inferida em caminhos de menus reconhecíveis.
 value=value.replace(/\b(Guia|Inserir|Formatar|Arquivo|Editar|Exibir|Ferramentas|Ferramenta|Ajuda|Exibição)\s+[\uE000-\uF8FF\uFFFD\u25A1]\s+(?=[\p{L}])/giu,'$1 → ');
 // Decomposição frequente de palavras justificadas em colunas PDF.
 value=value.replace(/([\p{L}])-[ \t]*\n[ \t]*([\p{Ll}])/gu,'$1$2');
 value=value.replace(/([\p{L}])-[ \t]+([\p{Ll}])/gu,'$1$2');
 // Os ordinais '3º slide' e '1º slide' às vezes são extraídos com
 // o pequeno 'o' tipográfico ao final da linha ou da alternativa.
 value=value.replace(/\b(\d{1,2})\s*[º°o]?\s+(slide|parágrafo|questão|lugar|semestre|item)\b/giu,'$1º $2');
 value=value.replace(/\b(\d{1,2})o(?=\s+(?:slide|parágrafo|questão|lugar|semestre|item)\b)/giu,'$1º');
 value=value.replace(/([.!?])\s+o\s*$/iu,(whole,punctuation,offset,s)=>
    /\b\d{1,2}º\s+(?:slide|parágrafo|questão|lugar|semestre|item)\b/iu.test(s)?punctuation:whole);
 // Junção conservadora de fragmentos conhecidos: não unir quaisquer palavras.
 value=value.replace(/\b(subsí)\s+(dios)\b/giu,'$1$2')
    .replace(/\b(insti)\s+(tuições)\b/giu,'$1$2')
    .replace(/\b(merca)\s+(dos)\b/giu,'$1$2');
 return value.replace(/\s*\n\s*/g,' ').replace(/[ \t]{2,}/g,' ').replace(/\s+([,.;:!?])/g,'$1').trim();
}

/**
 * O "o" de "2º parágrafo" e "nº 04" aparece em fonte menor acima
 * da linha. Não deve ser deslocado para o enunciado/alternativa anterior.
 */
export function attachSuperscriptOrdinals(pieces){
 const consumed=new Set();
 for(const mark of pieces){
  if(mark.str!=='o'||!mark.height||mark.height>=8.5)continue;
  const left=pieces.filter(p=>p!==mark&&p.col===mark.col&&
   /(?:\d|n)$/i.test(p.str.trim())&&p.height>mark.height*1.17&&
   Math.abs(p.y-mark.y)<=6.5&&
   mark.x-(p.x+p.width)>=-1.8&&mark.x-(p.x+p.width)<=4.5)
   .sort((a,b)=>Math.abs(a.x+a.width-mark.x)-Math.abs(b.x+b.width-mark.x))[0];
  if(!left)continue;
  const right=pieces.find(p=>p!==mark&&p!==left&&p.col===mark.col&&
   Math.abs(p.y-left.y)<=3.8&&
   p.x-(mark.x+mark.width)>=-2&&p.x-(mark.x+mark.width)<=6.5&&
   /^\s*(?:par[aá]grafo\b|0\d{1,2}\b)/iu.test(p.str));
  if(!right)continue;
  left.str=left.str+'º';
  left.width=Math.max(left.width,mark.x+mark.width-left.x);
  consumed.add(mark);
 }
 return pieces.filter(p=>!consumed.has(p));
}

/** Mantém listas numeradas e itens em parágrafos próprios. */
export function formatQuestionStem(parts){
 const text=humanizePdfText(Array.isArray(parts)?parts.join('\n'):String(parts||''));
 if(text.includes('•')){
  return text.replace(/\s*•\s*/gu,'\n• ')
   .replace(/^([^\n]+)\n• /u,'$1\n\n• ')
   .replace(/(\(\d{1,2}º\s+parágrafo\))\s+(?=(?:As expressões|Os termos|As vírgulas|As afirmações|De acordo|Assinale|Considerando)\b)/giu,'$1\n\n')
   .replace(/(\.\.\.|\.)\s+(?=(?:As expressões|Os termos|As vírgulas|As afirmações)\b)/giu,'$1\n\n')
   .trim();
 }
 const source=Array.isArray(parts)?parts:[String(parts||'')];
 const hashRows=source.filter(s=>/^\s*[\p{L}][\p{L}\d_-]{1,24}\s+[a-f0-9]{32,64}\s*$/iu.test(s));
 if(hashRows.length>=2){
  let value=text;
  for(const raw of hashRows){
   const item=raw.trim();
   value=value.replace(item,'\n'+item);
  }
  value=value.replace(/(\b[a-f0-9]{32,64})\s+(?=(?:Considerando|Com base|De acordo|Assinale)\b)/iu,'$1\n\n');
  return value.replace(/[ \t]+\n/g,'\n').trim();
 }
 return text;
}

function restoreVerticalFractions(pieces){
 const consumed=new Set();
 for(const upper of pieces){
  if(!/^\d{1,3}$/.test(upper.str)||upper.width>22)continue;
  const below=pieces.find(lower=>lower!==upper&&!consumed.has(lower)&&
   /^\d{1,3}$/.test(lower.str)&&lower.width<22&&
   Math.abs(lower.x-upper.x)<2.8&&lower.y-upper.y>10&&lower.y-upper.y<17.5);
  if(!below)continue;
  // FEPESE e outras bancas alinham alternativas numéricas a cada 12 pt.
  // '13' sobre '15' na mesma coluna NÃO é a fração 13/15 quando cada
  // número tem um marcador (a., b., SQUARE, Check-square) à esquerda.
  const isAlternativeMarker=str=>/^(?:(?:CHECK[ -]?)?SQUARE|[A-E][.):\-]?|\([A-E]\))$/i.test(String(str||'').trim());
  const isChoiceValue=value=>pieces.some(part=>part!==value&&part.col===value.col&&
    Math.abs(part.y-value.y)<5.5&&part.x<value.x&&
    value.x-(part.x+part.width)<35&&isAlternativeMarker(part.str));
  if(isChoiceValue(upper)||isChoiceValue(below))continue;
  const neighbor=pieces.find(p=>p!==upper&&p!==below&&p.col===upper.col&&
    p.x<upper.x&&upper.x-(p.x+p.width)<15&&
    Math.abs(p.y-upper.y-3.5)<3.7&&p.str.length>=2);
  if(!neighbor)continue; // impede transformar colunas de números de tabelas em frações
  // No PDF, numerador/denominador ficam ACIMA e ABAIXO da linha.
  // A fração completa deve ocupar a linha do texto vizinho, não a do numerador.
  // Sem isso, várias frações da mesma linha são deslocadas para a linha anterior
  // (casos reais das questões 11 e 15 da VUNESP).
  upper.str=upper.str+'/'+below.str;
  upper.y=neighbor.y;
  upper.x=Math.min(upper.x,below.x);
  upper.width=Math.max(upper.width,below.width);
  consumed.add(below);
 }
 return pieces.filter(p=>!consumed.has(p));
}

/**
 * Alguns PDFs Quadrix separam o título em dois itens de texto:
 * "QUESTÃO" + "16". Sem reunir esses dois itens, a questão desaparece.
 * Apenas títulos explícitos são reunidos; números do enunciado não são.
 */
function restoreSplitQuestionHeadings(pieces){
 const used=new Set();
 for(const word of pieces){
  if(!/^QUEST[AÃ]O$/i.test(word.str)||used.has(word))continue;
  const right=pieces.filter(p=>p!==word&&!used.has(p)&&p.col===word.col&&
    /^\d{1,3}$/.test(p.str)&&Math.abs(p.y-word.y)<=7.5&&
    p.x>=word.x+word.width-4&&p.x-(word.x+word.width)<16)
   .sort((a,b)=>Math.abs(a.y-word.y)-Math.abs(b.y-word.y)||a.x-b.x)[0];
  if(!right)continue;
  word.str+=' '+right.str;
  word.width=Math.max(word.width,right.x+right.width-word.x);
  used.add(right);
 }
 return pieces.filter(p=>!used.has(p));
}

export function spatialLines(items,pageWidth,pageHeight,{split=true}={}){
 const pieces=[];
 for(const item of items){
  const str=String(item.str||'').replace(/[\u0000-\u001f\u007f\u0090\u00ad]/g,'').trim();
  const x=Number(item.transform?.[4]||0),y=pageHeight-Number(item.transform?.[5]||0);
  if(!str||!Number.isFinite(x)||!Number.isFinite(y)||y<13||y>pageHeight-24||/^PCIMARKPCI\b|^WWW\.PCICONCURSOS\.|^CVOT\d+|^CONFIDENCIAL/i.test(str))continue;
  pieces.push({x,y,col:split?(x<pageWidth/2-1?0:1):0,str,width:Number(item.width||0),height:Number(item.height||Math.abs(item.transform?.[3])||0)});
 }
 const normalizedPieces=restoreVerticalFractions(attachSuperscriptOrdinals(restoreSplitQuestionHeadings(pieces)));
 const lines=[];
 for(const col of split?[0,1]:[0]){
  const group=normalizedPieces.filter(i=>i.col===col).sort((a,b)=>a.y-b.y||a.x-b.x),rows=[];
  for(const item of group){
   let row=rows.at(-1);
   if(!row||Math.abs(item.y-row.y)>4.8){row={col,y:item.y,x:item.x,items:[]};rows.push(row)}
   row.items.push(item);
  }
  for(const row of rows){
   row.items.sort((a,b)=>a.x-b.x);
   let line='',prev=null;
   for(const it of row.items){
    const fraction=/^\d{1,3}\/\d{1,3}$/;
    const spaceNearFraction=prev&&(
      (fraction.test(it.str)&&/[\p{L}\p{N}]$/u.test(prev.str))||
      (fraction.test(prev.str)&&/^[\p{L}\p{N}]/u.test(it.str))
    );
    const spaceAfterOrdinal=prev&&/º$/u.test(prev.str)&&/^[\p{L}\p{N}]/u.test(it.str);
    const spaceAfterAlternative=prev&&/^\(?[A-E]\)?[.):\-]?$/i.test(prev.str)&&/^[\p{L}\p{N}]/u.test(it.str);
    if(prev&&(it.x>prev.x+prev.width+1||spaceNearFraction||spaceAfterOrdinal||spaceAfterAlternative))line+=' ';
    line+=it.str;prev=it;
   }
   row.text=line.replace(/\s+/g,' ').trim();
   if(row.text&&!noise(row.text))lines.push({text:row.text,y:row.y,x:row.x,col,pageHeight,pageWidth});
  }
 }
 return lines;
}
function contextMarker(line){
 const m=line.match(/(?:LEIA|CONSIDERE)\s+(?:O\s+)?TEXTO\s+PARA\s+RESPONDER\s+[ÀA]S?\s+QUEST[OÕ]ES?\s+(?:DE\s*)?0?(\d{1,3})\s*A\s*0?(\d{1,3})\s*:/i)||line.match(/^TEXTO\s+PARA\s+(?:AS\s+)?QUEST[OÕ]ES?\s+(?:DE\s*)?0?(\d{1,3})\s*A\s*0?(\d{1,3})\s*\.?$/i);
 return m?{from:Number(m[1]),to:Number(m[2])}:null;
}
function needsImage(stem){
 const t=norm(stem);
 // "Tabela MAC" é uma estrutura lógica de um switch, não uma tabela desenhada no PDF.
 if(/\bTABELA\s+MAC\b/.test(t)&&!/\b(?:TABELA|QUADRO)\s+(?:A SEGUIR|ABAIXO)\b/.test(t))return false;
 return /\b(TABELA|IMAGEM|DESENHO|FIGURA|GR[AÁ]FICO|PLANILHA|DIAGRAMA|ESQUEMA|TIRA|TIRINHA|CHARGE|CARTUM|CONTORNO DE UM TERRENO)\b/i.test(stem)
  ;
}

/**
 * Se parte das alternativas for extraída incorretamente, preserva a
 * questão inteira como imagem fiel do próprio PDF. As cinco letras
 * permanecem selecionáveis, mas não se inventa texto nem gabarito.
 * A questão recebe o sinal de revisão da extração.
 */
function preserveOriginalInImage(q){
 q.extractionFallback=true;
 q.extractionReview=true;
 q.imageOnly=true;
 q.visualSegments=null;
 q.options='ABCDE'.split('').map(letter=>({letter,text:''}));
 q.confidence='baixa';
 q.stem=q.stem||'Questão reproduzida diretamente do PDF original.';
 return q;
}
function hasCompleteOptions(options){
 return Array.isArray(options)&&options.length===5&&
  options.every((o,i)=>o.letter===String.fromCharCode(65+i)&&String(o.text||'').trim());
}
/**
 * Resgata títulos explícitos "QUESTÃO N" que não sobreviveram ao
 * agrupamento de linhas e alternativas. O recorte com o enunciado
 * original evita qualquer reconstituição de conteúdo não confiável.
 */
function recoverExplicitQuestionHeadings(pages,questions){
 const existing=new Set(questions.map(q=>q.originalNumber));
 const recovered=[];
 for(const page of pages){
  for(const col of [0,1]){
   const lines=(page.lines||[]).filter(r=>r.col===col).sort((a,b)=>a.y-b.y);
   const headings=lines.map((r,i)=>{
    const m=r.text.trim().match(/^QUEST[AÃ]O\s+0?(\d{1,3})\s*[.):\-]?\s*$/i);
    return m?{row:r,index:i,n:Number(m[1])}:null;
   }).filter(Boolean);
   for(let j=0;j<headings.length;j++){
    const h=headings[j];
    if(h.n<1||h.n>300||existing.has(h.n))continue;
    const nextHeadingAt=headings[j+1]?.row.y||page.height-33;
    const notes=lines.slice(h.index+1).find(r=>r.y<nextHeadingAt&&/^ANOTA[ÇC][ÕO]ES$/i.test(r.text.trim()));
    const end=Math.min(nextHeadingAt-12,notes?.y-8||page.height-33);
    const rows=lines.slice(h.index+1,headings[j+1]?.index||lines.length)
     .filter(r=>r.y<end&&!/^(?:ANOTA[ÇC][ÕO]ES|QUEST[AÃ]O\s+\d+)$/i.test(r.text.trim()));
    const stem=humanizePdfText(rows.filter(r=>!altRx.test(r.text)).map(r=>r.text).join('\n'));
    const item=preserveOriginalInImage({
     originalNumber:h.n,heading:'',stem,stemRows:[],options:[],
     sourcePage:page.number,sourceColumn:col,
     startY:h.row.y,endY:Math.max(h.row.y+35,end),
     optionsStartY:null,contextText:'',contextRange:null
    });
    recovered.push(item);existing.add(h.n);
   }
  }
 }
 return recovered;
}

export function spatialQuestions(pages){
 const questions=[],contexts=[];let heading='';
 // Questões de bancas como a FEPESE começam na margem da coluna.
 // Listas numeradas dentro do enunciado começam recuadas: "1.", "2." etc.
 // A margem é obtida do próprio caderno, sem assumir coordenadas fixas.
 const useIndentationProtection=pages.some(page=>(page.lines||[]).some(row=>/FEPESE|MUNIC[IÍ]PIO DE BRUSQUE/i.test(String(row.text||''))));
 const questionLeftMargins=new Map();
 for(const page of pages)for(const row of page.lines||[]){
  if(!Number.isFinite(row.x)||!questionRx.test(String(row.text||'').trim()))continue;
  const col=row.col??0,previous=questionLeftMargins.get(col);
  if(previous===undefined||row.x<previous)questionLeftMargins.set(col,row.x);
 }
 for(const page of pages){
  if(!page.lines?.length)continue;
  for(const col of [0,1]){
   const lines=page.lines.filter(l=>l.col===col);
   if(!lines.length)continue;
   let current=null,collecting=null;
   function storeContext(){
    if(!collecting)return;
    const shared={...collecting,text:humanizePdfText(collecting.text.join('\n'))};
    if(shared.text)contexts.push(shared);
    collecting=null;
   }
   function finish(at){
    if(!current)return;
    current.endY=Math.max(current.startY+12,Math.min(page.height-25,at));
    const rows=current.stemRows||[];
    current.stem=formatQuestionStem(current.stem);
    current.options=current.options.map(o=>({...o,text:humanizePdfText(o.text)})).filter(o=>o.text);
    let bestGap=0,bestIndex=-1;
    for(let j=0;j<rows.length-1;j++){
      const gap=rows[j+1].y-rows[j].y;
      if(gap>bestGap){bestGap=gap;bestIndex=j}
    }
    // Se a figura possui legenda de autorização, ela delimita precisamente
    // o fim da ilustração e nunca é copiada para o enunciado.
    if(current.creditY&&current.optionsStartY){
      const earlier=rows.filter(r=>r.y<current.creditY);
      const intro=rows.findIndex(r=>/\b(?:desenho|tabela|figura|gr[aá]fico|planilha)\b/iu.test(r.text));
      // Texto antes de um desenho costuma ocupar várias linhas. Se existe
      // um vão grande até a legenda, a ilustração começa depois da última linha.
      // Já nas tabelas, a legenda vem logo depois da última linha de dados.
      const lastBefore=earlier.at(-1);
      const cutAt=lastBefore&&current.creditY-lastBefore.y>=60?
        rows.indexOf(lastBefore):(intro>=0?intro:0);
      const first=rows[cutAt],after=rows.filter(r=>r.y>current.creditY);
      if(first&&current.creditY-first.y>25){
        current.visualSegments={
          beforeText:humanizePdfText(rows.filter(r=>r.y<=first.y).map(r=>r.text).join('\n')),
          afterText:humanizePdfText(after.map(r=>r.text).join('\n')),
          top:first.y+16,bottom:current.creditY-6
        };
      }
    }else if(bestGap>=65&&bestIndex>=0&&current.optionsStartY){
      current.visualSegments={
        beforeText:humanizePdfText(rows.slice(0,bestIndex+1).map(r=>r.text).join('\n')),
        afterText:humanizePdfText(rows.slice(bestIndex+1).map(r=>r.text).join('\n')),
        top:rows[bestIndex].y+16,
        bottom:rows[bestIndex+1].y-3
      };
    }
    current.extractionReview=!hasCompleteOptions(current.options);
    // Para FEPESE, não reproduzir o enunciado completo como imagem: apenas
    // imagens genuínas com região gráfica separável por coordenadas.
    current.imageOnly=needsImage(current.stem)&&(!useIndentationProtection||Boolean(current.visualSegments));
    if(!current.imageOnly)delete current.visualSegments;
    // Jamais descarta silenciosamente uma QUESTÃO N porque alguma alternativa
    // foi separada pelo leitor do PDF. Usa o recorte fiel e 5 controles A–E.
    if(current.extractionReview||!current.stem)
      preserveOriginalInImage(current);
    questions.push(current);
    current=null;
   }
   for(const row of lines){
    const s=row.text.trim();if(!s||noise(s))continue;
    if(creditLine.test(s)){if(current)current.creditY=row.y;continue;}
    const foundContext=contextMarker(s);
    if(foundContext){finish(row.y-2);storeContext();collecting={...foundContext,text:[],page:page.number,col,startY:row.y};continue;}
    if(isHeading(s)){if(!current||!current.options.length)heading=s;continue;}
    if(/^ANOTA[ÇC][ÕO]ES$/i.test(s)){finish(row.y-8);continue;}
    if(isExamBookletHeader(s))continue;
    // Cabeçalho e rodapé do caderno Quadrix não fazem parte do texto-base.
    if(/^(?:ANALISTA DE INFORM[AÁ]TICA|CONSELHO REGIONAL DE QU[IÍ]MICA DA\s+5[ªA]\s+REGI[ÃA]O|QUADRIX\s*\|\s*20\d{2}|PROVA OBJETIVA)$/i.test(s))continue;
    const qm=s.match(questionRx);
    const explicitQuestionHeading=/^QUEST[AÃ]O\s+\d{1,3}\b/i.test(s);
    const margin=questionLeftMargins.get(col);
    const numberedSubitem=useIndentationProtection&&qm&&!explicitQuestionHeading&&Number.isFinite(row.x)&&
      Number.isFinite(margin)&&row.x>margin+12;
    if(qm&&!numberedSubitem&&Number(qm[1]||qm[3])>=1&&Number(qm[1]||qm[3])<=300){
     const qNumber=Number(qm[1]||qm[3]),qText=qm[2]||qm[4]||'';
     // Títulos "QUESTÃO N" são marcadores editoriais inequívocos;
     // só os falsos números "2.520" devem acionar a proteção.
     if(current&&current.options.length<3&&qNumber!==current.originalNumber+1&&!explicitQuestionHeading){
      current.stem.push(s);continue; // Frações tipográficas como 2.520 não criam questões novas.
     }
     finish(row.y-15);
     storeContext();
     const n=qNumber,context=contexts.find(x=>n>=x.from&&n<=x.to)||null;
     current={originalNumber:n,heading,stem:[qText],stemRows:[{y:row.y,text:qText}],options:[],optionsStartY:null,sourcePage:page.number,sourceColumn:col,startY:row.y,endY:0,contextText:context?.text||'',contextRange:context?[context.from,context.to]:null,confidence:'média'};
     continue;
    }
    if(collecting){collecting.text.push(s);continue;}
    if(!current)continue;
    const am=s.match(altRx);
    if(am){if(current.options.length===0)current.optionsStartY=row.y;current.options.push({letter:String(am[1]||am[2]).toUpperCase(),text:stripAnswerBox(am[3])});continue;}
    if(current.options.length)current.options.at(-1).text+='\n'+s;
    else{current.stem.push(s);current.stemRows.push({y:row.y,text:s})}
   }
   finish(page.height-33);
   storeContext();
  }
 }
 questions.push(...recoverExplicitQuestionHeadings(pages,questions));
 // FEPESE: o Texto 1 da questão 1 está na coluna esquerda, mas
 // continua na coluna direita ANTES da questão. Sem este vínculo,
 // os artigos da lei reproduzida no caderno desaparecem da questão.
 if(useIndentationProtection){
  for(const page of pages){
   const marker=(page.lines||[]).find(r=>/^TEXTO\s+\d+$/i.test(String(r.text||'').trim()));
   if(!marker)continue;
   const targets=questions.filter(q=>q.sourcePage===page.number&&q.sourceColumn!==marker.col);
   const target=targets.sort((a,b)=>a.startY-b.startY)[0];
   if(!target||target.contextText)continue;
   const left=(page.lines||[]).filter(r=>r.col===marker.col&&r.y>=marker.y&&
     !noise(String(r.text||''))&&!/^(?:P[AÁ]GINA\s+\d+|WWW\.)/i.test(String(r.text||'')))
     .sort((a,b)=>a.y-b.y).map(r=>r.text);
   const right=(page.lines||[]).filter(r=>r.col===target.sourceColumn&&r.y<target.startY-8&&
     r.y>=marker.y-45&&!noise(String(r.text||'')))
     .sort((a,b)=>a.y-b.y).map(r=>r.text);
   const shared=humanizePdfText([...left,...right].join('\n'));
   if(shared){
    target.contextText=shared;
    target.contextRange=[target.originalNumber,target.originalNumber];
    contexts.push({from:target.originalNumber,to:target.originalNumber,
      text:shared,page:page.number,col:marker.col});
   }
  }
 }
 if(useIndentationProtection)for(const q of questions)q.sourceLayout='FEPESE';
 questions.sort((a,b)=>a.originalNumber-b.originalNumber);
 return {questions,contexts};
}
export function chosenAnswerSection(text,examText='',examInfo={}){
 const source=String(text||'').replace(/\r/g,'');
 // Quadrix: um PDF de gabarito pode trazer vários cargos em seções
 // "2.7 ANALISTA DE INFORMÁTICA (CÓDIGO 401)", seguidas por duas
 // linhas de números e letras. A seleção é feita por cargo, não por
 // aparente primeiro gabarito do documento.
 const quadrixHeaders=[...source.matchAll(/(?:^|\n)\s*(2\.\d{1,2})\s+([^\n]{4,130})/g)]
   .filter(m=>/\b(?:ANALISTA|T[EÉ]CNICO|ADVOGADO|CONTADOR|JORNALISTA|ZELADORIA|MANUTEN[CÇ][AÃ]O|LIMPEZA|AGENTE|AUXILIAR)\b/i.test(m[2]));
 if(quadrixHeaders.length){
  // No caderno Quadrix CRQ-V, o nome "Analista de Informática" só
  // aparece no rodapé (linha cortada pela limpeza espacial do PDF).
  // O nome real do arquivo e o título inferido são fontes adicionais,
  // mas só se aceita uma seção única e explicitamente identificada.
  // Prioridade: o nome do arquivo selecionado pelo usuário, depois o
  // título inferido e, por último, o corpo da prova. Nomes de outros cargos
  // mencionados nos enunciados não devem gerar ambiguidade artificial.
  const sources=[
   norm(String(examInfo?.examFilename||'').replace(/[_-]+/g,' ')),
   norm(examInfo?.examTitle||''),
   norm(examText)
  ];
  const knownJobs=[
   'ANALISTA DE INFORMATICA',
   'TECNICO DE INFORMATICA',
   'AUXILIAR ADMINISTRATIVO',
   'ADVOGADO',
   'CONTADOR',
   'JORNALISTA',
   'AGENTE FISCAL',
   'ZELADORIA',
   'LIMPEZA',
   'MANUTENCAO'
  ];
  let jobs=[];
  for(const source of sources){
   if(!source)continue;
   const found=knownJobs.filter(job=>source.includes(job));
   if(found.length){jobs=found;break}
  }
  // Gabaritos de vários cargos jamais devem ser misturados, nem
  // resolvidos por ordem de aparição ou pela primeira seção.
  if(jobs.length!==1)
   return {text:'',section:null,format:'grid',error:'O gabarito contém vários cargos; não foi possível associar com segurança o cargo do caderno.'};
  const job=jobs[0];
  const sections=quadrixHeaders.map((m,i)=>({
   title:norm(m[2]),heading:m[2],
   text:source.slice(m.index,quadrixHeaders[i+1]?.index||source.length)
  }));
  const matches=sections.filter(s=>s.title.includes(job));
  if(matches.length!==1)return {text:'',section:null,format:'grid',error:'O cargo identificado no caderno não corresponde a uma seção única do gabarito.'};
  const code=matches[0].heading.match(/C[OÓ]DIGO\s*(\d{2,4})/i);
  return {text:matches[0].text,section:code?code[1]:job,format:'grid',error:null};
 }


 // FEPESE: o gabarito oficial reúne cargos identificados por S01, S02,
 // M1 etc., seguidos por duas linhas horizontais de números e letras.
 // Nunca usar respostas de outro cargo nem interpretar a tabela inteira
 // como pares "questão-resposta" genéricos.
 const fepeHeaders=[...source.matchAll(/(?:^|\n)\s*([SM]\d{1,2})\s+([^\n]{3,130})/gim)];
 if(fepeHeaders.length>=2&&/CARGOS\s+COM\s+EXIGENCIA\s+DE\s+CURSO/i.test(norm(source))){
  const sections=fepeHeaders.map((m,i)=>({
   code:m[1].toUpperCase(),title:norm(m[2]).trim(),
   text:source.slice(m.index,fepeHeaders[i+1]?.index||source.length)
  }));
  const exam=norm(examText);
  const codeHits=[...exam.matchAll(/(?:^|\n)\s*([SM]\d{1,2})\s+[^\n]{3,130}/g)]
   .map(m=>m[1]);
  const codes=[...new Set(codeHits)];
  if(codes.length>1)
   return {text:'',section:null,format:'grid',error:'A prova apresenta mais de um código de cargo; confira o arquivo selecionado.'};
  let match=null;
  if(codes.length===1)match=sections.find(s=>s.code===codes[0]);
  else{
   const hints=[
    norm(String(examInfo?.examFilename||'').replace(/[_-]+/g,' ')),
    norm(examInfo?.examTitle||''),
    exam.slice(0,2500)
   ];
   const candidates=sections.filter(s=>s.title.length>=5&&hints.some(h=>h.includes(s.title)));
   if(candidates.length===1)match=candidates[0];
  }
  if(!match)
   return {text:'',section:null,format:'grid',error:'Gabarito FEPESE com vários cargos: não foi possível identificar de forma única a seção do caderno.'};
  return {text:match.text,section:match.code,format:'grid',error:null};
 }

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
export function parseGridKey(section){
 const rows=String(section||'').replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
 const answers={};let pairs=0;
 for(let i=0;i<rows.length-1;i++){
  const nums=rows[i].split(/\s+/);
  if(nums.length<10||!nums.every(t=>/^\d{1,3}$/.test(t)))continue;
  const letters=rows[i+1].split(/\s+/);
  if(letters.length!==nums.length||!letters.every(t=>/^[A-E]$/i.test(t)))continue;
  for(let j=0;j<nums.length;j++){
   const n=Number(nums[j]);
   if(n<1||n>300||answers[n])return {};
   answers[n]=letters[j].toUpperCase();
  }
  pairs++;i++;
 }
 // Um documento de gabarito tabulado deve conter blocos alinhados,
 // não números soltos de tabelas de cargos ou pontuações.
 if(!pairs||Object.keys(answers).length<10)return {};
 const numbers=Object.keys(answers).map(Number).sort((a,b)=>a-b);
 if(numbers[0]!==1||numbers.some((n,i)=>n!==i+1))return {};
 return answers;
}

/** Total explicitamente anunciado na capa; não confundir com respostas extraídas. */
export function declaredQuestionCount(pages=[]){
 const first=pages[0];
 const cover=String(first?.text||(first?.lines||[]).map(line=>line.text).join('\n')||'');
 const counts=[...cover.matchAll(/\b(\d{1,3})\s+QUEST[OÕ]ES\b/giu)]
  .map(match=>Number(match[1])).filter(n=>n>=1&&n<=300);
 return counts.length===1?counts[0]:0;
}

export function questionIntegrity(questions,answers,expected=0){
 const numbers=questions.map(q=>q.originalNumber),unique=[...new Set(numbers)].sort((a,b)=>a-b),issues=[];
 if(!unique.length)issues.push('Nenhuma questão identificada');
 if(unique[0]!==1)issues.push('A numeração não começa em 1');
 if(unique.length!==numbers.length)issues.push('Numeração repetida');
 if(expected&&unique.length!==expected)issues.push('Foram identificadas '+unique.length+' questões, mas o PDF declara '+expected);
 if(unique.length){for(let n=1;n<=unique.at(-1);n++)if(!unique.includes(n))issues.push('Questão ausente: '+n);}
 for(const q of questions){
  if(q.options.length!==5)issues.push('Questão '+q.originalNumber+' contém '+q.options.length+' alternativas');
  // Questão recuperada por imagem permanece marcada para revisão, mas não
  // impede importar a prova se a imagem original foi recortada com sucesso.
  // Se o recorte falhar, a integridade CONTINUA bloqueando a importação.
  if(q.extractionReview&&!(q.extractionFallback&&q.pageImage))
   issues.push('Questão '+q.originalNumber+' tem alternativas não reconhecidas');
 }
 if(Object.keys(answers).length!==unique.length)issues.push('O gabarito possui '+Object.keys(answers).length+' respostas para '+unique.length+' questões');
 for(const n of unique)if(!answers[n])issues.push('Gabarito ausente para questão '+n);
 return issues;
}
