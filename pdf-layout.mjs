// Extração espacial: separa colunas e preserva a posição das questões na página.
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const noise=s=>/^(?:PCIMARKPCI\b|WWW\.PCICONCURSOS\.|CVOT\d+|CONFIDENCIAL ATE|R\s*A\s*S\s*C\s*U\s*N\s*H\s*O\s*$)/i.test(norm(s.trim()))||/MDAwM[A-Za-z0-9+/=]{35}/.test(s);
const questionRx=/^(?:QUEST[AÃ]O\s+0?(\d{1,3})(?:\s*[.):\-]\s*(.*))?|(\d{1,3})\s*[.):\-]\s*(.*))$/i;
const altRx=/^\s*(?:\(([A-E])\)|([A-E])\s*[.):\-])\s*(.*)$/i;

/**
 * Títulos de questão podem ter erros de extração em PDFs com fontes próprias:
 * "Questão 1 1." (11) e "Questão 4O." (40, letra O).
 * A normalização vale SOMENTE para marcadores explícitos "Questão",
 * não para números dos enunciados, alternativas ou valores matemáticos.
 */
export function normalizeQuestionHeading(line){
 return String(line||'').replace(/^(\s*QUEST[AÃ]O)\s+([0-9OIl|]{1,3}(?:\s+[0-9OIl|]{1,2})?)\s*([.):-])\s*/i,
  (whole,prefix,number,punct)=>{
   if(!/\d/.test(number))return whole;
   const digits=number.replace(/\s+/g,'').replace(/[Oo]/g,'0').replace(/[Il|]/g,'1');
   const n=Number(digits);
   return n>=1&&n<=300?prefix+' '+n+punct+' ':whole;
  });
}

// A FEPESE imprime marcas de quadrinhos, inclusive a opção assinalada.
// Estes glifos não são parte das alternativas e não podem revelar o gabarito.
const stripAnswerBox=s=>String(s||'').replace(/^\s*(?:(?:Check[\s-]*square|SQUARE)\b|[☑☒☐□■])\s*/i,'').trim();
const isHeading=s=>/^(?:L[IÍ]NGUA PORTUGUESA|MATEM[AÁ]TICA(?:\s+E\s+RACIOC[IÍ]NIO\s+L[OÓ]GICO)?|RACIOC[IÍ]NIO L[OÓ]GICO(?:\s+E\s+MATEM[AÁ]TICA)?|LEGISLA[CÇ][AÃ]O|CONHECIMENTOS ESPEC[IÍ]FICOS|INFORM[AÁ]TICA|DIREITO ADMINISTRATIVO|DIREITO CONSTITUCIONAL|CONHECIMENTOS GERAIS)(?:\s+\d{1,3}\s+QUEST[OÕ]ES)?$/i.test(s.trim());
// Números de cadernos/cargos (ex.: "002. PROVA OBJETIVA") não são questões.
const isExamBookletHeader=(s,pageNumber=0)=>/^\s*0{0,2}\d{1,3}\s*[.)]\s*(?:PROVA\s+OBJETIVA|CADERNO\s+DE\s+(?:PROVA|QUEST[OÕ]ES)|CARGO\b)/i.test(String(s||''))||
 (pageNumber===1&&/^\s*0{1,2}\d{1,3}\s*[.)]\s*PROVA\b/i.test(String(s||'')));


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
 const m=line.match(/(?:LEIA|CONSIDERE)\s+(?:O\s+)?TEXTO\s+PARA\s+RESPONDER\s+[ÀA]S?\s+QUEST[OÕ]ES?\s+(?:DE\s*)?0?(\d{1,3})\s*A\s*0?(\d{1,3})\s*:/i)||line.match(/^TEXTO\s+PARA\s+(?:AS\s+)?QUEST[OÕ]ES?\s+(?:DE\s*)?0?(\d{1,3})\s*A\s*0?(\d{1,3})\s*\.?$/i)||line.match(/^PARA\s+RESPONDER\s+[ÀA]S?\s+QUEST[OÕ]ES?\s+0?(\d{1,3})\s*A\s*0?(\d{1,3})\s*,?\s*LEIA\s+O\s+TEXTO\s+ABAIXO\s*[,.:]?$/i);
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
function preserveOriginalInImage(q,expectedAlternatives=5){
 q.extractionFallback=true;
 q.extractionReview=true;
 q.imageOnly=true;
 q.visualSegments=null;
 q.options='ABCDE'.slice(0,expectedAlternatives).split('').map(letter=>({letter,text:''}));
 q.confidence='baixa';
 q.stem=q.stem||'Questão reproduzida diretamente do PDF original.';
 return q;
}
function hasCompleteOptions(options,expectedAlternatives=5){
 return Array.isArray(options)&&options.length===expectedAlternatives&&
  options.every((o,i)=>o.letter===String.fromCharCode(65+i)&&String(o.text||'').trim());
}
/**
 * Resgata títulos explícitos "QUESTÃO N" que não sobreviveram ao
 * agrupamento de linhas e alternativas. O recorte com o enunciado
 * original evita qualquer reconstituição de conteúdo não confiável.
 */
