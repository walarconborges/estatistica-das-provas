// Núcleo de dados e regras. Não depende da interface.
export const STORAGE_KEY='estatistica-das-provas-v1';
export const newId=()=>globalThis.crypto?.randomUUID?.() || ('id-'+Date.now()+'-'+Math.random().toString(36).slice(2));
export const fresh=()=>({version:1,profiles:[],exams:[],questions:[],attempts:[],simulations:[],flags:[],tombstones:{exams:[],questions:[],attempts:[],simulations:[],flags:[]}});
/**
 * Remove SOMENTE marcas editoriais das páginas que vazaram para a última
 * alternativa. NUNCA retirar URLs genéricas, referências ou textos do
 * enunciado: apenas a assinatura exata do rodapé da banca, no fim do campo.
 */
export function stripExamFooter(value){
 const source=String(value??'');
 return source
  .replace(/(?:^|[ \t\n])(?:https?:\/\/)?www\.objetivas\.com\.br[ \t]*$/iu,'')
  .trimEnd();
}
/**
 * Reparação determinística das opções extraídas. Mantém IDs, gabarito,
 * código, autoria, histórico e todas as outras informações inalterados.
 * É idempotente: pode ser aplicada tanto aos dados locais quanto remotos.
 */
export function repairImportedFooters(state){
 if(!state||!Array.isArray(state.questions))return state;
 for(const q of state.questions){
  if(!q||!Array.isArray(q.options))continue;
  for(const option of q.options){
   if(typeof option?.text!=='string')continue;
   const fixed=stripExamFooter(option.text);
   if(fixed!==option.text)option.text=fixed;
  }
 }
 return state;
}

export function normalizeState(data){
  const base=fresh();
  if(!data || typeof data!=='object')return base;
  for(const k of Object.keys(base))if(Array.isArray(base[k])&&Array.isArray(data[k]))base[k]=data[k];
  if(data.tombstones&&typeof data.tombstones==='object')for(const k of Object.keys(base.tombstones))if(Array.isArray(data.tombstones[k]))base.tombstones[k]=[...new Set(data.tombstones[k].filter(x=>typeof x==='string'))];
  return repairImportedFooters(base);
}
export const textNorm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
export function codePart(s,def='XX'){const v=textNorm(s).replace(/[^A-Z0-9]/g,'');return v||def}
export const categories=[
  {match:/L[IÍ]NGUA PORTUGUESA|PORTUGU[EÊ]S/i,name:'Língua Portuguesa',code:'LP'},
  {match:/MATEM[AÁ]TICA/i,name:'Matemática',code:'MA'},
  {match:/RACIOC[IÍ]NIO L[OÓ]GICO/i,name:'Raciocínio Lógico',code:'RL'},
  {match:/INFORM[AÁ]TICA|TECNOLOGIA DA INFORMA[CÇ][AÃ]O/i,name:'Informática',code:'IN'},
  {match:/DIREITO ADMINISTRATIVO/i,name:'Direito Administrativo',code:'DA'},
  {match:/DIREITO CONSTITUCIONAL/i,name:'Direito Constitucional',code:'DC'},
  {match:/LEGISLA[CÇ][AÃ]O/i,name:'Legislação',code:'LE'},
  {match:/CONHECIMENTOS ESPEC[IÍ]FICOS/i,name:'Conhecimentos Específicos',code:'CE'},
  {match:/HIST[OÓ]RIA/i,name:'História',code:'HI'},
  {match:/GEOGRAFIA/i,name:'Geografia',code:'GE'},
  {match:/CI[EÊ]NCIAS/i,name:'Ciências',code:'CI'}
];
/**
 * Classificação conservadora: evidências claras no enunciado têm prioridade
 * sobre títulos de seção. Casos incertos continuam com classificação provisória.
 */
