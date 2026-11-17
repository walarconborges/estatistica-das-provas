/**
 * Classificação por edital, calculada em memória a cada consulta.
 * Fonte: Anexo IV, Edital 01/2026, Câmara de Candeias do Jamari/RO.
 * Cargos 202 (fundamental) e 505 (superior). Sem alteração em data/state.json.
 * Títulos do catálogo de 505 preservam o resumo já existente do Anexo IV.
 * Reconhece equivalências por conteúdo; nome diferente NÃO significa "fora".
 */
import {PROGRAM_505} from './programa-candeias-505.mjs';
import {PROGRAM_PROFESSOR,PROFESSOR_CARGO_ID,matchProfessorNewTopic,normalizeProfessorText} from './programa-semed-professor.mjs';
export const CURRENT_CARGO_202='202', CURRENT_CARGO_505='505';
export const CARGO_202={
 id:'202', cargo:'Auxiliar de Serviços Gerais', level:'Ensino fundamental completo',
 edital:'Câmara Municipal de Candeias do Jamari/RO — Edital 01/2026',
 annex:'Anexo IV — Conteúdos Programáticos', pages:'1–2',
 sections:[
  {id:'portugues',title:'Português',pages:'1',topics:[
   'Compreensão e interpretação de textos','Tipologia e gêneros textuais','Coerência e coesão textual',
   'Formação e significação de palavras; sinônimos e antônimos','Ordem alfabética',
   'Sílaba: separação e classificação','Ortografia e acentuação','Tipos de frase','Pontuação',
   'Morfologia: classes de palavras','Sintaxe: estrutura da oração e do período e termos essenciais e acessórios'
  ]},
  {id:'matematica',title:'Matemática',pages:'1',topics:[
   'Operações básicas: adição, subtração, multiplicação e divisão','Potenciação e radiciação',
   'Números naturais e expressões numéricas','Problemas matemáticos','Regra de três',
   'Números primos, múltiplos, divisores, MDC e MMC','Operações básicas com polinômios',
   'Equações e sistemas de equações do 1º grau','Leitura de gráficos de colunas e tabelas',
   'Frações, números decimais e dízimas','Conversão de dias, horas, minutos e segundos',
   'Sistema de medidas','Porcentagem','Sistema de conjuntos','Sistema Monetário Brasileiro',
   'Sequências lógicas com números, letras e figuras'
  ]},
  {id:'gerais',title:'Conhecimentos Gerais',pages:'1–2',topics:[
   'Fatos políticos, econômicos e sociais dos últimos cinco anos',
   'Geografia, história, sociedade, economia, política e estatísticas do Brasil, Rondônia e município',
   'Cidadania e símbolos nacionais, estaduais e municipais',
   'Atualidades: economia, meio ambiente, justiça, segurança, saúde, educação e cultura',
   'Atualidades: esportes, turismo, religião, qualidade de vida e ciência e tecnologia',
   'Realidade histórica, geográfica, cultural, econômica e socioambiental de Rondônia',
   'Notícias do site da Câmara Municipal de Candeias do Jamari'
  ]}
 ]
};
export const CATALOGS=Object.freeze({
 '202':CARGO_202,
 '505':{...PROGRAM_505,id:'505',cargo:PROGRAM_505.cargo,pages:'4–5 e 7'},
 [PROFESSOR_CARGO_ID]:PROGRAM_PROFESSOR
});
export const currentCatalog=id=>CATALOGS[String(id)]||CATALOGS['505'];
/** Modo transversal: só considera as disciplinas ORIGINAIS da prova.
 * Não cria um edital fictício nem aplica normas locais de Candeias.
 */
export const STUDY_ALL='all';
export const ALL_STUDY_DISCIPLINES=Object.freeze([
 {id:'LP',label:'Língua Portuguesa'},
 {id:'RLM',label:'Raciocínio Lógico/Matemático'},
 {id:'IN',label:'Informática'},
 {id:'CG',label:'Conhecimentos Gerais e Atualidades'},
 {id:'LE',label:'Legislação e Direito'},
 {id:'CE',label:'Conhecimentos Específicos'},
 {id:'OTHER',label:'Outras disciplinas / não classificadas'}
]);
const normGeneral=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
export function studyAllGroup(q){
 const code=normGeneral(q?.disciplineCode),text=normGeneral(q?.discipline);
 if(code==='LP'||/PORTUGUES/.test(text))return 'LP';
 if(['MA','RL','RLM'].includes(code)||/MATEMATICA|RACIOCINIO LOGICO|RACIOCINIO LOGICO\/MATEMATICO/.test(text))return 'RLM';
 if(code==='IN'||/INFORMATICA|TECNOLOGIA DA INFORMACAO/.test(text))return 'IN';
 if(['CG','HI','GE'].includes(code)||/CONHECIMENTOS GERAIS|ATUALIDADES|GEOGRAFIA|HISTORIA/.test(text))return 'CG';
 if(['LE','DA','DC'].includes(code)||/LEGISLACAO|DIREITO ADMINISTRATIVO|DIREITO CONSTITUCIONAL/.test(text))return 'LE';
 if(code==='CE'||/CONHECIMENTOS ESPECIFICOS/.test(text))return 'CE';
 return 'OTHER';
}
export function filterStudyAllQuestions(questions,discipline='',topic=''){
 return questions.filter(q=>!q.originalQuestionId&&(!discipline||studyAllGroup(q)===discipline)&&(!topic||q.topic===topic));
}