function recoverExplicitQuestionHeadings(pages,questions,expectedAlternatives=5){
 const existing=new Set(questions.map(q=>q.originalNumber));
 const recovered=[];
 for(const page of pages){
  for(const col of [0,1]){
   const lines=(page.lines||[]).filter(r=>r.col===col).sort((a,b)=>a.y-b.y);
   const headings=lines.map((r,i)=>{
    const m=normalizeQuestionHeading(r.text).trim().match(/^QUEST[AÃ]O\s+0?(\d{1,3})\s*[.):\-]?\s*$/i);
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
    },expectedAlternatives);
    recovered.push(item);existing.add(h.n);
   }
  }
 }
 return recovered;
}

/**
 * A folha de instruções contém itens numerados (01. a 08.), que não
 * são questões. Só ignorar uma folha com sinais claros de capa e
 * instruções; páginas iniciais com questões efetivas continuam válidas.
 */
export function isInstructionSheet(page){
 if(page?.number!==1)return false;
 const text=(page.lines||[]).map(row=>row.text).join('\n')||String(page.text||'');
 const n=norm(text);
 return /\bINSTRUCOES\b/.test(n)&&
  /\bCANDIDAT[OA]\b/.test(n)&&
  /\b(?:FOLHA RESPOSTA|CADERNO DE QUESTOES|LISTA DE PRESENCA)\b/.test(n)&&
  /\b(?:DEIXE SOBRE A CARTEIRA|ANTES DE INICIAR|AO TERMINAR A PROVA)\b/.test(n);
}