export function classify(stem,heading='',options=[]){
  const t=textNorm(stem),answerText=textNorm(options.map(o=>o.text).join(' '));
  let discipline='Não classificada',disciplineCode='NC',topic='Geral',topicCode='G',confidence='baixa';
  function choose(d,dc,subject,sc){
    discipline=d;disciplineCode=dc;topic=subject;topicCode=sc;confidence='alta';
  }
  if(/\b(RANSOMWARE|CRIPTOGRAFIA|RSA[- ]?2048|AES[- ]?256|HASH CRIPTOGRAFICO|CIFRA RSA|CHAVE PRIVADA DO RSA)\b/.test(t)){
    choose('Informática','IN','Segurança da informação','SI');
  }else if(/\b(DHCP|DNS|LDAP|TCP\/IP|ENDERECOS? IP|TOPOLOGIA|REDE DE COMPUTADORES|PROTOCOLO RESPONSAVEL|REDES DE COMPUTADORES)\b/.test(t)){
    choose('Informática','IN','Redes de computadores','RC');
  }else if(/\b(SISTEMA OPERACIONAL|WINDOWS 11|WINDOWS 10|LINUX|CENTOS|SYSTEMCTL|FIREWALLD|PERMISSOES DE UMA PASTA)\b/.test(t)){
    choose('Informática','IN','Sistemas operacionais','SO');
  }else if(/\b(VIRGULAS|PONTUACAO|CONCORDANCIA|REGENCIA|CRASE|ORTOGRAFIA|ACENTUACAO|ANALISE SINTATICA|ORA[CÇ]OES SUBORDINADAS)\b/.test(t)
      ||/EMPREGADAS NAS (?:TRES|TR[EÊ]S) PASSAGENS/.test(t)){
    choose('Língua Portuguesa','LP','Gramática','G');
  }else if(/\b(O EDITORIAL|O TEXTO|O AUTOR DO TEXTO|INTERPRETACAO DO TEXTO|IDEIA CENTRAL|PAISES[- ]MEMBROS DA ORGANIZACAO MUNDIAL)\b/.test(t)){
    choose('Língua Portuguesa','LP','Interpretação de texto','IT');
  }else if(/\b(RESOLUCAO\s*(?:N[Oº°.]*)?\s*\d+|CAMARA MUNICIPAL|DIRETORIA LEGISLATIVA|TERMOS DE POSSE DO PREFEITO|VEREADORES)\b/.test(t)){
    choose('Legislação','LE','Legislação institucional','LI');
  }else if(/\b(MEDIA ARITMETICA|PORCENTAGEM|PERCENTUAL|FRACOES|DENOMINADOR|EQUACAO|LOJA VENDE|VENDE ESTES|SEIS PRODUTOS|MATEMATICA FINANCEIRA)\b/.test(t)){
    choose('Matemática','MA','Geral','G');
    if(/\bMEDIA ARITMETICA\b/.test(t)) {topic='Média aritmética';topicCode='ME'}
    else if(/\b(PORCENTAGEM|PERCENTUAL)\b|%/.test(t)){topic='Porcentagem';topicCode='P'}
    else if(/\b(FRACOES|DENOMINADOR)\b/.test(t)){topic='Frações';topicCode='F'}
    else if(/\bEQUACAO\b/.test(t)){topic='Equações';topicCode='E'}
    else if(/\b(LOJA VENDE|VENDE ESTES|SEIS PRODUTOS)\b/.test(t)){topic='Problemas aritméticos';topicCode='PA'}
  }else if(/\b(EXCEL|PLANILHA ELETRONICA)\b/.test(t)){
    choose('Informática','IN','Planilhas eletrônicas','PE');
  }else {
    const match=categories.find(category=>category.match.test(heading));
    if(match){
      discipline=match.name;disciplineCode=match.code;confidence='média';
      if(disciplineCode==='LP'&&/\b(PARAGRAFO|PASSAGENS|TEXTO)\b/.test(t)){topic='Interpretação de texto';topicCode='IT'}
      if(disciplineCode==='MA'&&/%/.test(t)){topic='Porcentagem';topicCode='P'}
    }
  }
  // Detectores acima são indicativos, não uma garantia de classificação correta.
  return {discipline,disciplineCode,topic,topicCode,confidence};
}

/** Leitura tolerante a quebras de linha, marcas d'água e numeração de banca. */
/**
 * O gabarito Quadrix/CRQ-V 2026 define os blocos por número:
 * 1–15 Língua Portuguesa; 16–25 Raciocínio Lógico e Matemática;
 * 26–50 Conhecimentos Específicos de Analista de Informática.
 * A separação oficial prevalece sobre inferências de palavras-chave.
 */
