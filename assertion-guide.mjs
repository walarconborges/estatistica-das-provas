/**
 * Vista de estudo para itens V/F, C/E ou listas enumeradas.
 * Não altera o enunciado original, as alternativas ou o gabarito.
 */
const ROMAN_VALUES={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
function romanValue(s){
 const value=String(s||'').toUpperCase();
 if(!/^[IVXLCDM]{1,9}$/.test(value))return null;
 let total=0;
 for(let i=0;i<value.length;i++){
  const n=ROMAN_VALUES[value[i]],next=ROMAN_VALUES[value[i+1]]||0;
  total+=n<next?-n:n;
 }
 if(total<1||total>3999)return null;
 let n=total,canonical='';
 for(const [number,symbol] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],
  [90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]){
  while(n>=number){canonical+=symbol;n-=number;}
 }
 return canonical===value?total:null;
}
function tokenNumber(label,kind){
 if(kind==='number')return /^\d{1,3}$/.test(label)?Number(label):null;
 if(kind==='letter')return /^[a-z]$/i.test(label)?label.toUpperCase().charCodeAt(0)-64:null;
 return romanValue(label);
}
function splitOutro(value){
 const text=String(value||'').trim();
 const pattern=/[.!?]\s+(?=(?:Ap[oó]s (?:a )?an[aá]lise\b|Assinale (?:a|a alternativa)\b|A sequ[eê]ncia (?:correta|que)\b|Quais (?:est[aã]o|s[aã]o) corret[ao]s?\b|[EÉ] correto afirmar\b|Diante do exposto\b|Marque a alternativa\b|Escolha a alternativa\b|Agora,?\s+assinale\b|Indique a alternativa\b)[\s\S]{0,320}$)/gi;
 let match,last=-1;
 while((match=pattern.exec(text)))last=pattern.lastIndex;
 return last<0?{text,outro:''}:{text:text.slice(0,last).trim(),outro:text.slice(last).trim()};
}
function splitAtMarkers(text,markers,kind){
 if(markers.length<2||markers.length>50)return null;
 const items=[];
 for(let i=0;i<markers.length;i++){
  const content=text.slice(markers[i].end,markers[i+1]?.start??text.length).trim().replace(/^_+\s*/,'');
  if(content.length<4)return null;
  items.push({label:markers[i].label||String(i+1),text:content});
 }
 const last=splitOutro(items[items.length-1].text);
 if(last.outro)items[items.length-1].text=last.text;
 if(items.some(item=>item.text.length<4))return null;
 return {intro:text.slice(0,markers[0].start).trim(),items,outro:last.outro,kind};
}
/**
 * Reconhece somente duas ou mais assertivas consecutivas do mesmo tipo.
 * O fallback devolve null, preservando a exibição normal.
 */
export function splitAssertionItems(raw){
 const text=String(raw||'').trim();
 if(text.length<30)return null;
 // Exercícios de associação de colunas e tabelas não são listas de
 // assertivas para julgar. Mantém a diagramação original nesses casos.
 if(/\b(?:coluna\s+(?:I|II|[12])|relacione\s+(?:as|a|corretamente)|computador\s+1\s+computador\s+2)\b/i.test(text))return null;
 // ( ), (__), (___), inclusive (___)_ em alguns PDFs.
 const blanks=[...text.matchAll(/\(\s*(?:_{1,12}|\s+)\s*\)/g)]
  .map(m=>({start:m.index,end:m.index+m[0].length,label:''}));
 if(blanks.length>=2){
  const found=splitAtMarkers(text,blanks,'blanks');
  if(found)return found;
 }
 const candidates=[];
 const insert=(m,label,start,end)=>{
  // "Coluna I." e "Coluna II." são títulos, não assertivas.
  if(/\bcoluna\s*$/i.test(text.slice(Math.max(0,start-13),start)))return;
  candidates.push({start,end,label});
 };
 const token='([IVXLCDM]{2,9}|[A-Za-z]|\\d{1,3})';
 // Lookahead evita consumir o espaço que precede o item seguinte
 // ("Coluna I. A- ... B- ..." e "I. ... II. ...").
 const direct=new RegExp('(?=((^|[\\s:;])'+token+'\\s*(?:[.)]|[-–—])\\s+(?=\\S)))','gim');
 for(const m of text.matchAll(direct)){
  insert(m,m[3],m.index+m[2].length,m.index+m[1].length);
 }
 const wrapped=new RegExp('(?=((^|[\\s:;])\\(\\s*'+token+'\\s*\\)\\s*(?=\\S)))','gim');
 for(const m of text.matchAll(wrapped)){
  insert(m,m[3],m.index+m[2].length,m.index+m[1].length);
 }
 // Alguns PDFs unem rótulo e item: "I.No...", "II.A...", "III.A...".
 const joined=/(?=((^|[\s:;])([IVXLCDM]{1,9})[.)](?=[A-ZÁÉÍÓÚÇ])))/gm;
 for(const m of text.matchAll(joined)){
  insert(m,m[3],m.index+m[2].length,m.index+m[1].length);
 }
 candidates.sort((a,b)=>a.start-b.start);
 const runs=[];
 for(const kind of ['roman','letter','number']){
  const tokens=candidates.map(c=>({...c,value:tokenNumber(c.label,kind)})).filter(c=>c.value!==null);
  for(let i=0;i<tokens.length-1;i++){
   const sequence=[tokens[i]];
   for(let j=i+1;j<tokens.length;j++){
    if(tokens[j].value!==sequence[sequence.length-1].value+1)break;
    sequence.push(tokens[j]);
   }
   // Letras isoladas de fórmulas (ex.: Q. R. / x. y.) não são itens.
   if(kind==='letter'&&sequence.length<3)continue;
   // Uma sequência de questões 14..41 em PDF mal importado não é uma
   // enumeração de assertivas de uma única questão.
   if(kind==='number'&&(sequence[0].value>10||sequence.length>20))continue;
   if(sequence.length>=2)runs.push({kind,markers:sequence});
  }
 }
 runs.sort((a,b)=>b.markers.length-a.markers.length||a.markers[0].start-b.markers[0].start);
 for(const run of runs){
  const found=splitAtMarkers(text,run.markers,run.kind);
  if(found)return found;
 }
 return null;
}