export function spatialQuestions(pages){
 const questions=[],contexts=[];let heading='';
 const expectedAlternatives=inferredAlternativeCount(pages);
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
  if(!page.lines?.length||isInstructionSheet(page))continue;
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
    current.extractionReview=!hasCompleteOptions(current.options,expectedAlternatives);
    // Para FEPESE, não reproduzir o enunciado completo como imagem: apenas
    // imagens genuínas com região gráfica separável por coordenadas.
    current.imageOnly=needsImage(current.stem)&&(!useIndentationProtection||Boolean(current.visualSegments));
    if(!current.imageOnly)delete current.visualSegments;
    // Jamais descarta silenciosamente uma QUESTÃO N porque alguma alternativa
    // foi separada pelo leitor do PDF. Usa o recorte fiel e 5 controles A–E.
    if(current.extractionReview||!current.stem)
      preserveOriginalInImage(current,expectedAlternatives);
    current.expectedAlternatives=expectedAlternatives;
    questions.push(current);
    current=null;
   }
   for(const row of lines){
    const s=normalizeQuestionHeading(row.text).trim();if(!s||noise(s))continue;
    if(creditLine.test(s)){if(current)current.creditY=row.y;continue;}
    const foundContext=contextMarker(s);
    if(foundContext){finish(row.y-2);storeContext();collecting={...foundContext,text:[],page:page.number,col,startY:row.y};continue;}
    if(isHeading(s)){if(!current||!current.options.length)heading=s;continue;}
    if(/^ANOTA[ÇC][ÕO]ES$/i.test(s)){finish(row.y-8);continue;}
    if(isExamBookletHeader(s,page.number))continue;
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
 questions.push(...recoverExplicitQuestionHeadings(pages,questions,expectedAlternatives));

 // Algumas provas colocam o texto-base antes da questão 1, sem escrever
 // "leia o texto para responder às questões...". Preservar o preâmbulo
 // extenso de Português e vinculá-lo às questões que fazem referência
 // ao texto, inclusive quando elas aparecem na coluna ao lado.
 const first=questions.find(q=>q.originalNumber===1);
 // TEXTO isolado no caderno seguido da indicação editorial
 // "Questões de 01 a 10": o texto vale para TODO o bloco, mesmo que
 // algumas questões não mencionem "texto" explicitamente.
 if(first&&!first.contextText){
  const page=pages.find(p=>p.number===first.sourcePage);
  const lines=(page?.lines||[]);
  const marker=lines.find(row=>row.col===first.sourceColumn&&
   /^TEXTO\s*$/i.test(String(row.text||'').trim())&&row.y<first.startY);
  const rangeText=lines.map(row=>String(row.text||'')).join(' ');
  const limit=rangeText.match(/QUEST[OÕ]ES\s+DE\s+0?1\s+A\s+0?(\d{1,2})\b/i);
  const to=Number(limit?.[1]||0);
  if(marker&&to>=2&&to<=25){
   const rows=lines.filter(row=>row.col===marker.col&&
    row.y>marker.y&&row.y<first.startY-9).sort((a,b)=>a.y-b.y);
   const shared=humanizePdfText(rows.map(row=>row.text).join('\n'));
   if(shared.length>=150){
    for(const q of questions){
     if(q.originalNumber>=1&&q.originalNumber<=to&&!q.contextText){
      q.contextText=shared;q.contextRange=[1,to];
     }
    }
    contexts.push({from:1,to,text:shared,page:page.number,col:marker.col});
   }
  }
 }
 if(first&&!first.contextText){
  const page=pages.find(p=>p.number===first.sourcePage);
  const above=(page?.lines||[])
   .filter(row=>row.col===first.sourceColumn&&row.y<first.startY-10)
   .sort((a,b)=>a.y-b.y);
  const headingIndex=above.findIndex(row=>/L[IÍ]NGUA PORTUGUESA(?:\s*\|\s*\d+\s*QUEST[OÕ]ES)?/i.test(row.text));
  const sourceRows=headingIndex>=0?above.slice(headingIndex+1):[];
  const opening=humanizePdfText(sourceRows.filter(row=>!/^(?:WWW\.|FONTE:|P[AÁ]GINA\s+\d+)/i.test(row.text.trim()))
    .map(row=>row.text).join('\n'));
  if(opening.length>=180&&sourceRows.length>=5){
   const sorted=questions.filter(q=>q.originalNumber>=1&&q.originalNumber<=15)
    .sort((a,b)=>a.originalNumber-b.originalNumber);
   let last=0;
   for(const q of sorted){
    const refer=/\b(?:TEXTO|INFORMA[CÇ][ÕO]ES|PAR[AÁ]GRAFO|TRECHO|SUBLINHAD[OA]S?|LEITURA)\b/i.test(q.stem);
    if(q.originalNumber!==last+1||(!refer&&q.originalNumber!==1))break;
    if(!q.contextText){q.contextText=opening;q.contextRange=[1,q.originalNumber];}
    last=q.originalNumber;
   }
   if(last>0){
    for(const q of sorted.slice(0,last))if(q.contextText===opening)q.contextRange=[1,last];
    contexts.push({from:1,to:last,text:opening,page:page.number,col:first.sourceColumn});
   }
  }
 }

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
/**
 * Identifica o código numérico real do CADERNO, sem usar a numeração
 * das questões: o título na capa pode ficar dividido em duas colunas
 * pelo leitor espacial ("002. Prova" na esquerda, "Objetiva" na direita).
 * A assinatura editorial da banca (ex.: VNSP2511/002-AnInfor) é uma
 * segunda fonte independente, não um palpite pelo nome do cargo.
 */
export function identifyBookletCode(examText='',examInfo={}){
 const source=String(examText||'');
 const cover=source.split(/\[\[PAGE:\s*2\]\]/i)[0].slice(0,7000);
 const coverNumbers=[...cover.matchAll(/(?:^|\n)\s*0{0,2}(\d{1,3})\s*[.)]\s*PROVA\b(?:\s+OBJETIVA\b)?/gim)]
   .map(m=>Number(m[1]));
 const footerNumbers=[...source.matchAll(/\bVNSP\d{3,}\/0{0,2}(\d{1,3})(?=[\s-]|$)/gim)]
   .map(m=>Number(m[1]));
 const codes=[...new Set([...coverNumbers,...footerNumbers])];
 const manually=String(examInfo?.bookletCode||'').trim();
 if(manually&&!/^\d{1,3}$/.test(manually))
  return {code:null,error:'Código do caderno inválido. Informe somente os dígitos impressos no gabarito.'};
 if(codes.length>1)
  return {code:null,error:'A capa e o rodapé indicam códigos de prova diferentes. Confirme o caderno correto.'};
 if(manually&&codes.length===1&&Number(manually)!==codes[0])
  return {code:null,error:'O código informado manualmente diverge da identificação impressa no caderno.'};
 return {code:codes[0]??(manually?Number(manually):null),error:null};
}