export function classifyByExamDivision(q,meta,guessed){
 const n=Number(q.originalNumber),b=textNorm(meta?.banca),org=textNorm(meta?.orgao),title=textNorm(meta?.title);

 if(b==='FEPESE'&&org==='CIS-GRANFPOLIS'&&title.includes('AUXILIAR DE SERVICOS GERAIS')&&n>=1&&n<=35){
  const [discipline,disciplineCode,defaultTopic]=n<=5?['Língua Portuguesa','LP','Geral']:
    n<=10?['Conhecimentos Gerais','CG','Geral']:
    n<=15?['Higiene e Segurança no Trabalho','CE','Segurança no trabalho']:
    ['Conhecimentos específicos','CE','Serviços gerais'];
  const same=guessed.disciplineCode===disciplineCode;
  return {...guessed,discipline,disciplineCode,
   topic:same?guessed.topic:defaultTopic,
   topicCode:same?guessed.topicCode:'G',confidence:'alta'};
 }

 // FCPC / Câmara de Aracati: blocos declarados expressamente na capa.
 if(b==='FCPC'&&org==='CM-ARACATI'&&title.includes('AUXILIAR DE SERVICOS GERAIS')&&n>=1&&n<=50){
  const [discipline,disciplineCode]=n<=10?['Língua Portuguesa','LP']:
   n<=20?['Legislação','LE']:['Conhecimentos específicos','CE'];
  const same=guessed.disciplineCode===disciplineCode;
  return {...guessed,discipline,disciplineCode,
   topic:same?guessed.topic:'Geral',topicCode:same?guessed.topicCode:'G',
   confidence:'alta'};
 }
 if(b==='OBJETIVA'&&org==='PM-SOSSEGO'&&title.includes('AUXILIAR DE SERVICOS GERAIS')&&n>=1&&n<=40){
  const [discipline,disciplineCode]=n<=15?['Língua Portuguesa','LP']:n<=25?['Matemática','MA']:['Conhecimentos específicos','CE'];
  return {...guessed,discipline,disciplineCode,
   topic:guessed.disciplineCode===disciplineCode?guessed.topic:'Geral',
   topicCode:guessed.disciplineCode===disciplineCode?guessed.topicCode:'G',confidence:'alta'};
 }
 if(b==='LEGALLE'&&org==='CISCOPAR'&&title.includes('ANALISTA EM INFORMATICA')&&n>=1&&n<=50){
  const [discipline,disciplineCode,defaultTopic]=n<=10?['Língua Portuguesa','LP','Geral']:
   n<=13?['Matemática','MA','Geral']:
   n<=16?['Informática','IN','Geral']:
   n<=20?['Legislação','LE','Geral']:
   ['Informática','IN','Conhecimentos específicos'];
  const same=guessed.disciplineCode===disciplineCode;
  return {...guessed,discipline,disciplineCode,topic:same?guessed.topic:defaultTopic,
   topicCode:same?guessed.topicCode:'G',confidence:'alta'};
 }
 // VUNESP/UNESP: a prova nº 002 de Analista de Informática II possui
 // blocos oficiais de Português (1–10), Matemática e Raciocínio Lógico
 // (11–15), Legislação (16–20), Conhecimentos Específicos (21–40).
 // A seção do enunciado prevalece sobre palavras isoladas.
 if(b==='VUNESP'&&org==='UNESP'&&title.includes('ANALISTA DE INFORMATICA II')&&n>=1&&n<=40){
  const [discipline,disciplineCode,defaultTopic]=n<=10?['Língua Portuguesa','LP','Geral']:
    n<=15?['Raciocínio Lógico e Matemática','RL','Geral']:
    n<=20?['Legislação','LE','Geral']:
    ['Informática','IN','Conhecimentos específicos'];
  const same=guessed.disciplineCode===disciplineCode;
  return {...guessed,discipline,disciplineCode,
    topic:same?guessed.topic:defaultTopic,
    topicCode:same?guessed.topicCode:'G',confidence:'alta'};
 }
 // A própria prova FEPESE/Brusque S01 identifica os blocos por
 // disciplina e quantidade. A divisão oficial prevalece sobre palavras
 // do enunciado (a questão 1 reproduz uma lei, mas é de Português).
 if(b==='FEPESE'&&org==='PM-BRUSQUE'&&title.includes('ANALISTA DE INFORMATICA')&&n>=1&&n<=40){
  const [discipline,disciplineCode,defaultTopic]=n<=5?['Língua Portuguesa','LP','Geral']:
   n<=8?['Conhecimentos Gerais','CG','Geral']:
   n<=13?['Raciocínio Lógico','RL','Geral']:
   n<=20?['Legislação','LE','Legislação municipal']:
   ['Informática','IN','Conhecimentos específicos'];
  const preserveTopic=guessed.disciplineCode===disciplineCode;
  return {...guessed,discipline,disciplineCode,
   topic:preserveTopic?guessed.topic:defaultTopic,
   topicCode:preserveTopic?guessed.topicCode:'G',
   confidence:'alta'};
 }
 if(b!=='QUADRIX'||org!=='CRQ-V'||!title.includes('ANALISTA DE INFORMATICA')||n<1||n>50)return guessed;
 if(n<=15){
  const isGrammar=guessed.disciplineCode==='LP'&&guessed.topic==='Gramática';
  return {discipline:'Língua Portuguesa',disciplineCode:'LP',topic:isGrammar?'Gramática':'Interpretação de texto',topicCode:isGrammar?'G':'IT',confidence:'alta'};
 }
 if(n<=25)return {discipline:'Raciocínio Lógico e Matemática',disciplineCode:'RL',topic:guessed.disciplineCode==='MA'?guessed.topic:'Geral',topicCode:guessed.disciplineCode==='MA'?guessed.topicCode:'G',confidence:'alta'};
 return {...guessed,discipline:'Informática',disciplineCode:'IN',topic:guessed.disciplineCode==='IN'?guessed.topic:'Conhecimentos específicos',topicCode:guessed.disciplineCode==='IN'?guessed.topicCode:'CE',confidence:'alta'};
}