export const allTopics=id=>currentCatalog(id).sections.flatMap(section=>
 section.topics.map((title,index)=>({
  id:section.id+':'+index,sectionId:section.id,discipline:section.title,
  title,pages:section.pages
 })));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const rx=(...expressions)=>expressions.map(x=>new RegExp(x,'i'));
const rx202={
 portugues:[
  rx('INTERPRETA[CÇ][ÃA]O','COMPREENS[ÃA]O (?:DO )?TEXTO','IDEIA CENTRAL','INFER[EÊ]NCIA','SENTIDO DO TEXTO','COM BASE NO TEXTO','DE ACORDO COM O TEXTO','CONFORME O TEXTO','SEGUNDO O TEXTO','TEXTO [0-9]+','INFORMA[CÇ][ÕO]ES (?:IMPL[IÍ]CITAS|EXPL[IÍ]CITAS)'),
  rx('G[EÊ]NEROS? TEXTUA','TIPOLOGIA','TIPOS? DE TEXTO','NARRATIV','DISSERTATIV','INJUNTIV','TIRINH','CHARGE','EDITORIAL','NOT[IÍ]CIA','OF[IÍ]CIO','ATA DE REUNI[ÃA]O','MEMORANDO','REDA[CÇ][ÃA]O OFICIAL'),
  rx('COES[ÃA]O','COER[EÊ]NCIA','CONECTIV','REFERENCIA[CÇ][ÃA]O','ELEMENTOS DE LIGA[CÇ][ÃA]O','PROGRESS[ÃA]O TEXTUAL'),
  rx('SIN[ÔO]NIM','ANT[ÔO]NIM','SIGNIFICADO','SIGNIFICA[CÇ][ÃA]O','SEM[ÂA]NTIC','FORMA[CÇ][ÃA]O DE PALAVRAS','PREFIX','SUFIX','DERIVA[CÇ][ÃA]O'),
  rx('ORDEM ALFAB[EÉ]TICA','ALFABETIZA[CÇ][ÃA]O'),
  rx('S[IÍ]LAB','DIVIS[ÃA]O SIL[AÁ]BICA','SEPARA[CÇ][ÃA]O SIL[AÁ]BICA'),
  rx('ORTOGRAF','ACENTUA[CÇ][ÃA]O','GRAFIA CORRETA','ESCRITA CORRETA'),
  rx('TIPOS? DE FRASE','INTERROGATIV','EXCLAMATIV','DECLARATIV','IMPERATIV'),
  rx('PONTUA[CÇ][ÃA]O','V[IÍ]RGUL','DOIS.PONTOS','PONTO.E.V[IÍ]RGULA','TRAVESS[ÃA]O'),
  rx('CLASSES? DE PALAVRAS','MORFOLOG','VERB','PRONOM','SUBSTANTIV','ADJETIV','ADV[EÉ]RB','PREPOSI[CÇ][ÃA]O','CONJUN[CÇ][ÃA]O','ARTIGO DEFINIDO','SUJEITO OCULTO'),
  rx('SINTAX','SUJEITO','PREDICAD','ORA[CÇ][ÃA]O','PER[IÍ]ODO COMPOSTO','TERMOS? ESSENCIAIS','COMPLEMENTO NOMINAL','OBJETO DIRETO','OBJETO INDIRETO','CONCORD[ÂA]NCIA','REG[EÊ]NCIA')
 ],
 matematica:[
  rx('ADI[CÇ][ÃA]O','SUBTRA[CÇ][ÃA]O','MULTIPLICA[CÇ][ÃA]O','DIVIS[ÃA]O','SOMA','PRODUTO','QUOCIENTE'),
  rx('POT[EÊ]NCIA','RADICIA[CÇ][ÃA]O','RAIZ QUADRADA','EXPONEN'),
  rx('N[ÚU]MEROS? NATURAIS','EXPRESS[ÃA]O NUM[EÉ]RICA','EXPRESS[ÕO]ES NUM[EÉ]RICAS','ORDEM DAS OPERA[CÇ][ÕO]ES'),
  rx('PROBLEMA','SITUA[CÇ][ÃA]O.PROBLEMA','CALCULE','QUANTOS','QUANTAS','TOTAL DE'),
  rx('REGRA DE TR[EÊ]S','PROPOR[CÇ][ÃA]O','GRANDEZAS PROPORCIONAIS'),
  rx('DIVISORES','M[ÚU]LTIPLOS','N[ÚU]MEROS? PRIMOS','FATORA[CÇ][ÃA]O','MDC','MMC'),
  rx('POLIN[ÔO]M','MON[ÔO]M'),
  rx('EQUA[CÇ][ÃA]O','SISTEMA DE EQUA[CÇ][ÕO]ES','INC[ÓO]GNITA','PRIMEIRO GRAU'),
  rx('GR[AÁ]FIC','TABELA DE DADOS','COLUNAS','LEITURA DE DADOS','INTERPRETA[CÇ][ÃA]O DE DADOS'),
  rx('FRA[CÇ][ÃA]O','FRA[CÇ][ÕO]ES','DECIMAIS','D[IÍ]ZIMA','N[ÚU]MERO DECIMAL'),
  rx('HORA','MINUTO','SEGUNDO','DIAS','TEMPO TRANSCORRIDO','CONVERS[ÃA]O DE TEMPO'),
  rx('METRO','CENT[IÍ]METRO','QUIL[ÔO]METRO','LITRO','GRAMAS?','MEDIDAS','[ÁA]REA','VOLUME'),
  rx('PORCENT','PERCENT','DESCONTO','TAXA DE','%'),
  rx('CONJUNTO','UNI[ÃA]O','INTERSE[CÇ][ÃA]O','PERTIN[EÊ]NCIA'),
  rx('REAL','CENTAVOS','MOEDAS','C[EÉ]DULAS','SISTEMA MONET[AÁ]RIO'),
  rx('SEQU[EÊ]NCIA','PADR[ÃA]O L[ÓO]GICO','PR[ÓO]XIMO N[ÚU]MERO','FIGURAS?','LETRAS?')
 ],
 gerais:[
  rx('ELEI[CÇ][ÕO]ES','PRESIDENTE','CONGRESSO','ECONOMIA','INFLA[CÇ][ÃA]O','PANDEMIA','POL[IÍ]TICA'),
  rx('GEOGRAF','HIST[ÓO]R','ROND[ÔO]NIA','BRASIL','CANDEIAS','AMAZ[ÔO]NIA','POPULA[CÇ][ÃA]O','TERRIT[ÓO]RIO','IBGE','ESTAT[IÍ]STIC'),
  rx('CIDADANIA','BANDEIRA','HINO','BRAS[ÃA]O','S[IÍ]MBOLOS'),
  rx('MEIO AMBIENTE','CLIM[AÁ]TIC','MIGRA[CÇ][ÃA]O','SUSTENTABIL','SA[ÚU]DE','SEGURAN[CÇ]A P[ÚU]BLICA','EDUCA[CÇ][ÃA]O','JUSTI[CÇ]A','CULTURA','MUDAN[CÇ]AS CLIM'),
  rx('ESPORTE','TURISMO','RELIGI[ÃA]O','QUALIDADE DE VIDA','CI[EÊ]NCIA','TECNOLOGIA','INTELIG[EÊ]NCIA ARTIFICIAL'),
  rx('ROND[ÔO]NIA','PORTO VELHO','MADEIRA','AMAZ[ÔO]NIA','SOCIOAMBIENT'),
  rx('C[ÂA]MARA MUNICIPAL DE CANDEIAS','NOT[IÍ]CIAS? DA C[ÂA]MARA')
 ]
};
const rx505={
 portugues:[
  rx('INTERPRETA[CÇ][ÃA]O','COMPREENS[ÃA]O','IDEIA CENTRAL','INFER[EÊ]NCIA','COM BASE NO TEXTO','DE ACORDO COM O TEXTO','TEXTO [0-9]+','G[EÊ]NEROS? TEXTUA','TIPOS? DE TEXTO','CHARGE','TIRINH','EDITORIAL','OF[IÍ]CIO','MEMORANDO','ATA DE REUNI[ÃA]O'),
  rx('VARIA[CÇ][ÃA]O LINGU[IÍ]STICA','DISCURSO DIRETO','DISCURSO INDIRETO','REGISTRO FORMAL','REGISTRO INFORMAL'),
  rx('COES[ÃA]O','COER[EÊ]NCIA','ARGUMENTA[CÇ][ÃA]O','OPERADORES ARGUMENTATIVOS','PROGRESS[ÃA]O TEXTUAL'),
  rx('FORMA[CÇ][ÃA]O DE PALAVRAS','PREFIX','SUFIX','CLASSES? DE PALAVRAS','PRONOM','SUBSTANTIV','ADJETIV','VERB','ADV[EÉ]RB','CONJUN[CÇ][ÃA]O'),
  rx('SINTAX','ORA[CÇ][ÃA]O','PER[IÍ]ODO COMPOSTO','SUJEITO','PREDICAD','CONCORD[ÂA]NCIA','REG[EÊ]NCIA'),
  rx('PRONOMES? RELATIVOS','PRONOMES? OBL[IÍ]QUOS','COLOCA[CÇ][ÃA]O PRONOMINAL','PR[ÓO]CLISE','MES[ÓO]CLISE','[ÊE]NCLISE'),
  rx('CRASE','PONTUA[CÇ][ÃA]O','V[IÍ]RGUL','ORTOGRAF','ACENTUA[CÇ][ÃA]O','GRAFIA CORRETA')
 ],
 raciocinio:[
  rx('PROPOSI[CÇ][ÃA]O','CONECTIV','IMPLICA[CÇ][ÃA]O','EQUIVAL[EÊ]NCIA L[ÓO]GICA','TABELA.VERDADE','ARGUMENTO V[AÁ]LIDO','NEGA[CÇ][ÃA]O'),
  rx('CONJUNTO','SUBCONJUNTO','PERTIN[EÊ]NCIA','UNI[ÃA]O','INTERSE[CÇ][ÃA]O'),
  rx('ADI[CÇ][ÃA]O','SUBTRA[CÇ][ÃA]O','MULTIPLICA[CÇ][ÃA]O','DIVIS[ÃA]O','POT[EÊ]NCIA','RADICIA[CÇ][ÃA]O','DECIMAIS','VALOR ABSOLUTO','M[ÓO]DULO DE'),
  rx('N[ÚU]MEROS? NATURAIS','FATORES? PRIMOS','M[ÚU]LTIPLOS','DIVISORES','MDC','MMC'),
  rx('VERDADES? E MENTIRAS','SEQU[EÊ]NCIA','PADR[ÃA]O L[ÓO]GICO','S[ÉE]RIE NUM[EÉ]RICA'),
  rx('COMBINA[CÇ][ÃA]O','ARRANJO','PERMUTA[CÇ][ÃA]O','PROBABILIDADE','CONTAGEM','ESCOLHER','COMISS[ÃA]O','COMISS[ÕO]ES','POSSIBILIDADES')
 ],
 'informatica-basica':[
  rx('WINDOWS 10','EXPLORADOR DE ARQUIVOS','WINDOWS EXPLORER','PASTAS','[ÁA]REA DE TRABALHO','BARRA DE TAREFAS','COMPARTILHAMENTO'),
  rx('INTERNET','INTRANET','NAVEGADOR','CHROME','FIREFOX','EDGE','MECANISMO DE BUSCA','HTTP','HTTPS','URL'),
  rx('INTELIG[EÊ]NCIA ARTIFICIAL','ASSISTENTE VIRTUAL','AUTOMA[CÇ][ÃA]O DE TAREFAS','RECURSOS INTELIGENTES'),
  rx('MICROSOFT 365','WORD','EXCEL','POWERPOINT','TEAMS','OUTLOOK','PLANILHA','APRESENTA[CÇ][ÃA]O'),
  rx('SEGURAN[CÇ]A DA INFORMA[CÇ][ÃA]O','V[IÍ]RUS','MALWARE','PHISHING','RANSOMWARE','SENHA','CRIPTOGRAF','GOLPE DIGITAL'),
  rx('BACKUP','C[ÓO]PIA DE SEGURAN[CÇ]A','RECUPERA[CÇ][ÃA]O DE DADOS','CONTING[EÊ]NCIA'),
  rx('REDE DE COMPUTADORES','PROTOCOLO','TCP','IP','SWITCH','ROTEADOR','HARDWARE','SOFTWARE','PROCESSADOR','MEM[ÓO]RIA RAM','BIOS','CPU')
 ],
 legislacao:[
  rx('LEI ORG[ÂA]NICA','LEI ORG[ÂA]NICA DO MUNIC[IÍ]PIO'),
  rx('RESOLU[CÇ][ÃA]O.{0,30}0*01.{0,15}CMCJ','RESOLU[CÇ][ÃA]O.{0,20}0*01.93'),
  rx('RESOLU[CÇ][ÃA]O.{0,30}173.{0,15}CMCJ','RESOLU[CÇ][ÃA]O.{0,25}173.2025')
 ],
 gerais:rx202.gerais,
 especificos:[
  rx('INTERNET','URL','LINK','SITES?','PORTAIS?','INTRANET','EXTRANET','NAVEGADOR','E.MAIL','CORREIO ELETR[ÔO]NICO','MECANISMO DE BUSCA','GOOGLE','BING'),
  rx('HARDWARE','PERIF[EÉ]RICO','RAM','ROM','MEM[ÓO]RIA','CACHE','DRIVER','CPU','BARRAMENTO','CLOCK'),
  rx('USB','HDMI','THUNDERBOLT','BIOS','UEFI','SETUP','ARMAZENAMENTO','MONTAGEM','MANUTEN[CÇ][ÃA]O','IMPRESSORA'),
  rx('MALWARE','RANSOMWARE','PHISHING','ANTIV[IÍ]RUS','V[IÍ]RUS','SEGURAN[CÇ]A DA INFORMA[CÇ][ÃA]O'),
  rx('WINDOWS','SISTEMA OPERACIONAL','ARQUIVOS','PASTAS','SOFTWARE','COMPARTILHAMENTO','BACKUP'),
  rx('REDE','SWITCH','ROTEADOR','ENDERE[CÇ]AMENTO IP','PROTOCOLO','TCP','M[ÁA]SCARA DE REDE','SUB.REDE','TOPOLOGIA','DNS','DHCP'),
  rx('WORD','EXCEL','POWERPOINT','ACCESS','PLANILHA','GR[AÁ]FIC'),
  rx('SOFTWARE LIVRE','LINUX','LIBREOFFICE','COMANDOS? LINUX'),
  rx('ALGORITMO','PROGRAMA[CÇ][ÃA]O ESTRUTURADA','TIPOS? DE DADOS','VETOR','MATRIZ','ESTRUTURAS? DE REPETI[CÇ][ÃA]O','PONTEIRO','FUN[CÇ][ÕO]ES'),
  rx('COMPILADOR','IDE','AMBIENTE DE DESENVOLVIMENTO','PROTOTIPA[CÇ][ÃA]O','DESENVOLVIMENTO DE SISTEMAS'),
  rx('ORIENTA[CÇ][ÃA]O A OBJETOS','CLASSES?','HERAN[CÇ]A','POLIMORFISMO','SOBRECARGA','ENCAPSULAMENTO','OBJETOS','AGREGA[CÇ][ÃA]O'),
  rx('LGPD','13[ .]?709','PROTE[CÇ][ÃA]O DE DADOS PESSOAIS','DADOS PESSOAIS','CONTROLADOR DE DADOS')
 ]
};
const matchAny=(patterns,text)=>patterns?.some(pattern=>pattern.test(text))||false;
function sectionFor(q,exam,cargo){
 const discipline=norm(q.discipline),code=norm(q.disciplineCode);
 const stem=norm([q.stem,q.heading,(q.contextText||'').slice(0,350)].join(' '));
 // Usar a disciplina da prova evita confundir texto-base jurídico em Português
 // com disciplina de Legislação. Assuntos específicos só são inferidos se pertinentes.
 if(code==='LP'||/LINGUA PORTUGUESA|PORTUGUES/.test(discipline))return 'portugues';
 if(cargo==='202'){
  if(code==='MA'||code==='RL'||code==='RLM'||/MATEMATICA|RACIOCINIO LOGICO/.test(discipline))return 'matematica';
  if(code==='CG'||/CONHECIMENTOS GERAIS|ATUALIDADES|HISTORIA|GEOGRAFIA/.test(discipline))return 'gerais';
  return null;
 }
 if(code==='RL'||code==='MA'||code==='RLM'||/RACIOCINIO LOGICO|MATEMATICA/.test(discipline))return 'raciocinio';
 if(/\bLGPD\b|13\.?709|LEI GERAL DE PROTECAO DE DADOS/.test(stem))return 'especificos';
 if(code==='LE'||/LEGISLACAO|DIREITO ADMINISTRATIVO|DIREITO CONSTITUCIONAL/.test(discipline))return 'legislacao';
 if(code==='CG'||/CONHECIMENTOS GERAIS|ATUALIDADES|HISTORIA|GEOGRAFIA/.test(discipline))return 'gerais';
 if(code==='IN'||/INFORMATICA|TECNOLOGIA DA INFORMACAO/.test(discipline))return 'especificos';
 if(code==='CE'||/CONHECIMENTOS ESPECIFICOS/.test(discipline)){
  return matchAny(rx505.especificos.flat(),' '+stem+' ')?'especificos':null;
 }
 // Matéria não identificada: procurar conceitos explícitos, sem supor que
 // toda legislação, informática e matemática seja relevante para os dois cargos.
 if(matchAny(rx505.especificos.flat(),stem))return 'especificos';
 return null;
}
const foreignLocalLaw=t=>/\bBRUSQUE\b|\bVOTORANTIM\b|\bPORTO VELHO\b|\bARIQUEMES\b|\bJI PARANA\b/.test(t);
const candeiasLaw=t=>/\bCANDEIAS DO JAMARI\b|\bCMCJ\b/.test(t);
const municipalLaw=t=>/LEI (?:COMPLEMENTAR )?MUNICIPAL|LEI ORGANICA|REGIMENTO INTERNO|ESTATUTO DOS SERVIDORES|PLANO DE CARGOS|RESOLUCAO [N0-9]/.test(t);
function inferClassificationForCargo(q,exam,cargoId='505'){
 const cargo=String(cargoId)==='202'?'202':'505',catalog=currentCatalog(cargo);
 const sectionId=sectionFor(q,exam,cargo);
 const stem=norm([q.stem,q.options?.map(o=>o.text).join(' ')||'',q.heading].join(' '));
 const lawText=norm([q.stem,q.contextText,q.heading].join(' '));
 const denied=(reason='Assunto não previsto para este cargo.')=>({
  cargoId:cargo,status:'fora',statusLabel:'Fora do edital',
  discipline:'Fora do edital',topic:'Fora do edital',topicId:'',reason
 });
 const pending=(name,reason='Aguardar conferência do assunto correspondente.')=>({
  cargoId:cargo,status:'pendente',statusLabel:'A conferir',discipline:name,
  topic:'A conferir',topicId:'',reason
 });
 if(cargo==='202'&&q.originalQuestionId)return denied('Adaptação de legislação não integra o cargo 202.');
 if(!sectionId)return denied('Disciplina ou conteúdo não consta do programa do cargo '+cargo+'.');
 const section=catalog.sections.find(s=>s.id===sectionId);
 if(!section)return denied();
 if(cargo==='505'&&sectionId==='legislacao'){
  if(q.originalQuestionId){
   const a=q.adaptation||{};
   if(a.verifiedAnswer===q.answer&&a.sourceArticle&&a.sourceUrl&&
    a.target==='candeias-do-jamari-ro'&&(a.autoGenerated||a.approved)){
    return {cargoId:cargo,status:'dentro',statusLabel:'Dentro do edital',
     discipline:section.title,topic:'Legislação municipal adaptada e fundamentada',
     topicId:'legislacao:2',reason:'Adaptação com fundamento declarado'};
   }
   return pending(section.title,'Adaptação ainda não comprovada.');
  }
  if(foreignLocalLaw(lawText))return denied('Regra municipal de outro ente não equivale automaticamente à de Candeias.');
  const origin=norm([exam?.orgao,exam?.title].join(' '));
  if(municipalLaw(lawText)&&/BRUSQUE|VOTORANTIM|PORTO VELHO|ARIQUEMES|JI PARANA/.test(origin)&&!candeiasLaw(lawText))
   return denied('Norma municipal do concurso de origem, sem correspondência verificada em Candeias.');
  if(municipalLaw(lawText)&&!candeiasLaw(lawText)&&
    !/LEI ORGANICA DO MUNICIPIO/.test(lawText))return pending(section.title,
     'Sem identificação inequívoca da norma municipal exigida pelo edital.');
 }
 if(cargo==='202'&&sectionId==='matematica'&&
  /L[ÓO]GICA PROPOSICIONAL|PROPOSI[CÇ][ÃA]O|TABELA VERDADE|AN[AÁ]LISE COMBINAT[ÓO]RIA|PROBABILIDADE|DERIVADA|INTEGRAL/.test(stem))
  return denied('Tema de raciocínio avançado não expresso no programa de Matemática do cargo 202.');
 if(cargo==='505'&&sectionId==='raciocinio'&&
  /GEOMETRIA ANAL[IÍ]TICA|TRIGONOMETRIA|C[AÁ]LCULO DIFERENCIAL/.test(stem))
  return denied('Assunto matemático não contemplado no programa do cargo 505.');
 const matcher=(cargo==='202'?rx202:rx505)[sectionId]||[];
 // Para Português e Matemática, uma mesma ideia pode ter redações diversas:
 // explicitamos equivalências sem exigir que a frase do edital seja idêntica.
 const indexes=[];
 for(let i=0;i<section.topics.length;i++){
  if(matchAny(matcher[i],stem))indexes.push(i);
 }
 if(indexes.length){
  const idx=indexes[0],title=section.topics[idx];
  return {cargoId:cargo,status:'dentro',statusLabel:'Dentro do edital',
   discipline:section.title,topic:title,topicId:sectionId+':'+idx,
   reason:'Correspondência conceitual ou terminológica com o Anexo IV.'};
 }
 if(sectionId==='legislacao')return denied('Lei não incluída nas normas municipais exigidas.');
 return pending(section.title,'Disciplina prevista, mas o subassunto exige conferência por equivalência.');
}
/**
 * Catálogo de Professor — blocos compartilhados reutilizam a classificação
 * do cargo 505. Só as lacunas de RLM, legislação educacional e pedagogia
 * recebem correspondências novas. Nunca reescreve a questão original.
 */