/**
 * Compara o cargo do gabarito com evidências INDEPENDENTES do caderno.
 * A capa pode vir com espaços artificiais, e o título inferido pode
 * usar um nome genérico. Não associa só porque existe uma única tabela.
 */
/**
 * Reconhecimento conservador de cargos no caderno e gabarito.
 * Alguns PDFs com fontes embutidas devolvem "SERVIAOS" no lugar de
 * "SERVIÇOS". É permitida UMA diferença de caractere em TODO o nome,
 * somente quando há outros termos distintivos exatos e em sequência.
 * Nunca usar o total de respostas, apenas a identidade do cargo.
 */
export function jobTitleMatches(role,hint){
 const words=value=>norm(value).replace(/[^A-Z0-9]+/g,' ').trim().split(/\s+/)
  .filter(word=>word&&!['DE','DA','DO','DAS','DOS','E','EM','PARA'].includes(word));
 const required=words(role),source=words(hint);
 if(!required.length||!source.length)return false;
 const roleExact=required.join(''),sourceExact=source.join('');
 if(sourceExact.includes(roleExact))return true;
 if(required.length<2)return false;
 // Distância de edição limitada a 1 por palavra, com pelo menos duas
 // palavras substantivas preservadas em um título de três ou mais termos.
 const near=(a,b)=>{
  if(a===b)return 0;
  if(Math.abs(a.length-b.length)>1||Math.min(a.length,b.length)<5)return 2;
  let i=0,j=0,edits=0;
  while(i<a.length&&j<b.length){
   if(a[i]===b[j]){i++;j++;continue;}
   if(++edits>1)return 2;
   if(a.length>b.length)i++;
   else if(b.length>a.length)j++;
   else{i++;j++;}
  }
  edits+=(a.length-i)+(b.length-j);
  return edits;
 };
 for(let start=0;start<=source.length-required.length;start++){
  let differences=0,exact=0,ok=true;
  for(let k=0;k<required.length;k++){
   const diff=near(required[k],source[start+k]);
   if(diff>1){ok=false;break;}
   if(diff===0)exact++;
   else differences+=diff;
   if(differences>1){ok=false;break;}
  }
  if(ok&&differences===1&&exact>=Math.max(1,required.length-1))return true;
 }
 return false;
}
export function verifiedExamJob(role,examText='',examInfo={}){
 const first=String(examText||'').split(/\[\[PAGE:\s*2\]\]/i)[0];
 const sources=[
  String(examInfo?.examFilename||'').replace(/\.pdf$/i,'').replace(/\s*\(\d+\)\s*$/,'').replace(/[_-]/g,' '),
  String(examInfo?.examTitle||'').split(/\s+[—–]\s+/).at(-1)||'',
  first
 ];
 return sources.some(hint=>jobTitleMatches(role,hint));
}


/**
 * Detecta tabelas de gabarito por estrutura, e não por banca:
 * "F1 Auxiliar de Serviços Gerais" (ou M1, S1...)
 * "1 2 3 ... 35"
 * "c e b ... b"
 *
 * Páginas podem conter vários cargos. Exige que a linha de números e
 * a linha de letras sejam alinhadas e constituam sequência de 1 a N.
 * Um mesmo PDF pode ter cadernos com quantidades diferentes.
 */