export function parseExamText(input){
  const lines=String(input||'').replace(/\r/g,'').split('\n');
  const questions=[];let current=null,heading='',sourcePage=null;
  const qre=/^(?:(?:QUEST[AÃ]O|QUESTAO|Q)\s*)?(\d{1,3})\s*[).:\-]\s*(.*)$/i;
  const are=/^\s*(?:\(([A-E])\)|([A-E])\s*[).:\-])\s*(.*)$/i;
  const cleanNoise=line=>line
    .replace(/\s*(?:www\.pciconcursos\.com\.br|pcimarkpci)(?:.*)?$/i,'')
    .replace(/\s*\b(?:CONFIDENCIAL ATE O MOMENTO DA APLICACAO|CONFIDENCIAL ATÉ O MOMENTO DA APLICAÇÃO)\b.*$/i,'')
    .replace(/\s*\bMDAwM[A-Za-z0-9+/=]{35,}.*$/,'').trim();
  const isNoise=line=>/^(?:R\s*A\s*S\s*C\s*U\s*N\s*H\s*O|RASCUNHO|WWW\.|PCIMARKPCI|MDAwM[A-Za-z0-9+/=]{30,}|CONFIDENCIAL AT[EÉ]|P[AÁ]GINA\s+\d+\s*(?:DE|\/)\s*\d+)$/i.test(line)
    ||/^\d{1,3}\s+CVOT\d+\s*\/.+(?:CONFIDENCIAL|APLICA[CÇ][AÃ]O)/i.test(line);
  const isHeading=line=>categories.some(cat=>cat.match.test(line))&&
    /^(?:CONHECIMENTOS\s+(?:B[AÁ]SICOS|ESPEC[IÍ]FICOS)\s*[-–:]?\s*)?(?:L[IÍ]NGUA PORTUGUESA|PORTUGU[EÊ]S|MATEM[AÁ]TICA|RACIOC[IÍ]NIO L[OÓ]GICO|INFORM[AÁ]TICA|TECNOLOGIA DA INFORMA[CÇ][AÃ]O|DIREITO ADMINISTRATIVO|DIREITO CONSTITUCIONAL|LEGISLA[CÇ][AÃ]O|CONHECIMENTOS ESPEC[IÍ]FICOS|HIST[OÓ]RIA|GEOGRAFIA|CI[EÊ]NCIAS)\s*$/i.test(line);
  function finish(){
    if(!current)return;
    current.stem=current.stem.join('\n').trim();
    current.options=current.options.filter(a=>a.text.trim()).map(a=>({...a,text:a.text.trim()}));
    if(current.stem||current.pageImage){
      const result={...current,...classify(current.stem,current.heading,current.options)};
      result.extractionReview=result.options.length<2||result.options.length>5||
        result.options.some(a=>/PCIMARKPCI|PCICONCURSOS|MDAwM[A-Za-z0-9+/=]{30,}/i.test(a.text));
      questions.push(result);
    }
  }
  for(let originalLine of lines){
    let line=originalLine.trim();
    if(!line)continue;
    // Uma marca 'RASCUNHO 19. Considere...' não pode ser anexada à alternativa E anterior.
    if(current&&current.options.length>=3){
      const embedded=line.match(/^(?:R\s*A\s*S\s*C\s*U\s*N\s*H\s*O|RASCUNHO)\s+(\d{1,3})\s*[.):-]\s*(.*)$/i);
      if(embedded&&Number(embedded[1])===current.originalNumber+1)line=embedded[1]+'. '+embedded[2];
    }
    line=cleanNoise(line);
    if(!line||isNoise(line))continue;
    const pageMarker=line.match(/^\[\[PAGE:(\d+)\]\]$/i);
    if(pageMarker){sourcePage=Number(pageMarker[1]);continue;}
    if(isHeading(line)){heading=line;continue}
    const qm=line.match(qre);
    if(qm){
      finish();current={originalNumber:Number(qm[1]),stem:[qm[2]||''],options:[],heading,sourcePage};
      continue;
    }
    if(!current)continue;
    const am=line.match(are);
    if(am){current.options.push({letter:am[1]||am[2],text:am[3]||''});continue}
    if(current.options.length)current.options.at(-1).text+='\n'+line;
    else current.stem.push(line);
  }
  finish();
  return questions.filter(q=>q.originalNumber>0);
}

/**
 * Mesmo texto-base na questão imediatamente anterior da seleção.
 * Não depende da numeração: sorteios podem colocar as questões em qualquer ordem.
 * Questões avulsas de provas diferentes nunca compartilham o mesmo bloco.
 */