function inferProfessorClassification(q,exam){
 const cargo=PROFESSOR_CARGO_ID,catalog=currentCatalog(cargo);
 const denied=(reason='Disciplina ou assunto não previsto no edital do Professor Nível II.')=>({
  cargoId:cargo,status:'fora',statusLabel:'Fora do edital',
  discipline:'Fora do edital',topic:'Fora do edital',topicId:'',reason
 });
 const pending=(sectionId,reason='Disciplina prevista; assunto exige conferência.')=>{
  const section=catalog.sections.find(s=>s.id===sectionId);
  return {cargoId:cargo,status:'pendente',statusLabel:'A conferir',
   discipline:section?.title||'A conferir',topic:'A conferir',topicId:'',reason};
 };
 const inside=(sectionId,idx,reason)=>{
  const section=catalog.sections.find(s=>s.id===sectionId);
  if(!section||!section.topics[idx])return pending(sectionId);
  return {cargoId:cargo,status:'dentro',statusLabel:'Dentro do edital',
   discipline:section.title,topic:section.topics[idx],
   topicId:sectionId+':'+idx,
   reason:reason||'Correspondência conceitual com o Anexo IV da SEMED Porto Velho.'};
 };
 // A questão derivada para LEGISLAÇÃO DE CANDEIAS não pode ser aproveitada
 // automaticamente em Porto Velho. As originais continuam disponíveis.
 if(q?.originalQuestionId)return denied('Adaptação destinada a Candeias; consultar a questão original para Porto Velho.');
 const code=norm(q?.disciplineCode),discipline=norm(q?.discipline);
 const source=normalizeProfessorText([q?.stem,q?.heading,q?.topic].join(' '));
 const baseGroup=studyAllGroup(q);
 const sectionId=baseGroup==='LP'?'portugues':
  baseGroup==='RLM'?'raciocinio':baseGroup==='CG'?'gerais':null;
 if(sectionId){
  if(sectionId==='raciocinio'){
   if(/GEOMETRIA ANALITICA|TRIGONOMETRIA|CALCULO DIFERENCIAL/.test(source))
    return denied('Assunto não previsto no programa de Raciocínio Lógico.');
   const extra=matchProfessorNewTopic('raciocinio',source);
   if(extra>=0)return inside('raciocinio',extra,'Complemento de RLM específico do edital da SEMED.');
  }
  if(sectionId==='gerais'&&/PREFEITURA(?: MUNICIPAL)? DE PORTO VELHO|SITE DA PREFEITURA DE PORTO VELHO/.test(source))
   return inside('gerais',catalog.sections.find(s=>s.id==='gerais').topics.length-1);
  const reused=inferClassificationForCargo(q,exam,'505');
  if(reused.status==='dentro'&&reused.topicId.startsWith(sectionId+':')){
   const idx=Number(reused.topicId.split(':')[1]);
   if(sectionId==='gerais'&&idx===6)
    return pending(sectionId,'Notícias específicas de Candeias não equivalem à fonte municipal de Porto Velho.');
   return inside(sectionId,idx,'Conteúdo compartilhado com o catálogo já existente de Português/RLM/Gerais.');
  }
  return reused.status==='fora'?denied(reused.reason):pending(sectionId);
 }
 const legalIndex=matchProfessorNewTopic('legislacao-educacao',source);
 const specificIndex=matchProfessorNewTopic('especificos',source);
 const legalDiscipline=code==='LE'||['DA','DC'].includes(code)||/LEGISLACAO|DIREITO EDUCACIONAL/.test(discipline);
 const pedagogicalDiscipline=code==='CE'||/PEDAGOG|DIDATICA|FUNDAMENTOS DA EDUCACAO|CONHECIMENTOS ESPECIFICOS|EDUCACAO INFANTIL|ALFABETIZACAO|PSICOLOGIA DA EDUCACAO/.test(discipline);
 if(legalDiscipline){
  if(legalIndex>=0)return inside('legislacao-educacao',legalIndex);
  return denied('Norma jurídica não encontrada na lista de Legislação Educação.');
 }
 if(pedagogicalDiscipline){
  if(specificIndex>=0)return inside('especificos',specificIndex);
  // Não presumir que qualquer questão de Conhecimentos Específicos
  // de outro cargo seja pedagógica.
  const title=normalizeProfessorText([exam?.title,exam?.cargo,q?.discipline,q?.topic].join(' '));
  if(/INFORMATICA|TECNOLOGIA DA INFORMACAO|PROGRAMACAO|ANALISTA DE|MOTORISTA|SERVICOS GERAIS|SAUDE|SECRETARIA/.test(title))
   return denied('Conhecimentos específicos de outro cargo, sem correspondência pedagógica.');
  return /PROFESSOR|PEDAGOG|EDUCACAO|ENSINO/.test(title)
   ?pending('especificos','Conteúdo possivelmente pedagógico; correspondência a conferir.')
   :denied('Não há evidência de pertinência aos conhecimentos específicos de Séries Iniciais.');
 }
 // Algumas provas antigas não têm a disciplina original corretamente
 // identificada, mas trazem o objeto legal ou pedagógico no enunciado.
 if(legalIndex>=0&&/LDB|BNCC|FUNDEB|ECA|MAGISTERIO|EDUCACAO|ESCOLA/.test(source))
  return inside('legislacao-educacao',legalIndex);
 if(specificIndex>=0&&/ALFABETIZ|LETRAMENT|DIDATICA|PEDAGOG|APRENDIZAGEM|EDUCACAO INFANTIL|PPP|PRIMEIROS SOCORROS/.test(source))
  return inside('especificos',specificIndex);
 return denied();
}