export function codedAnswerTables(raw){
 const source=String(raw||'').replace(/\r/g,'');
 const lines=source.split('\n').map(x=>x.trim());
 const entries=[];
 const header=/^([A-Z]{1,3}\d{1,3})\s+([^\n]{4,135})$/i;
 const isPair=(numbers,answers)=>{
  const a=String(numbers||'').trim().split(/\s+/);
  const b=String(answers||'').trim().split(/\s+/);
  return a.length>=10&&a.length<=100&&a.length===b.length&&
   a.every((x,i)=>/^\d{1,3}$/.test(x)&&Number(x)===i+1)&&
   b.every(x=>/^[A-E]$/i.test(x));
 };
 for(let i=0;i<lines.length;i++){
  const match=lines[i].match(header);
  if(!match)continue;
  // Exigir alinhamento numérico e alfabético imediatamente abaixo;
  // até 2 linhas em branco/ruído entre o título e a tabela.
  let pairAt=-1;
  for(let j=i+1;j<=Math.min(i+3,lines.length-2);j++){
   if(isPair(lines[j],lines[j+1])){pairAt=j;break;}
  }
  if(pairAt<0)continue;
  const numbers=lines[pairAt].split(/\s+/).map(Number);
  const letters=lines[pairAt+1].split(/\s+/).map(x=>x.toUpperCase());
  const text=lines[i]+'\n'+lines[pairAt]+'\n'+lines[pairAt+1];
  const answers=Object.fromEntries(numbers.map((n,k)=>[n,letters[k]]));
  entries.push({
   code:match[1].toUpperCase(),title:norm(match[2]).trim(),
   text,answers,count:numbers.length
  });
 }
 return entries;
}

