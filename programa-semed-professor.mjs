/**
 * SEMED Porto Velho/RO — Edital nº 24/2026, Retificação nº 01.
 * Anexo IV, ensino superior (págs. 2–3); Professor Nível II —
 * Séries Iniciais, códigos 519 a 552 (págs. 5–6).
 *
 * Português e parte de RLM/Gerais referenciam os assuntos já
 * cadastrados no cargo 505; não duplicar questões nem históricos.
 * O catálogo é um índice sintético: prevalece o texto do Anexo IV.
 */
import {PROGRAM_505} from './programa-candeias-505.mjs';

export const PROFESSOR_CARGO_ID='519-552';
const sharedSection=id=>PROGRAM_505.sections.find(s=>s.id===id);
const portuguese=sharedSection('portugues').topics;
const logic=sharedSection('raciocinio').topics;
const general=sharedSection('gerais').topics;

export const PROGRAM_PROFESSOR=Object.freeze({
 id:PROFESSOR_CARGO_ID,
 cargoCode:PROFESSOR_CARGO_ID,
 cargo:'Professor Nível II — Séries Iniciais',
 level:'Ensino superior',
 edital:'SEMED Porto Velho/RO — Edital nº 24/2026, Retificação nº 01',
 annex:'Anexo IV — Conteúdos Programáticos, Retificação nº 01',
 pages:'2–3 e 5–6',
 sections:[
  {id:'portugues',title:'Língua Portuguesa',pages:'2',
   topics:portuguese},
  {id:'raciocinio',title:'Raciocínio Lógico',pages:'2',
   topics:[
    ...logic,
    'Razões, proporções, grandezas proporcionais e regras de três simples e composta',
    'Porcentagem e aplicações',
    'Grandezas e medidas: quantidade, tempo, comprimento, capacidade e massa',
    'Equações e sistemas de 1º grau; função do 1º grau e resolução de problemas',
    'Média aritmética simples e ponderada',
    'Quantificadores, diagramas lógicos e linguagem dos conjuntos',
    'Argumentação lógica: premissas, conclusões, inferências e validade'
   ]},
  {id:'gerais',title:'Conhecimentos Gerais e Atualidades',pages:'3',
   topics:[
    ...general.slice(0,6),
    'Notícias gerais do site da Prefeitura de Porto Velho/RO'
   ]},
  {id:'legislacao-educacao',title:'Legislação Educação',pages:'3',
   topics:[
    'Constituição Federal: educação, arts. 205 a 214',
    'Estatuto da Criança e do Adolescente — ECA, Lei nº 8.069/1990',
    'Lei de Diretrizes e Bases da Educação Nacional — LDB, Lei nº 9.394/1996',
    'Lei Brasileira de Inclusão, Lei nº 13.146/2015; educação especial e AEE',
    'Diretrizes Curriculares Nacionais para a Educação Básica e suas modalidades',
    'Base Nacional Comum Curricular — BNCC',
    'Plano Nacional de Educação — PNE, Lei nº 15.388/2026, conforme o edital',
    'Piso Salarial Profissional Nacional do Magistério — Lei nº 11.738/2008',
    'Fundeb — Lei nº 14.113/2020',
    'Valorização, formação, carreira e condições de trabalho dos profissionais da educação',
    'Organização, princípios e objetivos da Educação Infantil, Ensino Fundamental e Ensino Médio',
    'EJA; educação do campo, escolar indígena e escolar quilombola',
    'Educação integral, tempo integral e educação digital',
    'Plano Municipal de Educação — PME',
    'Estatuto do Magistério de Porto Velho — Lei Municipal nº 643/1986'
   ]},
  {id:'especificos',title:'Conhecimentos Específicos — Séries Iniciais',pages:'5–6',
   topics:[
    'BNCC: fundamentos, princípios, competências, habilidades e direitos de aprendizagem',
    'Currículo Referência da Educação Infantil e Ensino Fundamental: organização e prática pedagógica',
    'Diretrizes Curriculares Nacionais da Educação Básica, Infantil e Ensino Fundamental de 9 anos; Resolução CNE/CEB nº 7/2010',
    'Organização e funcionamento da Educação Básica e dos sistemas de ensino',
    'Legislação educacional: LDB, ECA, LBI, Leis nº 10.639/2003 e nº 11.645/2008, piso, Fundeb e PNE',
    'Educação inclusiva, equidade, diversidade, AEE, acessibilidade e tecnologias assistivas',
    'Educação das relações étnico-raciais, História e Cultura Afro-Brasileira, Africana e Indígena',
    'Educação em direitos humanos; prevenção da discriminação, preconceito e violência escolar',
    'Psicologia do desenvolvimento e da aprendizagem; desenvolvimento infantil integral',
    'Construção da identidade e aspectos cognitivos, afetivos, sociais e culturais da criança',
    'Concepções e teorias da aprendizagem; relações entre desenvolvimento e práticas pedagógicas',
    'Didática, tendências pedagógicas e processo de ensino e aprendizagem',
    'Planejamento educacional e participativo; planos de ensino e de aula',
    'Organização do tempo e do espaço escolar; metodologias, estratégias e gestão da sala de aula',
    'Interdisciplinaridade, contextualização e relação entre teoria e prática',
    'Currículo e cultura escolar; saberes, competências e habilidades',
    'Alfabetização, letramento, psicogênese da língua escrita e contribuições de Emilia Ferreiro e Ana Teberosky',
    'Hipóteses de escrita e construção do sistema de escrita alfabética',
    'Práticas de oralidade, leitura, produção textual e literatura infantil',
    'Educação Infantil: concepções, princípios, direitos, campos de experiências, interações e brincadeiras',
    'Jogos, ludicidade, desenvolvimento integral, cuidados, higiene, rotinas e materiais na Educação Infantil',
    'Avaliação diagnóstica, formativa e somativa; acompanhamento e recuperação da aprendizagem',
    'Projeto Político-Pedagógico (PPP), currículo, planejamento e prática pedagógica',
    'Gestão democrática, participação da comunidade e relação escola-família-comunidade',
    'Tecnologias digitais e recursos pedagógicos; cultura digital e uso crítico e responsável',
    'Formação e desenvolvimento docente, ética profissional, relações interpessoais e trabalho coletivo',
    'Práticas pedagógicas inclusivas e desenvolvimento integral',
    'Noções de primeiros socorros na escola, prevenção de acidentes e segurança dos estudantes'
   ]}
 ]
});