/** Persistir apenas após aprovação administrativa da sinalização. */
export function approveEdictReview(question,proposed){
 const cargo=String(proposed?.editalCargo||''),status=String(proposed?.status||'');
 if(!['202','505',PROFESSOR_CARGO_ID].includes(cargo)||!['dentro','fora'].includes(status))
  throw Error('Parecer do edital inválido (cargo e situação são obrigatórios).');
 question.editalReview={...(question.editalReview||{}),[cargo]:{status}};
 return question;
}

/**
 * Correções explícitas só são aplicadas após aprovação da sinalização.
 * Cada cargo mantém sua própria revisão; o original permanece inalterado.
 */
export function classifyForCargo(q,exam,cargoId='505'){
 const cargo=['202','505',PROFESSOR_CARGO_ID].includes(String(cargoId))?String(cargoId):'505';
 const computed=cargo===PROFESSOR_CARGO_ID?inferProfessorClassification(q,exam):inferClassificationForCargo(q,exam,cargo);
 const reviewed=q?.editalReview?.[cargo];
 if(!reviewed||!['dentro','fora'].includes(reviewed.status))return computed;
 if(reviewed.status==='fora')return {
  ...computed,status:'fora',statusLabel:'Fora do edital',
  discipline:'Fora do edital',topic:'Fora do edital',topicId:'',
  reason:'Classificação revisada e aprovada.'
 };
 return {
  ...computed,status:'dentro',statusLabel:'Dentro do edital',
  discipline:computed.discipline==='Fora do edital'?(q?.discipline||'Assunto revisado'):computed.discipline,
  topic:computed.topic==='Fora do edital'||computed.topic==='A conferir'?'Enquadramento revisado':computed.topic,
  topicId:computed.topicId||'revisado:'+String(q?.disciplineCode||'geral'),
  reason:'Classificação revisada e aprovada.'
 };
}