export function repeatedSupportText(previous,current){
 if(!previous||!current||!String(previous.contextText||'').trim()||!String(current.contextText||'').trim())return false;
 if(previous.examId!==current.examId)return false;
 const sameText=String(previous.contextText).trim()===String(current.contextText).trim();
 const rangeA=(previous.contextRange||[]).join('-'),rangeB=(current.contextRange||[]).join('-');
 return sameText&&rangeA===rangeB;
}
export function parseKey(raw){
  const out={};const src=textNorm(raw);
  const re=/(\d{1,3})\s*(?:[.):-]\s*)?([A-E]|CERTO|ERRADO|C|E|ANULADA|ANULADO|X)/g;
  for(const m of src.matchAll(re)){
    let a=m[2];if(a==='CERTO')a='C';if(a==='ERRADO')a='E';if(['ANULADA','ANULADO','X'].includes(a))a='X';
    out[Number(m[1])]=a;
  }
  return out;
}
export function sameQuestion(a,b){
  const opts=q=>(q.options||[]).map(o=>textNorm(o.text)).sort().join('¶');
  // A mesma imagem precisa coincidir; não basta o tema.
  return textNorm(a.stem)===textNorm(b.stem)&&opts(a)===opts(b)&&String(a.pageImage||'')===String(b.pageImage||'');
}
export function makeCode(state,meta,q){
  const prefix='Q'+codePart(meta.year,'0000')+codePart(q.disciplineCode,'NC')+codePart(q.topicCode,'G')+codePart(meta.bancaCode||meta.banca,'BANCA')+codePart(meta.orgaoCode||meta.orgao,'ORGAO');
  let n=1;const used=new Set(state.questions.map(x=>x.code));
  while(used.has(prefix+n))n++;
  return prefix+n;
}
export function addExam(state,meta,parsed,key={}){
  const exam={id:newId(),title:meta.title||'Prova sem título',year:String(meta.year||''),banca:String(meta.banca||''),bancaCode:codePart(meta.bancaCode||meta.banca,'BANCA'),orgao:String(meta.orgao||''),orgaoCode:codePart(meta.orgaoCode||meta.orgao,'ORGAO'),createdAt:new Date().toISOString(),questionIds:[]};
  for(const item of parsed){
    const equivalent=state.questions.find(x=>sameQuestion(x,item));
    const q={...item,id:newId(),examId:exam.id,code:'',year:exam.year,banca:exam.banca,orgao:exam.orgao,answer:key[item.originalNumber]||'',status:key[item.originalNumber]==='X'?'annulled':item.extractionReview?'needs-review':'active',secondary:[],aliases:[],duplicateGroup:equivalent?.duplicateGroup||equivalent?.id||null};
    if(equivalent&&!equivalent.duplicateGroup)equivalent.duplicateGroup=equivalent.id;
    q.code=makeCode(state,exam,q);
    state.questions.push(q);exam.questionIds.push(q.id);
  }
  state.exams.push(exam);return exam;
}
/**
 * Reimportação segura de uma prova que já foi salva como imagens de página
 * inteira. Atualiza somente sua representação textual, preservando IDs,
 * códigos, respostas, tentativas, exclusões de alternativas e simulados.
 * Requer prova/cargo/gabarito e trechos dos enunciados compatíveis.
 */
export function upgradeRecoveredExam(state,meta,parsed,key={}){
 if(!parsed.length||parsed.every(q=>q.extractionFallback))return null;
 const matches=[];
 for(const exam of state.exams.filter(e=>e.title===meta.title&&e.questionIds?.length===parsed.length)){
  const oldRows=exam.questionIds.map(id=>state.questions.find(q=>q.id===id));
  if(oldRows.some(q=>!q||!q.extractionFallback||q.status!=='needs-review'||q.answer!==key[q.originalNumber]))continue;
  const byNumber=new Map(oldRows.map(q=>[q.originalNumber,q]));
  if(byNumber.size!==parsed.length||parsed.some(q=>!byNumber.has(q.originalNumber)))continue;
  const sameStem=parsed.filter(q=>{
   const old=byNumber.get(q.originalNumber);
   return old.sourcePage===q.sourcePage&&
    textNorm(old.stem).slice(0,120)===textNorm(q.stem).slice(0,120);
  }).length;
  if(sameStem<Math.ceil(parsed.length*.75))continue;
  matches.push({exam,oldRows,byNumber});
 }
 // Não alterar nenhuma prova quando houver ambiguidade entre cadernos.
 if(matches.length!==1)return null;
 const {exam,byNumber}=matches[0];
 const backups=[];
 for(const item of parsed){
  const old=byNumber.get(item.originalNumber);
  const index=state.questions.findIndex(q=>q.id===old.id);
  backups.push({index,question:old});
  const {pageImage:_pageImage,imageError:_imageError,
   extractionFallback:_extractionFallback,visualSegments:_visualSegments,...base}=old;
  const updated={...base,...item,id:old.id,examId:old.examId,
   code:old.code,answer:old.answer,year:old.year,banca:old.banca,
   orgao:old.orgao,status:item.extractionReview?'needs-review':'active'};
  if(!updated.imageOnly)delete updated.pageImage;
  state.questions[index]=updated;
 }
 return {exam,upgraded:parsed.filter(q=>!q.extractionFallback).length,
  rollback:()=>{for(const {index,question} of backups)state.questions[index]=question;}};
}