/**
 * Somente complementos que NÃO existiam no índice compartilhado de RLM;
 * e assuntos próprios de Educação. Índices correspondem aos tópicos acima.
 */
const EXTRA_MATCHERS={
 raciocinio:[
  /\bRAZAO\b|\bRAZOES\b|\bPROPORC(?:AO|OES)\b|REGRA DE TRES|DIRETAMENTE PROPORCIONAL|INVERSAMENTE PROPORCIONAL/,
  /PORCENT|PERCENT|DESCONTO|ACRESCIMO|%/,
  /GRANDEZAS? E MEDIDAS|UNIDADES? DE MEDIDA|COMPRIMENTO|CAPACIDADE|QUILOGRAMA|LITRO|MASSA|MEDIDA DE TEMPO/,
  /EQUAC(?:AO|OES)|FUNCAO DO 1|FUNCAO DO PRIMEIRO|FUNCAO AFIM|SISTEMA LINEAR/,
  /MEDIA ARITMETICA|MEDIA PONDERADA/,
  /QUANTIFICADOR|DIAGRAMA LOGICO|CONJUNTO UNITARIO|CONJUNTO UNIVERSO|CONJUNTO DAS PARTES|COMPLEMENTAR DE CONJUNTOS/,
  /PREMISSA|CONCLUSAO LOGICA|INFERENCIA|VALIDADE DE ARGUMENTOS/
 ],
 'legislacao-educacao':[
  /ART(?:IGO)?S? 205|ART(?:IGO)?S? 206|ART(?:IGO)?S? 207|ART(?:IGO)?S? 208|ART(?:IGO)?S? 209|ART(?:IGO)?S? 210|ART(?:IGO)?S? 211|ART(?:IGO)?S? 212|ART(?:IGO)?S? 213|ART(?:IGO)?S? 214|DIREITO A EDUCACAO.*CONSTITUICAO|CONSTITUICAO.*DIREITO A EDUCACAO/,
  /ESTATUTO DA CRIANCA E DO ADOLESCENTE|\bECA\b|\b8 069\b/,
  /\bLDB\b|\b9 394\b|LEI DE DIRETRIZES E BASES/,
  /LEI BRASILEIRA DE INCLUSAO|\b13 146\b|\bAEE\b|ATENDIMENTO EDUCACIONAL ESPECIALIZADO|EDUCACAO ESPECIAL/,
  /DIRETRIZES CURRICULARES NACIONAIS|\bDCN\b/,
  /\bBNCC\b|BASE NACIONAL COMUM CURRICULAR/,
  /PLANO NACIONAL DE EDUCACAO|\bPNE\b|\b15 388\b/,
  /PISO SALARIAL.*MAGISTERIO|\b11 738\b/,
  /\bFUNDEB\b|\b14 113\b/,
  /VALORIZACAO DOS PROFISSIONAIS DA EDUCACAO|FORMACAO DOS PROFESSORES|CARREIRA DOCENTE/,
  /ORGANIZACAO DA EDUCACAO BASICA|ETAPAS DA EDUCACAO BASICA|MODALIDADES DA EDUCACAO BASICA/,
  /\bEJA\b|EDUCACAO DE JOVENS E ADULTOS|EDUCACAO DO CAMPO|EDUCACAO ESCOLAR INDIGENA|EDUCACAO ESCOLAR QUILOMBOLA/,
  /EDUCACAO INTEGRAL|TEMPO INTEGRAL|EDUCACAO DIGITAL/,
  /PLANO MUNICIPAL DE EDUCACAO|\bPME\b/,
  /ESTATUTO DO MAGISTERIO|\b643 1986\b/
 ],
 especificos:[
  /\bBNCC\b|BASE NACIONAL COMUM CURRICULAR|COMPETENCIAS GERAIS/,
  /CURRICULO REFERENCIA|REFERENCIAL CURRICULAR|\bRCRO\b/,
  /DIRETRIZES CURRICULARES|RESOLUCAO CNE CEB|ENSINO FUNDAMENTAL DE 9/,
  /ORGANIZACAO DA EDUCACAO BASICA|SISTEMA DE ENSINO|ETAPAS DA EDUCACAO BASICA/,
  /\bLDB\b|\bECA\b|\bFUNDEB\b|10 639|11 645|11 738|14 113|15 388|13 146/,
  /EDUCACAO INCLUSIVA|EDUCACAO ESPECIAL|DIVERSIDADE|EQUIDADE|\bAEE\b|ACESSIBILIDADE|TECNOLOGIAS ASSISTIVAS/,
  /RELACOES ETNICO RACIAIS|AFRO BRASILEIR|CULTURA AFRICANA|CULTURA INDIGENA/,
  /DIREITOS HUMANOS|PRECONCEITO|DISCRIMINACAO|VIOLENCIA ESCOLAR/,
  /PSICOLOGIA DO DESENVOLVIMENTO|DESENVOLVIMENTO INFANTIL|DESENVOLVIMENTO DA APRENDIZAGEM/,
  /IDENTIDADE DA CRIANCA|ASPECTOS COGNITIVOS|ASPECTOS AFETIVOS|DESENVOLVIMENTO SOCIOAFETIVO/,
  /TEORIAS DA APRENDIZAGEM|TEORIAS PEDAGOGICAS|CONCEPCOES DE APRENDIZAGEM/,
  /DIDATICA|TENDENCIAS PEDAGOGICAS|PROCESSO DE ENSINO E APRENDIZAGEM/,
  /PLANEJAMENTO EDUCACIONAL|PLANEJAMENTO PARTICIPATIVO|PLANO DE AULA|PLANO DE ENSINO/,
  /GESTAO DA SALA DE AULA|ORGANIZACAO DO TEMPO|ORGANIZACAO DO ESPACO|METODOLOGIAS DE ENSINO|ESTRATEGIAS DE ENSINO/,
  /INTERDISCIPLINARIDADE|CONTEXTUALIZACAO|TEORIA E PRATICA/,
  /CURRICULO ESCOLAR|CULTURA ESCOLAR|SABERES ESCOLARES|COMPETENCIAS E HABILIDADES/,
  /ALFABETIZACAO|LETRAMENTO|PSICOGENESE|EMILIA FERREIRO|ANA TEBEROSKY/,
  /HIPOTESES DE ESCRITA|SISTEMA DE ESCRITA ALFABETICA/,
  /ORALIDADE|PRODUCAO TEXTUAL|LITERATURA INFANTIL|FORMACAO DO LEITOR/,
  /CAMPOS DE EXPERIENCIAS|DIREITOS DE APRENDIZAGEM|INTERACOES E BRINCADEIRAS|EDUCACAO INFANTIL/,
  /LUDICIDADE|JOGOS E BRINCADEIRAS|ROTINAS NA EDUCACAO INFANTIL|CUIDADOS E HIGIENE/,
  /AVALIACAO DIAGNOSTICA|AVALIACAO FORMATIVA|AVALIACAO SOMATIVA|RECUPERACAO DA APRENDIZAGEM|AVALIACAO DA APRENDIZAGEM/,
  /PROJETO POLITICO PEDAGOGICO|\bPPP\b/,
  /GESTAO DEMOCRATICA|ESCOLA FAMILIA COMUNIDADE|CONSELHO ESCOLAR|PARTICIPACAO DA COMUNIDADE/,
  /TECNOLOGIAS DIGITAIS|CULTURA DIGITAL|RECURSOS DIGITAIS|MEDIACAO PEDAGOGICA.*TECNOLOGIA/,
  /FORMACAO CONTINUADA|FORMACAO DOCENTE|ETICA PROFISSIONAL|TRABALHO COLETIVO|RELACOES INTERPESSOAIS/,
  /PRATICAS PEDAGOGICAS INCLUSIVAS|DESENVOLVIMENTO INTEGRAL DOS ESTUDANTES/,
  /PRIMEIROS SOCORROS|PREVENCAO DE ACIDENTES|SEGURANCA DOS ESTUDANTES/
 ]
};
export function normalizeProfessorText(text){
 return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toUpperCase().replace(/[^A-Z0-9%]+/g,' ').replace(/\s+/g,' ').trim();
}
export function matchProfessorNewTopic(sectionId,text){
 const patterns=EXTRA_MATCHERS[sectionId];
 if(!patterns)return -1;
 const normalized=normalizeProfessorText(text);
 const offset=sectionId==='raciocinio'?logic.length:0;
 const index=patterns.findIndex(pattern=>pattern.test(normalized));
 return index<0?-1:offset+index;
}