/**
 * O filtro do edital tem apenas dois modos públicos.
 * "Dentro" inclui tanto correspondência validada quanto classificação
 * pendente, para que o usuário possa sinalizar enquanto resolve.
 * Valores antigos (relevantes/pendente/fora) voltam ao modo padrão.
 */
export const EDITAL_SCOPE_OPTIONS=Object.freeze([
 {value:'dentro',label:'Dentro do edital'},
 {value:'all',label:'Todas'}
]);
export function normalizeEditalScope(value){
 return String(value||'')==='all'?'all':'dentro';
}
export function inEditalScope(classification,scope='dentro'){
 return normalizeEditalScope(scope)==='all'||classification?.status!=='fora';
}
export function subjectSummary(questions,getExam,cargoId){
 const total={dentro:0,fora:0,pendente:0},topics=new Map();
 for(const q of questions){
  const cls=classifyForCargo(q,getExam(q.examId),cargoId);
  total[cls.status]++;
  if(cls.status==='dentro'){
   const key=cls.topicId,entry=topics.get(key)||{id:key,discipline:cls.discipline,topic:cls.topic,count:0};
   entry.count++;topics.set(key,entry);
  }
 }
 return {total,topics:[...topics.values()].sort((a,b)=>b.count-a.count||a.topic.localeCompare(b.topic,'pt-BR'))};
}
