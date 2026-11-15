/**
 * Adaptação automática com fatos normativos controlados.
 * Este módulo NÃO troca nomes de cidade nem depende de uma decisão
 * não auditável da IA para definir a alternativa correta.
 * Fontes primárias oficiais; ampliar o catálogo somente após conferir a norma.
 */
import {isLocalLegislation,STUDY_CONTEXT,studyEligibility} from './study-context.mjs';
const statute173='https://athus4.candeiasdojamari.ro.leg.br/transparencia/documento/ver/25935D61EE0A1BFB7E6F55E9168A5A42D2BE25A6/';
const leiOrganica='https://www.candeiasdojamari.ro.leg.br/leis/lei-organica-municipal/lei-organica-do-municipio-de-candeias-do-jamari/at_download/file';
export const LEGAL_CATALOG_REVISION=1;
const entry=(id,matcher,question,correct,distractors,law,article,reason,sourceUrl)=>({
 id,matcher,question,correct,distractors,law,article,reason,sourceUrl
});
export const LEGAL_FACTS=[
 entry('investidura',/\bINVESTIDURA\b|\bPOSSE\b/,
  'Segundo a Resolução nº 173/CMCJ/2025, como se dá a investidura em cargo público na Câmara Municipal de Candeias do Jamari?',
  'Com a posse.',
  ['Com a mera inscrição no concurso.','Com a homologação da inscrição.','Com a publicação do edital.','Com a aprovação na prova objetiva.'],
  'Resolução nº 173/CMCJ/2025','Art. 4º',
  'O artigo 4º estabelece que a investidura em cargo público ocorre com a posse; aprovação ou nomeação não substituem esse ato.',statute173),
 entry('formas-provimento',/\bFORMAS? DE PROVIMENTO\b|\bMODALIDADES? DE PROVIMENTO\b|\bREVERS[ÃA]O\b|\bRECONDU[CÇ][ÃA]O\b|\bREINTEGRA[CÇ][ÃA]O\b/,
  'Qual conjunto contém somente formas de provimento previstas no artigo 5º da Resolução nº 173/CMCJ/2025?',
  'Nomeação, readaptação e reintegração.',
  ['Exoneração, demissão e vacância.','Licitação, dispensa e inexigibilidade.','Aposentadoria, demissão e exoneração.','Contratação verbal, indicação e estágio.'],
  'Resolução nº 173/CMCJ/2025','Art. 5º',
  'O artigo 5º enumera, entre outras, nomeação, readaptação, reversão, aproveitamento, reintegração e recondução como formas de provimento.',statute173),
 entry('prazo-concurso',/\bVALIDADE\b.{0,45}\bCONCURSO\b|\bCONCURSO\b.{0,45}\bVALIDADE\b|\bPRORROGA[CÇ][ÃA]O\b.{0,45}\bCONCURSO\b/,
  'De acordo com a Resolução nº 173/CMCJ/2025, qual é o prazo de validade do concurso público da Câmara Municipal de Candeias do Jamari?',
  'Dois anos, prorrogável uma única vez por igual período.',
  ['Um ano, sem prorrogação.','Três anos, prorrogável por mais dois.','Quatro anos, sem prorrogação.','Prazo indeterminado até o provimento das vagas.'],
  'Resolução nº 173/CMCJ/2025','Art. 7º',
  'O artigo 7º prevê validade de dois anos e permite uma única prorrogação por período igual.',statute173),
 entry('admissao-concurso',/\bCONCURSO\b.{0,35}\b(PROVAS|T[IÍ]TULOS)\b|\bADMISS[ÃA]O DE PESSOAL\b/,
  'Conforme o artigo 6º da Resolução nº 173/CMCJ/2025, como deve ocorrer a admissão de pessoal da Câmara Municipal de Candeias do Jamari?',
  'Por concurso público de provas ou de provas e títulos, conforme a natureza e complexidade do cargo.',
  ['Por simples indicação da Mesa Diretora para cargos efetivos.','Por sorteio entre candidatos previamente inscritos.','Por entrevista sem concurso para todos os cargos.','Por contratação direta de caráter permanente, sem edital.'],
  'Resolução nº 173/CMCJ/2025','Art. 6º',
  'O artigo 6º determina concurso público de provas ou de provas e títulos conforme o cargo ou especialidade.',statute173),
 entry('lotacao',/\bLOTA[CÇ][ÃA]O\b|\bREMANEJAMENTO\b|\bREMANEJAR\b/,
  'Segundo a Resolução nº 173/CMCJ/2025, quem define a lotação dos servidores da Câmara Municipal de Candeias do Jamari?',
  'A Mesa Diretora, conforme a necessidade dos setores da Câmara.',
  ['Exclusivamente o prefeito, sem participação da Câmara.','O candidato aprovado, por escolha pessoal obrigatória.','O Tribunal de Contas, em decisão individual.','A comissão de concurso, permanentemente.'],
  'Resolução nº 173/CMCJ/2025','Art. 17',
  'O artigo 17 atribui à Mesa Diretora a definição da lotação conforme as necessidades dos setores.',statute173),
 entry('treinamento',/\bTREINAMENTOS?\b|\bCAPACITA[CÇ][ÃA]O\b.{0,28}\bSERVIDORES\b/,
  'De acordo com a Resolução nº 173/CMCJ/2025, quando o Poder Legislativo de Candeias do Jamari deve promover treinamentos para seus servidores?',
  'Quando for verificada a necessidade de melhor capacitá-los para suas funções.',
  ['Somente quando um servidor completar dez anos de exercício.','Exclusivamente antes da posse, sem treinamento posterior.','Apenas quando houver imposição do Tribunal de Contas.','Somente após todos os servidores alcançarem o último nível da carreira.'],
  'Resolução nº 173/CMCJ/2025','Art. 16',
  'O artigo 16 prevê treinamentos quando se verificar a necessidade de qualificação para o desempenho das funções.',statute173),
 entry('pagamento',/\bPAGAMENTO\b.{0,65}\bREMUNERA[CÇ][ÃA]O\b|\bREMUNERA[CÇ][ÃA]O MENSAL\b|\bDIA [ÚU]TIL\b.{0,35}\bM[EÊ]S\b/,
  'Nos termos da Resolução nº 173/CMCJ/2025, até quando deve ocorrer o pagamento da remuneração mensal dos servidores da Câmara Municipal de Candeias do Jamari?',
  'Até o último dia útil do mês trabalhado.',
  ['Até o décimo dia útil do segundo mês seguinte.','Apenas no último dia útil de cada trimestre.','Até 45 dias após o encerramento do mês trabalhado.','Somente após a aprovação das contas anuais.'],
  'Resolução nº 173/CMCJ/2025','Art. 26',
  'O artigo 26 determina o pagamento da remuneração mensal até o último dia útil do próprio mês trabalhado.',statute173),
 entry('quadro-pessoal',/\bQUADRO DE CARGOS\b|\bCARGOS DE PROVIMENTO\b|\bQUADRO EFETIVO\b/,
  'Conforme o artigo 2º da Resolução nº 173/CMCJ/2025, quais são os componentes do quadro de cargos da Câmara Municipal de Candeias do Jamari?',
  'Cargos de provimento efetivo e cargos em comissão e funções gratificadas.',
  ['Somente cargos temporários e terceirizados.','Exclusivamente cargos eletivos e militares.','Somente cargos em comissão, sem cargos efetivos.','Apenas servidores cedidos por órgãos federais.'],
  'Resolução nº 173/CMCJ/2025','Art. 2º, incisos I e II',
  'O artigo 2º distingue o quadro de provimento efetivo do quadro de cargos em comissão e funções gratificadas.',statute173),
 entry('emenda-lei-organica',/\bEMENDA\b.{0,40}\bLEI ORG[AÂ]NICA\b|\bREFORMA\b.{0,30}\bLEI ORG[AÂ]NICA\b/,
  'Como se aprova uma proposta de emenda à Lei Orgânica de Candeias do Jamari, segundo o artigo 63?',
  'Em dois turnos, com intervalo mínimo de dez dias e aprovação por dois terços em cada votação.',
  ['Em turno único e por maioria simples.','Em dois turnos no mesmo dia e por maioria simples.','Por decreto exclusivo do prefeito.','Por consulta à Mesa Diretora, sem votação da Câmara.'],
  'Lei Orgânica do Município de Candeias do Jamari','Art. 63',
  'O artigo 63 exige dois turnos de votação, interstício mínimo de dez dias e votos de dois terços dos membros da Câmara em ambos.',leiOrganica),
 entry('iniciativa-popular',/\bINICIATIVA POPULAR\b|\bPROJETO\b.{0,45}\bELEITORES\b|\bCINCO POR CENTO\b.{0,30}\bELEITORES\b/,
  'Qual é o percentual mínimo de eleitores exigido para apresentar projeto de lei de iniciativa popular municipal, conforme o artigo 65, § 2º, da Lei Orgânica de Candeias do Jamari?',
  'Cinco por cento dos eleitores inscritos no âmbito municipal.',
  ['Um por cento dos eleitores do Estado de Rondônia.','Dez por cento dos vereadores da Câmara.','Vinte por cento dos eleitores de cada bairro.','Metade mais um dos eleitores inscritos no município.'],
  'Lei Orgânica do Município de Candeias do Jamari','Art. 65, § 2º',
  'A Lei Orgânica prevê projeto de iniciativa popular subscrito por pelo menos cinco por cento dos eleitores inscritos no município.',leiOrganica)
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function shortCode(s){return norm(s).replace(/[^A-Z0-9]/g,'').slice(0,15)||'X'}
function stableNumber(id){let n=0;for(const c of String(id))n=(n*31+c.charCodeAt(0))>>>0;return n}
export function matchingLegalFact(q){
 if(!q||q.originalQuestionId)return null;
 const stem=norm(q.stem||'');
 const hits=LEGAL_FACTS.filter(rule=>rule.matcher.test(stem));
 // Havendo múltiplas regras plausíveis, recusa uma adaptação ambígua.
 if(hits.length!==1)return null;
 return hits[0];
}
export function makeAutoAdaptation(original,fact){
 if(!original?.id||!fact)throw Error('Adaptação exige questão e fundamento legal.');
 const seed=stableNumber(original.id),correctIndex=seed%5;
 const values=[...fact.distractors];
 values.splice(correctIndex,0,fact.correct);
 const letters='ABCDE';
 const answer=letters[correctIndex];
 const id='cj-'+original.id;
 const code='Q'+shortCode(original.year||'2026')+'LE'+shortCode(original.topicCode||'G')+
   shortCode(original.banca||'BANCA')+'CMCJ'+(seed%10000000).toString().padStart(7,'0');
 return {
  id,code,examId:original.examId,
  originalQuestionId:original.id,originalNumber:original.originalNumber,
  year:original.year||'2026',banca:original.banca,orgao:'CMCJ',
  discipline:'Legislação',disciplineCode:'LE',
  topic:'Legislação municipal — '+fact.id.replaceAll('-',' '),topicCode:original.topicCode||'LI',
  stem:fact.question,options:values.map((text,i)=>({letter:letters[i],text})),answer,
  contextText:'',secondary:[],aliases:[],imageOnly:false,pageImage:null,
  status:'active',confidence:'alta',duplicateGroup:'candeias-'+fact.id,
  adaptation:{
   target:STUDY_CONTEXT.id,autoGenerated:true,revision:LEGAL_CATALOG_REVISION,
   sourceQuestionId:original.id,sourceUrl:fact.sourceUrl,
   sourceArticle:fact.article,law:fact.law,legalReason:fact.reason,
   verifiedAnswer:answer,factId:fact.id
  }
 };
}
export function appendAutomaticAdaptations(state){
 if(!state||!Array.isArray(state.questions)||!Array.isArray(state.exams))throw Error('Banco inválido.');
 const examById=new Map(state.exams.map(e=>[e.id,e]));
 const added=[];const currentIds=new Set(state.questions.map(q=>q.id));
 for(const q of [...state.questions]){
  if(q.originalQuestionId||!isLocalLegislation(q,examById.get(q.examId)))continue;
  if(q.status!=='active'||studyEligibility(q,examById.get(q.examId),'candeias').allowed)continue;
  const fact=matchingLegalFact(q);
  if(!fact)continue;
  const adapted=makeAutoAdaptation(q,fact);
  if(currentIds.has(adapted.id)||state.questions.some(x=>x.code===adapted.code))continue;
  state.questions.push(adapted);currentIds.add(adapted.id);added.push(adapted);
 }
 return added;
}