/** Não cadastrar novamente um caderno idêntico já importado. */
export function findPreviouslyImportedExam(state,meta,parsed,key={}){
 return state.exams.find(exam=>{
  if(exam.title!==meta.title||exam.questionIds.length!==parsed.length)return false;
  const old=exam.questionIds.map(id=>state.questions.find(q=>q.id===id));
  if(old.some(q=>!q)||old.length!==parsed.length)return false;
  const byNumber=new Map(old.map(q=>[q.originalNumber,q]));
  return byNumber.size===parsed.length&&parsed.every(q=>{
   const prior=byNumber.get(q.originalNumber);
   return prior&&prior.answer===key[q.originalNumber]&&
    textNorm(prior.stem)===textNorm(q.stem)&&
    (prior.options||[]).length===(q.options||[]).length&&
    (prior.options||[]).every((o,i)=>o.letter===q.options[i].letter&&
     textNorm(o.text)===textNorm(q.options[i].text));
  });
 })||null;
}

export function validAnswer(answer){return /^[A-E]$/.test(String(answer||'').toUpperCase())}
export function latestAnswer(state,profileId,questionId){
  for(let i=state.attempts.length-1;i>=0;i--){
    const a=state.attempts[i];
    if(a.profileId===profileId&&a.questionId===questionId&&validAnswer(a.answer))return a;
  }
  return null;
}
export function outcome(state,profileId,q){
  if(q.status==='annulled')return'annulled';
  if(q.status==='outdated')return'outdated';
  const a=latestAnswer(state,profileId,q.id);
  if(!a)return'unanswered';
  if(!validAnswer(q.answer))return'no-key';
  return a.answer===q.answer?'correct':'wrong';
}
export function recordAttempt(state,profileId,qid,answer,simId=''){
  if(!validAnswer(answer))return false;
  state.attempts.push({id:newId(),profileId,questionId:qid,answer,simulationId:simId,at:new Date().toISOString()});return true;
}
export function stats(state,profileId){
  const items=state.questions.filter(q=>q.status==='active');
  const done=items.map(q=>({q,r:outcome(state,profileId,q)})).filter(x=>x.r==='correct'||x.r==='wrong');
  const correct=done.filter(x=>x.r==='correct').length,wrong=done.length-correct;
  const group=(kind)=>{
    const map=new Map();
    for(const {q,r} of done){
      const values=kind==='discipline'?[q.discipline,...(q.secondary||[]).map(s=>s.discipline)]:[[q.discipline,q.topic].join(' / '),...(q.secondary||[]).map(s=>[s.discipline,s.topic].join(' / '))];
      for(const value of new Set(values)){
        const item=map.get(value)||{name:value,correct:0,wrong:0,total:0};
        item.total++;item[r]++;map.set(value,item);
      }
    }
    return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  };
  return {total:done.length,correct,wrong,rate:done.length?correct/done.length*100:0,byDiscipline:group('discipline'),byTopic:group('topic')};
}
/**
 * Filtro inclusivo: uma ou várias situações podem ser selecionadas.
 * Nenhuma seleção significa todas; aceita também o formato antigo
 * "outcome" (seleção única) para manter compatibilidade.
 */
export function normalizeOutcomeSelection(filters={}){
 const raw=Array.isArray(filters.outcomes)?filters.outcomes:
  typeof filters.outcomes==='string'?filters.outcomes.split(','):
  filters.outcome&&filters.outcome!=='all'?[filters.outcome]:[];
 const allowed=new Set(['unanswered','wrong','correct']);
 return [...new Set(raw.filter(v=>allowed.has(v)))];
}
export function filtered(state,profileId,f={}){
  const selectedOutcomes=normalizeOutcomeSelection(f);
  let result=state.questions.filter(q=>{
    if(f.examId&&q.examId!==f.examId)return false;
    if(f.year&&q.year!==f.year)return false;
    if(f.banca&&q.banca!==f.banca)return false;
    if(f.orgao&&q.orgao!==f.orgao)return false;
    if(f.code&&![q.code,...(q.aliases||[])].some(c=>c.includes(f.code.toUpperCase())))return false;
    const types=[{discipline:q.discipline,topic:q.topic},...(q.secondary||[])];
    if(f.discipline&&!types.some(x=>x.discipline===f.discipline))return false;
    if(f.topic&&!types.some(x=>x.topic===f.topic))return false;
    if(f.status&&f.status!=='all'&&q.status!==f.status)return false;
    if(!f.status&&q.status!=='active')return false;
    if(selectedOutcomes.length&&!selectedOutcomes.includes(outcome(state,profileId,q)))return false;
    return true;
  });
  return result;
}
export function prioritize(state,profileId,qs){
  const shuffled=[...qs];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
  return shuffled.sort((a,b)=>{
    const rank=q=>{const r=outcome(state,profileId,q);return r==='unanswered'?0:r==='wrong'?1:2};
    return rank(a)-rank(b);
  });
}
export function createSimulation(state,profileId,questions,options={}){
  const now=new Date(),examId=options.examId||'';
  const sim={id:newId(),profileId,examId,kind:options.kind||'random',createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+30*86400000).toISOString(),status:'pending',questionIds:questions.map(q=>q.id),answers:{},finishedAt:null};
  state.simulations.push(sim);return sim;
}
export function finishSimulation(state,sim){
  if(sim.status!=='pending')return;
  sim.status='finished';sim.finishedAt=new Date().toISOString();
  for(const qid of sim.questionIds)recordAttempt(state,sim.profileId,qid,sim.answers[qid],sim.id);
}
export function simulationResult(state,sim){
  let correct=0,wrong=0,blank=0,annulled=0;
  for(const id of sim.questionIds){
    const q=state.questions.find(q=>q.id===id);
    if(!q)continue;
    if(q.status==='annulled'||q.status==='outdated'){annulled++;continue}
    const answer=sim.answers[id];
    if(!validAnswer(answer)){blank++;continue}
    if(answer===q.answer)correct++;else wrong++;
  }
  const answered=correct+wrong;
  return {correct,wrong,blank,annulled,answered,total:sim.questionIds.length,rate:answered?correct/answered*100:0};
}
export function expire(state){
  const now=Date.now();
  for(const sim of state.simulations)if(sim.status==='pending'&&new Date(sim.expiresAt).getTime()<now){sim.status='expired';sim.answers={};}
}