export function chosenAnswerSection(text,examText='',examInfo={}){
 const source=String(text||'').replace(/\r/g,'');


 // Gabarito estruturado com um código de caderno e duas linhas
 // (questões / respostas) por cargo. Reconhece F1, M1, S1, etc. sem
 // depender do nome da banca ou da quantidade fixa de alternativas.
 const codedTables=codedAnswerTables(source);
 if(codedTables.length){
  const cover=String(examText||'').split(/\[\[PAGE:\s*2\]\]/i)[0];
  const codes=[...cover.matchAll(/(?:^|\n)\s*([A-Z]{1,3}\d{1,3})\s+([^\n]{4,135})/gim)]
    .map(x=>({code:x[1].toUpperCase(),title:x[2].trim()}));
  const coverCodes=codes.filter(c=>codedTables.some(t=>t.code===c.code));
  if(codes.length&&coverCodes.length===0)return {text:'',section:null,format:'grid',
   error:'O código de cargo declarado no caderno não consta no gabarito enviado.'};
  const coverMatches=codedTables.filter(t=>coverCodes.some(c=>
    c.code===t.code&&jobTitleMatches(t.title,c.title)));
  let found=null;
  if(coverCodes.length){
   if(coverMatches.length!==1)return {text:'',section:null,format:'grid',
    error:coverMatches.length>1
     ?'O caderno identifica mais de uma tabela correspondente ao gabarito.'
     :'O código do caderno foi localizado no gabarito, mas o nome do cargo é diferente.'};
   found=coverMatches[0];
  }
  if(!found){
   const hints=[
    String(examInfo?.examFilename||'').replace(/[_-]+/g,' ')
      .replace(/\.pdf$/i,'').replace(/\s*\(\d+\)\s*$/,''),
    String(examInfo?.examTitle||'').split(/\s+[—–]\s+/).at(-1)||'',
    cover.slice(0,2400)
   ];
   const possible=codedTables.filter(t=>hints.some(hint=>jobTitleMatches(t.title,hint)));
   if(possible.length===1)found=possible[0];
   else if(possible.length>1)return {text:'',section:null,format:'grid',
     error:'Vários cargos têm nomes compatíveis no gabarito. Não é possível escolher com segurança.'};
  }
  if(!found)return {text:'',section:null,format:'grid',
    error:'O gabarito contém tabelas de vários cargos, mas nenhuma corresponde ao código e nome do caderno.'};
  if(codes.length&&codes.some(c=>c.code===found.code&&!jobTitleMatches(found.title,c.title)))
   return {text:'',section:null,format:'grid',
    error:'O código do caderno corresponde a um cargo diferente no gabarito.'};
  if(Object.keys(found.answers).length!==found.count||found.count<10)
   return {text:'',section:null,format:'grid',
    error:'A tabela do cargo identificado não possui uma resposta para cada questão.'};
  return {text:found.text,section:found.code,format:'grid',error:null};
 }

 // Gabaritos por cargo em páginas individuais: a FCPC (Aracati/CE)
 // imprime as 50 respostas em linhas tabuladas e usa a mesma sequência
 // inicial em cargos diferentes. Nunca escolher apenas pela quantidade.
 const pageSections=source.match(/\[\[PAGE:\s*\d+\]\][\s\S]*?(?=\[\[PAGE:\s*\d+\]\]|$)/g)||[];
 const pageGrids=pageSections.map((page)=>{
  const preamble=page.match(/GABARITO\s+(?:PRELIMINAR|DEFINITIVO)([\s\S]*?)(?=PROVA\s*1\s*[-–])/i)?.[1]||'';
  const roleLines=preamble.split('\n').map(x=>x.trim()).filter(Boolean);
  // "Auxiliar de Serviços Gerais" pode se fragmentar em várias linhas
  // por fonte/colunas, mas está sempre entre o título e "Prova 1".
  const role=roleLines.join(' ').replace(/\s+/g,' ').trim();
  const pageNumber=Number(page.match(/^\[\[PAGE:\s*(\d+)\]\]/)?.[1]||0);
  return role&&pageNumber>0&&/PROVA\s*2\s*[-–]/i.test(page)&&/PROVA\s*3\s*[-–]/i.test(page)
   ?{pageNumber,role:norm(role).trim(),text:page}:null;
 }).filter(Boolean);
 if(pageGrids.length>=1){
  // Opção explícita disponível só após identificar as páginas e cargos
  // diretamente no gabarito. Número não presente é sempre rejeitado.
  const selectedPage=String(examInfo?.answerPage||'').trim();
  if(selectedPage){
   if(!/^\d{1,3}$/.test(selectedPage))
    return {text:'',section:null,format:'grid',error:'Número da página do gabarito inválido.'};
   const entry=pageGrids.find(item=>item.pageNumber===Number(selectedPage));
   if(!entry)return {text:'',section:null,format:'grid',
    error:'A página selecionada não contém um gabarito de cargo reconhecido.'};
   return {text:entry.text,section:entry.role,format:'grid',
    manualSelection:true,pageNumber:entry.pageNumber,error:null};
  }
  const evidence=[
   String(examInfo?.examFilename||'').replace(/[_-]+/g,' ')
    .replace(/\.pdf$/i,'').replace(/\s*\(\d+\)\s*$/,''),
   String(examInfo?.examTitle||'').split(/\s+[—–]\s+/).at(-1)||'',
   String(examText||'').split(/\[\[PAGE:\s*2\]\]/i)[0].slice(0,2800)
  ];
  let selected=null;
  for(const hint of evidence){
   if(!hint)continue;
   const found=pageGrids.filter(section=>jobTitleMatches(section.role,hint));
   if(found.length>1)return {text:'',section:null,format:'grid',
    availableSections:pageGrids.map(item=>({pageNumber:item.pageNumber,role:item.role})),
    error:'O gabarito tabulado corresponde a mais de um cargo. Selecione o cargo correto na lista de conferência.'};
   if(found.length===1){selected=found[0];break;}
  }
  if(!selected&&pageGrids.length===1&&verifiedExamJob(pageGrids[0].role,examText,examInfo))
   selected=pageGrids[0];
  if(!selected){
   const found=pageGrids.map(x=>x.role).join('; ').slice(0,270);
   const single=pageGrids.length===1;
   return {text:'',section:null,format:'grid',
    availableSections:pageGrids.map(item=>({pageNumber:item.pageNumber,role:item.role})),
    error:single
     ?'O único cargo do gabarito ('+found+') não corresponde de modo verificável ao cargo da prova.'
     :'O gabarito possui páginas para vários cargos, sem correspondência única com o caderno. Selecione o cargo na lista de conferência. Cargos lidos: '+found};
  }
  return {text:selected.text,section:selected.role,format:'grid',error:null};
 }


 // Bancas que publicam uma tabela por cargo, por exemplo:
 // "Analista em Informática - Tabela 3" + 50 pares "01: A ... 50: D".
 // Escolher estritamente pelo nome do cargo, nunca pelo número da tabela
 // (Tabela 3 é compartilhada por cargos distintos neste gabarito).
 const tableHeads=[...source.matchAll(/(?:^|\n)\s*([^\n]{6,95}?)\s*[-–]\s*TABELA\s*(\d{1,2})\s*(?=\n|$)/gim)];
 if(tableHeads.length>=2){
  const all=tableHeads.map((m,i)=>({
   job:norm(m[1]).replace(/\s+/g,' ').trim(),
   table:m[2],text:source.slice(m.index,tableHeads[i+1]?.index||source.length)
  }));
  const evidence=[
   norm(String(examInfo?.examFilename||'').replace(/[_-]+/g,' ')),
   norm(String(examInfo?.examTitle||'')),
   norm(String(examText||'').split(/\[\[PAGE:\s*2\]\]/i)[0].slice(0,2000))
     .replace(/\bIN\s+FORMATICA\b/g,'INFORMATICA')
  ];
  let match=null;
  for(const hint of evidence){
   if(!hint)continue;
   const candidates=all.filter(x=>hint.includes(x.job));
   if(candidates.length===1){match=candidates[0];break;}
   if(candidates.length>1)
    return {text:'',section:null,format:'pairs',
     error:'O gabarito contém mais de um cargo correspondente à identificação da prova.'};
  }
  if(!match)return {text:'',section:null,format:'pairs',
   error:'O gabarito possui tabelas de vários cargos, mas não foi possível identificar uma única seção correspondente à prova.'};
  return {text:match.text,section:match.job+' - Tabela '+match.table,format:'pairs',error:null};
 }


 // Objetiva: páginas com vários cargos, cada cargo é seguido por linhas
 // "01) D 11) C 21) A 31) B". Não usar o primeiro gabarito por engano.
 // Os títulos são reconhecidos somente quando imediatamente seguidos
 // pelo par "01) letra", evitando capturar cabeçalhos de páginas.
 const objectiveHeads=[...source.matchAll(/(?:^|\n)[ \t]*([A-ZÀ-Ü][A-ZÀ-Ü |()\-º]{2,115})[ \t]*\n[ \t]*0?1\)[ \t]*[A-E]\b/gm)];
 if(objectiveHeads.length>=2){
  const sections=objectiveHeads.map((m,i)=>({
   job:norm(m[1]).replace(/\s+/g,' ').trim(),
   text:source.slice(m.index,objectiveHeads[i+1]?.index||source.length)
  }));
  // Primeiro identificamos o cargo no caderno. Nunca usar as respostas
  // de outro cargo mesmo que a prova tenha a mesma quantidade de questões.
  const evidence=[
   norm(String(examInfo?.examFilename||'').replace(/[_-]+/g,' ')),
   norm(examText.split(/\[\[PAGE:\s*2\]\]/i)[0].slice(0,2500)),
   norm(examInfo?.examTitle||'')
  ];
  let selected=null;
  for(const item of evidence){
   if(!item)continue;
   const found=sections.filter(x=>item.includes(x.job));
   if(found.length>1)return {text:'',section:null,format:'pairs',
    error:'O gabarito da Objetiva contém mais de uma seção correspondente ao cargo. Confira a identificação.'};
   if(found.length===1){selected=found[0];break;}
  }
  if(!selected)return {text:'',section:null,format:'pairs',
   error:'Gabarito da Objetiva com vários cargos: não foi possível localizar uma seção única da prova.'};
  return {text:selected.text,section:selected.job,format:'pairs',error:null};
 }

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
 const exam=norm(examText),cargo=exam.includes('ANALISTA DE INFORMATICA')?'ANALISTA DE INFORMATICA':null;
 const booklet=identifyBookletCode(examText,examInfo);
 if(booklet.error)return {text:'',section:null,error:booklet.error};
 const selectedCode=booklet.code;
 const sections=marks.map((m,i)=>({code:Number(m[1]),text:source.slice(m.index,marks[i+1]?.index||source.length)}));
 if(selectedCode!==null&&!sections.some(x=>x.code===selectedCode))
  return {text:'',section:null,error:'O código da prova não consta no gabarito enviado. Confira se os arquivos correspondem ao mesmo cargo.'};
 let found=selectedCode!==null?sections.find(x=>x.code===selectedCode):null;
 if(!found&&cargo){
  const matches=sections.filter(x=>norm(x.text.slice(0,190)).includes(cargo));
  if(matches.length>1){
   // Mesmo nome de cargo, áreas diferentes: só aceitar a área integral
   // declarada na capa ou no nome do arquivo. Não procurar nas questões,
   // que podem mencionar incidentalmente outra área de atuação.
   const cover=String(examText||'').split(/\[\[PAGE:\s*2\]\]/i)[0].slice(0,3500);
   const evidence=norm([
    String(examInfo?.examFilename||'').replace(/[_-]+/g,' '),
    examInfo?.examTitle||'',cover
   ].join(' ')).replace(/\s+/g,' ');
   const matchingArea=matches.filter(section=>{
    const area=norm(section.text.slice(0,340))
      .match(/AREA DE ATUACAO\s*:\s*([^\n\r]+)/)?.[1]
      ?.replace(/\s+/g,' ').trim();
    return Boolean(area&&area.length>=12&&evidence.includes(area));
   });
   if(matchingArea.length!==1)
    return {text:'',section:null,error:'Várias seções do gabarito possuem o mesmo cargo e a área de atuação não pôde ser identificada de forma única. Informe o código do caderno.'};
   found=matchingArea[0];
  }else found=matches[0]||null;
 }
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


