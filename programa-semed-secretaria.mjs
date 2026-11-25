/**
 * SEMED Porto Velho — Edital 24/2026, Anexo IV, Retificação 01.
 * Cargo 343 — Agente de Secretaria Escolar (págs. 1–2).
 * Índice temático de referência; não altera enunciados nem gabaritos.
 */
import {PROGRAM_PROFESSOR} from './programa-semed-professor.mjs';
export const SECRETARIA_CARGO_ID='343';
const common=id=>PROGRAM_PROFESSOR.sections.find(section=>section.id===id);
export const PROGRAM_SECRETARIA=Object.freeze({
 id:SECRETARIA_CARGO_ID,
 cargoCode:SECRETARIA_CARGO_ID,
 cargo:'Agente de Secretaria Escolar',
 level:'Ensino médio',
 edital:'SEMED Porto Velho/RO — Edital nº 24/2026, Retificação nº 01',
 annex:'Anexo IV — Conteúdos Programáticos, Retificação nº 01',
 pages:'1–2',
 sections:[
  {id:'portugues',title:'Língua Portuguesa',pages:'1',
   topics:[...common('portugues').topics,
    'Figuras de sintaxe e figuras de linguagem',
    'Articulação textual: operadores sequenciais e expressões referenciais',
    'Verbos: conjugação, vozes, tempos e modos; concordância e regência',
    'Variação linguística, significação de palavras e colocação pronominal']},
  {id:'raciocinio',title:'Raciocínio Lógico',pages:'1',
   topics:[...common('raciocinio').topics]},
  {id:'gerais',title:'Conhecimentos Gerais e Atualidades',pages:'1',
   topics:[...common('gerais').topics]},
  {id:'legislacao',title:'Legislação',pages:'2',topics:[
   'Lei Orgânica do Município de Porto Velho/RO e atualizações',
   'Regime Jurídico dos Servidores Públicos Municipais — Lei nº 385/2010',
   'Plano de Carreira e Remuneração dos Profissionais da Educação — Leis nº 360/2009 e nº 391/2010',
   'Lei Brasileira de Inclusão da Pessoa com Deficiência — Lei nº 13.146/2015',
   'Constituição Federal: princípios fundamentais, direitos e garantias (arts. 5º a 13)',
   'Constituição Federal: municípios (arts. 29 a 31) e Administração Pública (arts. 37 a 39)',
   'Licitações e contratos administrativos — Lei nº 14.133/2021',
   'Acesso à Informação — Lei nº 12.527/2011 e normas estaduais e municipais']},
  {id:'especificos',title:'Conhecimentos Específicos — Secretaria Escolar',pages:'2',topics:[
   'Conceitos de arquivamento e arquivo escolar',
   'Administração de materiais',
   'Gestão e organização dos documentos escolares; prazo de guarda e conservação preventiva',
   'Educação brasileira na Constituição Federal',
   'Lei de Diretrizes e Bases da Educação Nacional — LDB, Lei nº 9.394/1996: princípios e fins',
   'Estatuto da Criança e do Adolescente — ECA, Lei nº 8.069/1990',
   'Diretrizes Curriculares Nacionais para a Educação Básica e Plano Municipal de Educação',
   'Projeto Político-Pedagógico (PPP)',
   'Importância e atribuições do secretário escolar',
   'Planejamento e suprimento de materiais; recursos, classificação e armazenamento',
   'Patrimônio escolar, gestão ambiental e sustentabilidade',
   'Processo de desenvolvimento humano',
   'Relações e práticas educativas',
   'Relações interpessoais na escola',
   'Legislação escolar',
   'Sistemas de gestão escolar'
  ]}
 ]
});
export const SECRETARIA_LEGAL_RULES=Object.freeze([
 /LEI ORGANICA(?: DO MUNICIPIO)?(?: DE PORTO VELHO)?|LEI ORGANICA MUNICIPAL/,
 /\b385(?:\s|\.|\/)*2010\b|REGIME JURIDICO DOS SERVIDORES|ESTATUTO DOS SERVIDORES MUNICIPAIS/,
 /\b360(?:\s|\.|\/)*2009\b|\b391(?:\s|\.|\/)*2010\b|PLANO DE CARREIRA.*EDUCACAO|PCCR.*EDUCACAO/,
 /\b13\s*146\b|LEI BRASILEIRA DE INCLUSAO|ESTATUTO DA PESSOA COM DEFICIENCIA/,
 /PRINCIPIOS FUNDAMENTAIS|DIREITOS E GARANTIAS FUNDAMENTAIS|ART(?:IGO)?S?\s*(?:5|6|7|8|9|10|11|12|13)\b/,
 /ADMINISTRACAO PUBLICA|SERVIDOR PUBLICO|ART(?:IGO)?S?\s*(?:29|29 A|30|31|37|38|39)\b|COMPETENCIAS DOS MUNICIPIOS/,
 /\b14\s*133\b|LICITACOES|CONTRATOS ADMINISTRATIVOS|PREGAO/,
 /\b12\s*527\b|LEI DE ACESSO A INFORMACAO|TRANSPARENCIA ATIVA|TRANSPARENCIA PASSIVA/
]);
export const SECRETARIA_SPECIFIC_RULES=Object.freeze([
 /ARQUIVAMENTO|ARQUIVOS? ESCOLARES|ARQUIVO PERMANENTE|ARQUIVO CORRENTE|ARQUIVO INTERMEDIARIO/,
 /ADMINISTRACAO DE MATERIAIS|ALMOXARIFADO|GESTAO DE ESTOQUE/,
 /DOCUMENTOS? ESCOLARES|PRAZO DE GUARDA|CONSERVACAO PREVENTIVA|PROTOCOLO DE DOCUMENTOS|GESTAO DOCUMENTAL|HISTORICO ESCOLAR|LIVRO DE MATR[IÍ]CULA|ATA DE RESULTADOS|TRANSFERENCIA ESCOLAR/,
 /ART(?:IGO)?S? 205|ART(?:IGO)?S? 206|ART(?:IGO)?S? 208|EDUCACAO NA CONSTITUICAO|DIREITO CONSTITUCIONAL A EDUCACAO/,
 /\bLDB\b|\b9\s*394\b|LEI DE DIRETRIZES E BASES/,
 /\bECA\b|ESTATUTO DA CRIANCA E DO ADOLESCENTE|\b8\s*069\b/,
 /DIRETRIZES CURRICULARES|\bDCN\b|PLANO MUNICIPAL DE EDUCACAO|\bPME\b/,
 /PROJETO POLITICO PEDAGOGICO|\bPPP\b/,
 /SECRETARIO ESCOLAR|SECRETARIA ESCOLAR|ESCRITURACAO ESCOLAR|REGISTRO DE ALUNOS|MATRICULA ESCOLAR/,
 /SUPRIMENTO|CLASSIFICACAO DE MATERIAIS|ARMAZENAMENTO DE MATERIAIS|CONTROLE DE MATERIAIS/,
 /PATRIMONIO ESCOLAR|GESTAO AMBIENTAL|SUSTENTABILIDADE NA ESCOLA/,
 /DESENVOLVIMENTO HUMANO|DESENVOLVIMENTO COGNITIVO|DESENVOLVIMENTO INFANTIL/,
 /PRATICAS EDUCATIVAS|RELACOES EDUCATIVAS|PROCESSO DE ENSINO E APRENDIZAGEM/,
 /RELACOES INTERPESSOAIS|TRABALHO EM EQUIPE|GESTAO DE CONFLITOS|COMUNICACAO NA ESCOLA/,
 /LEGISLACAO ESCOLAR|NORMAS DO SISTEMA DE ENSINO|REGIMENTO ESCOLAR|ORGANIZACAO DA EDUCACAO BASICA/,
 /SISTEMAS? DE GESTAO ESCOLAR|SISTEMA EDUCACIONAL INFORMATIZADO|DIARIO ELETRONICO|EDUCACENSO|CENSO ESCOLAR/
]);
export const normalizeSecretariaText=text=>String(text||'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
export function matchSecretariaTopic(sectionId,text){
 const rules=sectionId==='legislacao'?SECRETARIA_LEGAL_RULES:
  sectionId==='especificos'?SECRETARIA_SPECIFIC_RULES:null;
 if(!rules)return -1;
 const input=normalizeSecretariaText(text);
 return rules.findIndex(rule=>rule.test(input));
}