/**
 * Extrai informações de identificação da capa, cabeçalho e nomes dos PDFs.
 * Nunca supõe banca/órgão/ano sem encontrar indícios textuais.
 * Dados ausentes usam NI/0000 e são marcados para conferência.
 */
/**
 * O preenchimento manual é alternativa segura quando os PDFs não expõem
 * banca/órgão/ano como texto. Não altera metadados já reconhecidos.
 * A verificação de questões e gabarito continua obrigatória.
 */
export function completeExamMetadata(inferred,manual={},currentYear=new Date().getFullYear()){
 const meta={...inferred,missing:[...(inferred.missing||[])]};
 const extra=String(meta.title||'').split(' — ').slice(3).join(' — ');
 for(const [prop,label] of [['year','ano'],['banca','banca'],['orgao','órgão']]){
  const raw=String(manual?.[prop]||'').trim();
  if(!raw)continue;
  if(!meta.missing.includes(label))continue;
  if(prop==='year'){
   if(!/^\d{4}$/.test(raw)||+raw<1980||+raw>currentYear+2)
    throw Error('Ano informado inválido. Use quatro dígitos (1980 até '+(currentYear+2)+').');
  }else if(raw.length<2||raw.length>70||!/^[\p{L}\d .()_\/–-]+$/u.test(raw))
   throw Error('Informe um nome válido para '+label+' (2 a 70 caracteres).');
  meta[prop]=prop==='year'?raw:textNorm(raw);
  meta.missing=meta.missing.filter(x=>x!==label);
 }
 meta.title=[
  meta.year==='0000'?'Ano não identificado':meta.year,
  meta.banca==='NI'?'Banca não identificada':meta.banca,
  meta.orgao==='NI'?'Órgão não identificado':meta.orgao,
  extra||'Prova importada'
 ].join(' — ');
 return meta;
}
export function inferExamMetadata(examText='',examFilename='',keyText='',keyFilename=''){
 const filename=String(examFilename||''),head=String(examText||'').slice(0,7000);
 const keyHead=String(keyText||'').slice(0,1300);
 const raw=[filename,head,String(keyFilename||''),keyHead].join('\n');
 const source=textNorm(raw);
 const preferredYear=textNorm(filename+' '+head.slice(0,1500)+' '+keyHead);
 const years=[...preferredYear.matchAll(/\b(?:19|20)\d{2}\b/g)].map(x=>x[0]);
 const year=years.find(x=>Number(x)>=1980&&Number(x)<=new Date().getFullYear()+2)||'0000';
 const bancas=[
  ['CEBRASPE',/\bCEBRASPE\b|\bCESPE\b/],
  ['IBGP',/\bIBGP\b|INSTITUTO BRASILEIRO DE GESTAO E PESQUISA/],
  ['VUNESP',/\bVUNESP\b|FUNDACAO VUNESP|\bVNSP\d{3,}(?:\b|\/)/],
  ['FGV',/\bFGV\b|FUNDACAO GETULIO VARGAS/],
  ['FCC',/\bFCC\b|FUNDACAO CARLOS CHAGAS/],
  ['IBFC',/\bIBFC\b|INSTITUTO BRASILEIRO DE FORMACAO E CAPACITACAO/],
  ['IDCAP',/\bIDCAP\b/],
  ['FUNDEP',/\bFUNDEP\b/],
  ['CONSULPLAN',/\bCONSULPLAN\b/],
  ['AOCP',/\bAOCP\b/],
  ['IBADE',/\bIBADE\b/],
  ['IDECAN',/\bIDECAN\b/],
  ['QUADRIX',/\bQUADRIX\b/],
  ['FEPESE',/\bFEPESE\b/],
  ['FCPC',/\bFCPC\b|FUNDACAO CEARENSE DE PESQUISA E CULTURA/],
  ['LEGALLE',/\bLEGALLE\b|ELEGGLL|LEGALLE\s+CONCURSOS/],
  ['OBJETIVA',/\bOBJETIVA\s+(?:CONCURSOS|INSTITUTO)\b|\bOBJETIVAS?\.COM\.BR\b|\bCONCURSOS\.OBJETIVAS\.COM\.BR\b/],
  ['UNOCHAPECO',/\bUNOCHAPECO\b/],
  ['FURB',/\bFURB\b/],
  ['FAUEL',/\bFAUEL\b/]
 ];
 const orgaos=[
  ['CRQ-V',/CONSELHO REGIONAL DE QUIMICA DA 5(?:A|ª) REGIAO|\bCRQ\s*[-–]?\s*V\b/],
  ['PM-BRUSQUE',/\bMUNICIPIO DE BRUSQUE\b|\bPREFEITURA MUNICIPAL DE BRUSQUE\b/],
  ['CISCOPAR',/\bCISCOPAR\b|CONSORCIO INTERMUNICIPAL DE SAUDE COSTA OESTE DO PARANA/],
  ['CIS-GRANFPOLIS',/CONSORCIO PUBLICO INTERFEDERATIVO DE SAUDE DA REGIAO DA GRANDE FLORIANOPOLIS|2026CPCISGRANFPOLIS|\bCISGRANFPOLIS\b/],
  ['PM-SOSSEGO',/\bMUNICIPIO DE SOSSEGO\b|\bPREFEITURA MUNICIPAL DE SOSSEGO\b/],
  ['CMVOTORANTIM',/CAMARA MUNICIPAL DE VOTORANTIM/],
  ['CM-ARACATI',/\bCAMARA MUNICIPAL DE ARACATI\b/],
  ['SEMUSA',/\bSEMUSA\b|SECRETARIA MUNICIPAL DE SAUDE/],
  ['SEMED',/\bSEMED\b|SECRETARIA MUNICIPAL DE EDUCACAO/],
  ['SEDUC',/\bSEDUC\b|SECRETARIA DE ESTADO DA EDUCACAO/],
  ['IFRO',/\bIFRO\b|INSTITUTO FEDERAL DE RONDONIA/],
  ['ALE-RO',/\bALE[\s-]?RO\b|ASSEMBLEIA LEGISLATIVA DO ESTADO DE RONDONIA/],
  ['TJRO',/\bTJ[\s-]?RO\b|TRIBUNAL DE JUSTICA DO ESTADO DE RONDONIA/],
  ['MPRO',/\bMP[\s-]?RO\b|MINISTERIO PUBLICO DO ESTADO DE RONDONIA/],
  ['TCE-RO',/\bTCE[\s-]?RO\b|TRIBUNAL DE CONTAS DO ESTADO DE RONDONIA/],
  ['CMPV',/\bCMPV\b|CAMARA MUNICIPAL DE PORTO VELHO/],
  ['IPAM',/\bIPAM\b/],
  ['UNESP',/\bUNESP\b|UNIVERSIDADE ESTADUAL PAULISTA/],
  ['UERN',/\bUERN\b/],
  ['IFSP',/\bIFSP\b/]
 ];
 const find=items=>items.find(([,p])=>p.test(source))?.[0]||'NI';
 const banca=find(bancas),orgao=find(orgaos);
 const missing=[...(year==='0000'?['ano']:[]),...(banca==='NI'?['banca']:[]),...(orgao==='NI'?['órgão']:[])];
 const basename=filename.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().slice(0,90);
 const namedCargo=source.match(/ANALISTA (?:DE|EM) IN\s*FORMATICA(?:\s+II)?/);
 const areaLine=String(head||'').split('\n').find(x=>/^[\s\t]*(?:[ÁA]REA DE ATUA[CÇ][AÃ]O\s*:\s*)/i.test(x));
 let area=areaLine?textNorm(areaLine.split(/:\s*/).slice(1).join(':')).slice(0,85):'';
 // Títulos centralizados atravessam as duas colunas do leitor PDF.
 // Quando o nome do arquivo repete o começo da área identificada,
 // recuperar a expressão completa sem adivinhar outras palavras.
 const fileJob=textNorm(filename.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').replace(/\s*\(\d+\)\s*$/,''));
 const fileArea=fileJob.match(/\bANALISTA DE INFORMATICA II\s+([A-Z0-9 ]{6,90})$/)?.[1]?.trim()||'';
 if(area&&fileArea.startsWith(area)&&fileArea.length>area.length)area=fileArea.slice(0,85);
 const cargo=namedCargo?(namedCargo[0].endsWith(' II')?'Analista de Informática II':/ANALISTA EM/.test(namedCargo[0])?'Analista em Informática':'Analista de Informática')+
   (area?' — '+area.toLocaleLowerCase('pt-BR'):''):
   /AUXILIAR DE SERVICOS GERAIS/.test(textNorm(filename+'\n'+head))?'Auxiliar de Serviços Gerais':basename||'Prova importada';
 const title=[year==='0000'?'Ano não identificado':year,banca==='NI'?'Banca não identificada':banca,orgao==='NI'?'Órgão não identificado':orgao,cargo].join(' — ');
 return {title,year,banca,orgao,missing};
}