/**
 * Se a capa não informa quatro/cinco opções, analisar a estrutura real
 * do caderno. Exigir várias ocorrências A–D para não decidir a partir
 * de uma única letra citada em um enunciado.
 */
export function inferredAlternativeCount(pages=[]){
 const official=declaredAlternativeCount(pages);
 if(official)return official;
 const counts={A:0,B:0,C:0,D:0,E:0};
 for(const page of pages)for(const row of page.lines||[]){
  const m=String(row.text||'').trim().match(/^(?:\(([A-E])\)|([A-E])[.):\-])\s+\S/i);
  if(m)counts[(m[1]||m[2]).toUpperCase()]++;
 }
 const common=['A','B','C','D'].every(k=>counts[k]>=6);
 if(common&&counts.E>=6)return 5;
 if(common&&counts.E<=Math.max(1,Math.floor(counts.D*0.04)))return 4;
 return 5;
}

/** Retorna a quantidade declarada na capa (quatro ou cinco), quando inequívoca. */
export function declaredAlternativeCount(pages=[]){
 const first=pages[0];
 const cover=String(first?.text||(first?.lines||[]).map(line=>line.text).join('\n')||'');
 const counts=[...cover.matchAll(/\b([45])\s+ALTERNATIVAS?\b/giu)].map(m=>Number(m[1]));
 return new Set(counts).size===1?counts[0]:0;
}

