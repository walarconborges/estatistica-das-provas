/**
 * Consulta controlada a documentos legais locais.
 * Textos em data/laws/*.json são transcrições do PDF do usuário, não
 * confirmação automática de vigência. A IA recebe trechos exatos e página.
 */
export const LEGAL_KB_REVISION=1;
const LAW_IDS=Object.freeze({
 organica:'lei-organica',
 regimento:'regimento-1993',
 res173:'resolucao-173-2025',
 orcamento:'lei-1459-2023'
});
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const lawTag=q=>String(q?.municipalLawTag||'').toLowerCase();
export function lawIdForQuestion(q,exam=null){
 if(!q)return null;
 const explicit=LAW_IDS[lawTag(q)];
 if(q.sourceType==='simulado-autoral-candeias-legislacao'&&explicit)return explicit;
 const text=norm([q.orgao,exam?.orgao,exam?.title,q.stem,q.topic,q.discipline].join(' '));
 const identified=/candeias do jamari|\bcmcj\b|camara municipal de candeias/.test(text);
 if(!identified)return null; // jamais usar lei de outro município
 if(explicit)return explicit;
 if(/(?:lei\s*(?:municipal\s*)?(?:n[ºo°.]\s*)?1[.]?459\s*\/\s*2023)/.test(text))return LAW_IDS.orcamento;
 if(/resolucao\s*(?:n[ºo°.]\s*)?173\s*\/\s*(?:cmcj\/)?2025/.test(text))return LAW_IDS.res173;
 if(/regimento interno|resolucao\s*(?:n[ºo°.]\s*)?0*1\s*\/\s*cmcj/.test(text))return LAW_IDS.regimento;
 if(/lei organica|emenda\s+a\s+lei organica/.test(text))return LAW_IDS.organica;
 return null;
}
const commonWords=new Set('a o as os de do da dos das e em ao aos por para como que se no na nos nas um uma esta esse sao sera quando qual quais correta correto lei organica municipio candeias jamari camara municipal resolucao legislacao assinale alternativa alternativas item itens votacao proposta artigo art disposicoes conforme segundo'.split(' '));
function tokens(s){
 return [...new Set(norm(s).replace(/[^\p{L}\p{N}]+/gu,' ').split(/\s+/).filter(v=>v.length>=4&&!commonWords.has(v)))];
}
function rankPage(page,needles){
 const body=norm(page?.text||'');
 if(!body.trim())return 0;
 let score=0;
 for(const term of needles){
  if(body.includes(term))score+=Math.min(3,(body.split(term).length-1));
 }
 // Preferir dispositivos a sumários/títulos.
 if(/\bart\.?\s*\d+/.test(body))score+=1;
 return score;
}
export function selectLegalEvidence(q,doc,{maxPages=3,maxChars=9800}={}){
 if(!doc||!Array.isArray(doc.pages)||doc.readable!==true)return null;
 const query=[q.stem,...(q.options||[]).map(o=>o.text),q.topic].join(' ');
 const terms=tokens(query);
 const ranked=doc.pages.map((page,index)=>({...page,index,score:rankPage(page,terms)}))
   .sort((a,b)=>b.score-a.score||a.index-b.index);
 // Não apresentar uma página aleatória como fundamentação.
 if(!ranked.length||ranked[0].score<=1)return null;
 const best=ranked.slice(0,maxPages).sort((a,b)=>a.page-b.page);
 const passages=[];let size=0;
 for(const page of best){
  if(size>=maxChars)break;
  const available=maxChars-size;
  let body=String(page.text||'').trim();
  if(body.length>available)body=body.slice(0,available).replace(/\s+\S*$/,'')+' [trecho truncado]';
  size+=body.length;
  const refs=[...body.matchAll(/\bArt\.?\s*(\d+)\s*[º°o]?/gi)].map(x=>x[1]);
  passages.push({page:page.page,score:page.score,articleNumbers:[...new Set(refs)].slice(0,16),text:body});
 }
 return {lawId:doc.id,law:doc.title,url:doc.sourceUrl,
  revision:doc.revision||'',documentStatus:doc.documentStatus||'',
  legalValidity:doc.legalValidity||'',passages};
}
export function legalContextForPrompt(evidence){
 if(!evidence)return '';
 const lines=evidence.passages.map(p=>'[Página '+p.page+' — '+evidence.law+']\n'+p.text);
 return 'DOCUMENTO NORMATIVO FORNECIDO: '+evidence.law+
  '\nFonte para conferência: '+evidence.url+
  '\nALERTA SOBRE VIGÊNCIA: '+(evidence.legalValidity||'Conferir alterações posteriores.')+
  '\nTRECHOS DOCUMENTAIS LOCALIZADOS:\n'+lines.join('\n\n')+
  '\nUse apenas o texto acima como fundamento local; cite artigo e página quando constarem expressamente. Se o trecho não sustentar a resposta, reconheça a insuficiência e não invente artigo.';
}
