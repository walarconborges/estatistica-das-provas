/**
 * Perfil jurisdicional do estudo. Nunca altera uma questão original.
 * Versões adaptadas só podem ser publicadas após revisão dos dispositivos
 * oficiais e do gabarito. Legislação de outro município fica em espera.
 */
export const STUDY_CONTEXT=Object.freeze({
 id:'candeias-do-jamari-ro',
 label:'Candeias do Jamari — RO',
 municipality:'Candeias do Jamari',
 state:'RO',
 edital:'Câmara Municipal de Candeias do Jamari — Edital 01/2026',
 sources:[
  {title:'Portal de legislação da Câmara',url:'https://legislacao.candeiasdojamari.ro.leg.br/consolidacao/1/'},
  {title:'Resolução 173/CMCJ/2025',url:'https://athus4.candeiasdojamari.ro.leg.br/transparencia/documento/ver/25935D61EE0A1BFB7E6F55E9168A5A42D2BE25A6/'}
 ]
});
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
export function isLegislationQuestion(q){
 return q?.disciplineCode==='LE'||/LEGISLACAO|DIREITO ADMINISTRATIVO|DIREITO CONSTITUCIONAL/.test(norm(q?.discipline));
}
export function isLocalLegislation(q,e){
 if(!isLegislationQuestion(q))return false;
 const text=norm([q.stem,q.topic,q.contextText,q.heading].join(' '));
 if(/LEGISLACAO INSTITUCIONAL|CAMARA MUNICIPAL|PREFEITURA MUNICIPAL|LEI ORGANICA|REGIMENTO INTERNO|RESOLUCAO N|PROCURADORIA DA CAMARA|DIRETORIA LEGISLATIVA|LEI MUNICIPAL/.test(text))return true;
 const org=norm(e?.orgao||q.orgao).replace(/[^A-Z0-9]/g,'');
 return /^CM/.test(org)&&/LEGISLACAO|SERVIDORES MUNICIPAIS|CARGOS DA CAMARA/.test(text);
}
/**
 * Não presume equivalência pela troca do nome da cidade.
 * Sem correspondência legal APROVADA, só aparece no banco original.
 */
export function studyEligibility(q,e,mode='candeias'){
 if(mode==='original'||!isLocalLegislation(q,e))return {allowed:true,status:'original'};
 // Adaptação aprovada é um novo registro, que conserva referência à original.
 if(q.adaptation?.target===STUDY_CONTEXT.id&&q.adaptation.approved===true&&
    q.adaptation.sourceUrl&&q.adaptation.sourceArticle&&q.adaptation.verifiedAnswer)
   return {allowed:true,status:'approved'};
 return {allowed:false,status:'awaiting-legal-review',reason:'A legislação específica desta questão ainda não foi comparada e validada com as normas de Candeias do Jamari.'};
}
export function eligibleForList(q,e,mode){
 return studyEligibility(q,e,mode).allowed;
}