/** Total explicitamente anunciado na capa; não confundir com respostas extraídas. */
export function declaredQuestionCount(pages=[]){
 const first=pages[0];
 const cover=String(first?.text||(first?.lines||[]).map(line=>line.text).join('\n')||'');
 const counts=[...cover.matchAll(/\b(\d{1,3})(?:\s*\([^)]{1,35}\))?\s+QUEST[OÕ]ES\b/giu)]
  .map(match=>Number(match[1])).filter(n=>n>=1&&n<=300);
 return counts.length===1?counts[0]:0;
}

export function questionIntegrity(questions,answers,expected=0,optionsExpected=5){
 const numbers=questions.map(q=>q.originalNumber),unique=[...new Set(numbers)].sort((a,b)=>a-b),issues=[];
 if(!unique.length)issues.push('Nenhuma questão identificada');
 if(unique[0]!==1)issues.push('A numeração não começa em 1');
 if(unique.length!==numbers.length)issues.push('Numeração repetida');
 if(expected&&unique.length!==expected)issues.push('Foram identificadas '+unique.length+' questões, mas o PDF declara '+expected);
 if(unique.length){for(let n=1;n<=unique.at(-1);n++)if(!unique.includes(n))issues.push('Questão ausente: '+n);}
 for(const q of questions){
  if(q.options.length!==optionsExpected)issues.push('Questão '+q.originalNumber+' contém '+q.options.length+' alternativas (o caderno declara '+optionsExpected+')');
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
