// Assuntos transversais padronizados entre bancas e editais.
// O texto original e os gabaritos nunca são reescritos por esta classificação.
export const TAXONOMY_SCHEMA = {
  "labels": {
    "LP": "Língua Portuguesa",
    "RLM": "Raciocínio Lógico/Matemático",
    "IN": "Informática",
    "CG": "Conhecimentos Gerais",
    "LE": "Legislação",
    "CE": "Conhecimentos Específicos"
  },
  "fallback": {
    "LP": [
      "Interpretação e compreensão de textos",
      "LINT"
    ],
    "RLM": [
      "Operações e resolução de problemas matemáticos",
      "OPER"
    ],
    "IN": [
      "Fundamentos de informática",
      "IFUN"
    ],
    "CG": [
      "Atualidades, sociedade e cidadania",
      "CATU"
    ],
    "LE": [
      "Legislação e administração pública",
      "LADM"
    ],
    "CE": [
      "Rotinas profissionais e organização do trabalho",
      "EROT"
    ]
  },
  "rules": {
    "RLM": [
      [
        "Lógica proposicional, conectivos e tabelas-verdade",
        "LPROP",
        "\\b(PROPOSI(C|C[AÃ])O|PROPOSICOES|TABELA[ -]?VERDADE|CONECTIVOS? LOGICOS?|TAUTOLOGIA|CONTRADI(C|C[AÃ])O LOGICA|CONDICIONAL LOGIC|BICONDICIONAL)\\b"
      ],
      [
        "Equivalências, negações e argumentos",
        "LARG",
        "\\b(NEGACAO|EQUIVALENCIA LOGICA|PREMISSAS?|ARGUMENTO LOGICO|SILOGISMO|QUANTIFICADOR|IMPLICA(C|C[AÃ])O|LOGICA DEDUTIVA)\\b"
      ],
      [
        "Análise combinatória e probabilidade",
        "PROB",
        "\\b(PROBABILIDADE|EQUIPROVAVEIS|PERMUTACAO|ARRANJOS?|COMBINATORIA|COMBINACOES|SORTEIO|URNA|BOLAS VERMELHAS|CARTAS? DE BARALHO)\\b"
      ],
      [
        "Conjuntos e diagramas lógicos",
        "CONJ",
        "\\b(CONJUNTOS? NUMERICOS?|CONJUNTO[S]? (?:DE|LOGICOS?)|DIAGRAMAS? DE VENN|UNIAO E INTERSECAO|INTERSE(C|C[AÃ])O DE CONJUNTOS|TEORIA DOS CONJUNTOS)\\b"
      ],
      [
        "Múltiplos, divisores, primos, MDC e MMC",
        "MMCD",
        "\\b(MINIMO MULTIPLO|MAXIMO DIVISOR|MMC|MDC|PRIMOS?|MULTIPLOS? COMUNS?|MULTIPLO COMUM|COINCIDENCIA.*NOVAMENTE|CICLOS? DE COLHEITA|INTERVALOS REGULARES|MAIOR NUMERO DE ALUNOS|KITS? IGUAIS|DIVISIBILIDADE|DIVISORES?|DIVIDIDOS? EM CAIXAS|MESMO NUMERO DE PASTAS)\\b"
      ],
      [
        "Progressões aritméticas e geométricas",
        "PROG",
        "\\b(PROGRESSAO|PROGRESSOES|RAZAO DA PROGRESSAO|PA[ /]PG|SEQUENCIA FORMA UMA PROGRESSAO)\\b"
      ],
      [
        "Sequências numéricas e padrões lógicos",
        "SEQL",
        "\\b(SEQUENCIA NUMERICA|SEQUENCIA LOGICA|SEQUENCIA DE NUMEROS|SEQUENCIAS NUMERICAS|PADRAO LOGICO|TERMO DA SEQUENCIA|ELEMENTO DA SEQUENCIA|SERIE NUMERICA|RACIOCINIO SEQUENCIAL)\\b"
      ],
      [
        "Porcentagem, juros e descontos",
        "PERC",
        "(\\b(PORCENTAGEM|PERCENTUAL|JUROS|DESCONTO|ACRESCIMO PERCENTUAL|TAXA PERCENTUAL)\\b|\\d+(?:[,\\.]\\d+)?\\s*%)"
      ],
      [
        "Médias e medidas de tendência central",
        "MEDI",
        "\\b(MEDIA ARITMETICA|MEDIA PONDERADA|MEDIA MENSAL|MEDIA DOS|MEDIA DAS|MEDIANA|MODA ESTATISTICA)\\b"
      ],
      [
        "Equações, inequações e sistemas",
        "EQSC",
        "\\b(EQUACAO|EQUACOES|INEQUACAO|SISTEMA DE EQUACOES|INCOGNITA|FUNCAO DO PRIMEIRO|FUNCAO DE 1|FUNCOES DE 1|POLINOMIOS|VALOR DE X|VALOR DE Y|PRODUTOS NOTAVEIS|X²|Y²)\\b"
      ],
      [
        "Funções e representação gráfica",
        "FUNC",
        "\\b(FUNCAO|FUNCOES|PARABOLA|FUNCAO AFIM|PLANO CARTESIANO|GRAFICO DE FUNCAO)\\b"
      ],
      [
        "Potenciação e radiciação",
        "POTE",
        "\\b(POTENCIA|POTENCIAS|POTENCIACAO|RAIZ QUADRADA|RAIZ CUBICA|RADICIACAO|EXPOENTES?)\\b"
      ],
      [
        "Frações, decimais e dízimas",
        "FRAC",
        "\\b(FRACAO|FRACOES|NUMEROS DECIMAIS|DIZIMA|DENOMINADOR|NUMERADOR|DECIMAIS)\\b"
      ],
      [
        "Geometria espacial e volumes",
        "GESP",
        "\\b(CUBO|PARALELEPIPEDO|PIRAMIDE|PRISMA|ESFERA|VOLUME|METROS CUBICOS|CENTIMETROS CUBICOS|CM3|M3)\\b"
      ],
      [
        "Geometria plana, perímetros e áreas",
        "GPLA",
        "\\b(PERIMETRO|AREA DE (?:UM|UMA) (?:RETANGULO|QUADRADO|TERRENO|FIGURA)|AREA TOTAL|RETANGULAR|PRA[CÇ]A RETANGULAR|FIGURA GEOMETRICA|TRIANGULO|RETANGULO|QUADRADO|CIRCUNFERENCIA|CIRCULO|PITAGORAS|ANGULOS?|MEDIDA DOS LADOS)\\b"
      ],
      [
        "Razão, proporção e regra de três",
        "RAZA",
        "\\b(RAZAO ENTRE|PROPORCIONAL|PROPORCAO|REGRA DE TRES|AUTONOMIA MEDIA|VELOCIDADE CONSTANTE|PRODUZEM|PEDREIROS|JORNADA DE|VELOCIDADE MEDIA|PRODUCAO.*DIAS|TRABALHANDO.*HORAS)\\b"
      ],
      [
        "Medidas, tempo e conversões de unidades",
        "MEDU",
        "\\b(QUILOGRAMAS?|MILIGRAMAS?|GRAMAS?|TONELADAS?|CENTIMETROS?|MILIMETROS?|QUILOMETROS?|UNIDADES DE MEDIDA|CONVERSAO|EM MINUTOS|EM SEGUNDOS|HORAS E MINUTOS|TEMPO DECORRIDO|COMPRIMENTO DO CABO|HORARIO|MESES E PERIODOS DO ANO|INTERVALO DE TEMPO|LITROS?)\\b"
      ],
      [
        "Estatística, gráficos e tabelas",
        "ESTA",
        "\\b(ESTATISTICA|TABELAS?|GRAFICOS?|DIAGRAMAS? DE COLUNAS|DADOS DA PESQUISA|HISTOGRAMAS?|FREQUENCIA RELATIVA|FREQUENCIA ABSOLUTA|RETRATA OS DADOS)\\b"
      ],
      [
        "Sistema monetário e matemática financeira",
        "MONI",
        "(R\\$\\s*|\\b(TROCO|NOTAS DE|CEDULAS|MOEDAS|VALOR TOTAL DA COMPRA|PRECO DO PRODUTO|VALOR DA PARCELA|COMPRAS|CUSTO DE AQUISICAO)\\b)"
      ],
      [
        "Operações e expressões numéricas",
        "OPER",
        "\\b(EXPRESSAO NUMERICA|PROPRIEDADE DISTRIBUTIVA|MULTIPLICACAO|DIVISAO|SUBTRACAO|SOMAR|SOMA DE|OPERACOES MATEMATICAS|NUMEROS NATURAIS|CONTAGEM|CALCULO ARITMETICO)\\b"
      ]
    ],
    "LP": [
      [
        "Ortografia, acentuação e emprego de letras",
        "LORT",
        "\\b(ORTOGRAFIA|GRAFIA CORRETA|ACENTUACAO|ACENTO GRAFICO|VOCABULOS? COM ERRO|GRAFADAS? CORRETAMENTE|EMPREGO DA LETRA|LETRA [A-Z] EM|FONEMA|SILABA TONICA|OXITONA|PAROXITONA|PROPAROXITONA|ACENTUAD[OA])\\b"
      ],
      [
        "Separação silábica e encontros fonéticos",
        "LSIL",
        "\\b(SEPARACAO SILABICA|SEPARACAO DE SILABAS|ENCONTRO CONSONANTAL|ENCONTRO VOCALICO|DITONGO|TRITONGO|HIATO|CLASSIFICACAO SILABICA)\\b"
      ],
      [
        "Pontuação e sinais gráficos",
        "LPON",
        "\\b(PONTUACAO|VIRGULA|DOIS[ -]?PONTOS|PARENTESES|RETICENCIAS|PONTO E VIRGULA|PONTOS DE EXCLAMACAO|SINAIS DE PONTUACAO)\\b"
      ],
      [
        "Concordância verbal e nominal",
        "LCON",
        "\\b(CONCORDANCIA|CONCORDAR COM O SUJEITO|FLEXAO DE NUMERO|PLURAL CORRETO|FORMA PLURAL)\\b"
      ],
      [
        "Regência e crase",
        "LREG",
        "\\b(CRASE|REG[ÊE]NCIA|ACENTO GRAVE|EMPREGO DA PREPOSICAO|USO DA PREPOSICAO)\\b"
      ],
      [
        "Sintaxe: termos da oração e períodos",
        "LSIN",
        "\\b(SINTAXE|SUJEITO|PREDICADO|OBJETO DIRETO|OBJETO INDIRETO|ADJUNTO|COMPLEMENTO NOMINAL|ORACAO|PERIODO COMPOSTO|VOZ PASSIVA|VOZ ATIVA)\\b"
      ],
      [
        "Classes de palavras e morfologia",
        "LMOR",
        "\\b(CLASSE DE PALAVRAS|CLASSIFICACAO DA PALAVRA|CLASSIFICADA COMO|VERBO|SUBSTANTIVO|ADJETIVO|ADVERBIO|PRONOME|ARTIGO|CONJUNCAO|INTERJEICAO|PREPOSICAO|TEMPO VERBAL|MODO IMPERATIVO|MORFOLOGIA|PLURAL|SINGULAR)\\b"
      ],
      [
        "Formação e estrutura de palavras",
        "LFOR",
        "\\b(FORMACAO DE PALAVRAS|PREFIXO|SUFIXO|DERIVACAO|COMPOSICAO|RADICAL|MORFEMA|FAMILIA DE PALAVRAS)\\b"
      ],
      [
        "Semântica: sinônimos, antônimos e sentidos",
        "LSEM",
        "\\b(SINONIM|ANTONIM|SIGNIFICA|SENTIDO DA PALAVRA|SEMANTICA|SIGNIFICADO|DENOTATIVO|CONOTATIVO|HOMONIMO|PARONIMO|POLISSEMIA|SUBSTITUIDA SEM|EXPRESSAO DESTACADA)\\b"
      ],
      [
        "Figuras de linguagem e recursos expressivos",
        "LFIG",
        "\\b(FIGURA[S]? DE LINGUAGEM|METAFORA|METONIMIA|ANTITESE|IRONIA|HIPERBOLE|PERSONIFICACAO|SENTIDO FIGURADO)\\b"
      ],
      [
        "Coesão, coerência e relações textuais",
        "LCOE",
        "\\b(COESAO|COERENCIA|CONECTIVOS?|ELEMENTOS DE RETOMADA|REFERENCIA|RELACAO DE SENTIDO ENTRE|VALOR SEMANTICO|RETOMA TEXTUALMENTE|RECURSOS ARGUMENTATIVOS)\\b"
      ],
      [
        "Gêneros, tipologias e funções da linguagem",
        "LGEN",
        "\\b(GENERO TEXTUAL|TIPO TEXTUAL|TEXTO JORNALISTICO|TEXTO CIENTIFICO|NARRATIVA|CRONICA|EDITORIAL|CARTA|FUNCAO DA LINGUAGEM|TIPOLOGIA|PROPOSITO COMUNICATIVO)\\b"
      ],
      [
        "Variação linguística e adequação",
        "LVAR",
        "\\b(VARIACAO LINGUISTICA|LINGUAGEM COLOQUIAL|LINGUAGEM FORMAL|NORMA[ -]?PADRAO|REGISTRO FORMAL|LINGUAGEM INFORMAL|VARIEDADE LINGUISTICA)\\b"
      ],
      [
        "Interpretação e compreensão de textos",
        "LINT",
        "\\b(SEGUNDO O TEXTO|DE ACORDO COM O TEXTO|CONFORME O TEXTO|COM BASE NO TEXTO|INTERPRETACAO|COMPREENS[AÃ]O DO TEXTO|IDEIA CENTRAL|ID[EÉ]IA PRINCIPAL|INFERIR|INFERENCIA|O AUTOR DO TEXTO|O TEXTO APRESENTA|TEXTO ESTABELECE|INFORMACOES TEXTUAIS)\\b"
      ]
    ],
    "IN": [
      [
        "Redes, protocolos e comunicação de dados",
        "IRED",
        "\\b(REDE DE COMPUTADORES|REDES DE COMPUTADORES|PROTOCOLOS? DE|TCP\\/IP|TCP|UDP|DHCP|DNS|OSI|IPV4|IPV6|ROTEADOR|SWITCH|TOPOLOGIA|LAN|WAN|VLAN|SUB-REDE|ENDERECO IP|WI[ -]?FI|ETHERNET|FIBRA OPTICA)\\b"
      ],
      [
        "Segurança da informação e privacidade",
        "ISEG",
        "\\b(SEGURANCA DA INFORMACAO|CRIPTOGRAFIA|CONFIDENCIALIDADE|INTEGRIDADE DOS DADOS|AUTENTICACAO|PHISHING|MALWARE|RANSOMWARE|ANTIVIRUS|FIREWALL|ATAQUE CIBERNETICO|LGPD|SENHA|BACKUP|RAID|CONTROLE DE ACESSO)\\b"
      ],
      [
        "Planilhas eletrônicas e fórmulas",
        "IPLA",
        "\\b(EXCEL|CALC|PLANILHAS?|GOOGLE SHEETS|SOMASES?|PROCV|CONT\\.SE|TABELA DINAMICA|CELULA [A-Z][0-9])\\b"
      ],
      [
        "Sistemas operacionais e gerenciamento",
        "ISOP",
        "\\b(WINDOWS|LINUX|SISTEMA OPERACIONAL|GERENCIADOR DE TAREFAS|KERNEL|SYSTEMCTL|CENTOS|POWERSHELL|REGISTRO DO WINDOWS|ARQUIVO DE SISTEMA|MEMORIA VIRTUAL)\\b"
      ],
      [
        "Hardware, arquitetura e manutenção",
        "IHAR",
        "\\b(HARDWARE|PLACA[- ]MAE|PROCESSADOR|CPU|MEMORIA RAM|SSD|HDD|PCI|FONTE DE ALIMENTACAO|PERIFERICOS|BARRAMENTO|COOLER|MOTHERBOARD|DISCO RIGIDO|MEMORIA CACHE|MANUTENCAO DE COMPUTADORES)\\b"
      ],
      [
        "Banco de dados e SQL",
        "IBDA",
        "\\b(BANCO DE DADOS|SGBD|MYSQL|POSTGRESQL|SQL|SELECT|INSERT INTO|NORMALIZACAO DE DADOS|RELACIONAL)\\b"
      ],
      [
        "Algoritmos e programação",
        "IPRO",
        "\\b(ALGORITMO|PSEUDOCODIGO|PYTHON|JAVASCRIPT|LINGUAGEM C#|VISUAL BASIC|PROGRAMA[CÇ][AÃ]O|CODIGO[- ]FONTE|ESTRUTURA DE DADOS|CLASSE E OBJETO)\\b"
      ],
      [
        "Internet, navegadores e correio eletrônico",
        "INET",
        "\\b(INTERNET|INTRANET|EXTRANET|URL|NAVEGADOR|CHROME|FIREFOX|EMAIL|E[- ]MAIL|CORREIO ELETRONICO|PAGINA WEB|HTTP|HTTPS)\\b"
      ],
      [
        "Aplicativos de escritório e edição",
        "IOFF",
        "\\b(POWERPOINT|WORD|LIBREOFFICE|WRITER|IMPRESS|PACOTE OFFICE|DOCUMENTOS ELETRONICOS|EDITOR DE TEXTO)\\b"
      ],
      [
        "Computação em nuvem e serviços digitais",
        "ICLO",
        "\\b(CLOUD|NUVEM|VIRTUALIZACAO|CONT[EÊ]INER|KUBERNETES|MICROSSERVICOS|DATA CENTER|SERVIDOR VIRTUAL)\\b"
      ],
      [
        "Inteligência artificial e tecnologia",
        "IIA",
        "\\b(INTELIGENCIA ARTIFICIAL|APRENDIZADO DE MAQUINA|MACHINE LEARNING|IA GENERATIVA|ALGORITMOS DE IA|REDES NEURAIS)\\b"
      ]
    ],
    "CG": [
      [
        "História do Brasil e formação política",
        "CHIS",
        "\\b(HISTORIA DO BRASIL|COLONIZA[CÇ][AÃ]O|PROCLAMACAO DA REPUBLICA|MARECHAL|INDEPENDENCIA DO BRASIL|PERIODO COLONIAL|PORTUGUESES|SEGUNDO REINADO|JOANINO|ESCRAVIDAO)\\b"
      ],
      [
        "Geografia do Brasil e organização territorial",
        "CGEO",
        "\\b(REGIAO SUL|REGIAO NORTE|REGIAO NORDESTE|REGIAO SUDESTE|REGIAO CENTRO.OESTE|ESTADOS BRASILEIROS|UNIDADES FEDERATIVAS|CAPITAL ESTADUAL|TERRITORIO BRASILEIRO|GEO[G]RAFIA|BIOMAS?|CERRADO|AMAZONIA|PANTANAL|MATA ATLANTICA)\\b"
      ],
      [
        "Meio ambiente e sustentabilidade",
        "CAMB",
        "\\b(MEIO AMBIENTE|SUSTENTABILIDADE|RECICLAGEM|RESIDUOS|MUDANCAS CLIMATICAS|AQUECIMENTO GLOBAL|PRESERVACAO AMBIENTAL|CICLO HIDROLOGICO|DESMATAMENTO|POLUICAO|ENERGIA RENOVAVEL)\\b"
      ],
      [
        "Saúde pública e qualidade de vida",
        "CSAU",
        "\\b(SAUDE PUBLICA|SANEAMENTO|EPIDEMIA|ENDEMIA|PANDEMIA|VIGILANCIA EM SAUDE|VACINACAO|PREVENCAO DE DOENCAS|DOENCAS TRANSMISSIVEIS)\\b"
      ],
      [
        "Cidadania, sociedade e direitos",
        "CCID",
        "\\b(CIDADANIA|CIVIS|DIREITOS HUMANOS|CONVIVENCIA SOCIAL|PATRIMONIO CULTURAL|PATRIMONIO HISTORICO|ECA DIGITAL|INSEGURANCA ALIMENTAR|POBREZA)\\b"
      ],
      [
        "Economia, trabalho e comércio",
        "CECO",
        "\\b(ECONOMIA|COMERCIO|EXPORTACOES|PARCEIRO COMERCIAL|INFLACAO|DESEMPREGO|MERCADO DE TRABALHO|IMPOSTO DE RENDA|IRPF|PIB)\\b"
      ],
      [
        "Política e instituições públicas",
        "CPOL",
        "\\b(CONSTITUICAO FEDERAL|PODER EXECUTIVO|PODER LEGISLATIVO|PODER JUDICIARIO|PRESIDENCIA DA REPUBLICA|ELEICOES|PROCESSO ELEITORAL|DEMOCRACIA)\\b"
      ],
      [
        "Ciência, tecnologia e atualidades",
        "CCTE",
        "\\b(INOVACAO|CIENCIA|PESQUISADORES|DESENVOLVIMENTO TECNOLOGICO|NOVAS TECNOLOGIAS|INTELIGENCIA ARTIFICIAL)\\b"
      ],
      [
        "Educação, cultura e sociedade",
        "CCUL",
        "\\b(EDUCACAO|CULTURA|ESCOLA|FUTEBOL|ESPORTE|LITERATURA|MANIFESTACOES CULTURAIS)\\b"
      ]
    ],
    "LE": [
      [
        "Constituição Federal e direitos fundamentais",
        "LCF",
        "\\b(CONSTITUICAO FEDERAL|ART\\.?\\s*225|DIREITOS FUNDAMENTAIS|DIREITO A SAUDE|CARTA MAGNA|ARTIGO 5)\\b"
      ],
      [
        "Legislação municipal e Lei Orgânica",
        "LMUN",
        "\\b(LEI ORGANICA|LEGISLACAO MUNICIPAL|MUNICIPIO|VEREADORES|CAMARA MUNICIPAL|INICIATIVA POPULAR)\\b"
      ],
      [
        "Administração pública e servidores",
        "LADM",
        "\\b(ADMINISTRACAO PUBLICA|SERVIDOR PUBLICO|REGIMENTO INTERNO|ESTATUTO DOS SERVIDORES|CARGO PUBLICO|PRINCIPIOS DA ADMINISTRACAO)\\b"
      ],
      [
        "Legislação de saúde e SUS",
        "LSUS",
        "\\b(LEI\\s*8\\.?080|LEI\\s*8\\.?142|SUS|SISTEMA UNICO DE SAUDE|POLITICA NACIONAL DE ATENCAO BASICA|DECRETO\\s*7\\.?508)\\b"
      ],
      [
        "Legislação ambiental e patrimônio",
        "LAMB",
        "\\b(LEI AMBIENTAL|PROTECAO AMBIENTAL|LEGISLACAO AMBIENTAL|PATRIMONIO HISTORICO|TOMBAMENTO)\\b"
      ],
      [
        "Ética, transparência e proteção de dados",
        "LET",
        "\\b(LGPD|LEI GERAL DE PROTECAO DE DADOS|ETICA|TRANSPARENCIA|IMPROBIDADE|ACESSO A INFORMACAO)\\b"
      ]
    ],
    "CE": [
      [
        "Higienização, limpeza e conservação",
        "ELIM",
        "\\b(LIMPEZA|HIGIENIZACAO|CONSERVACAO|DESINFECCAO|SANEANTES?|AGUA SANITARIA|HIPOCLORITO|SUPERFICIES|VARRICAO|DESCONTAMINACAO|AMBIENTE HOSPITALAR|ESTERILIZACAO)\\b"
      ],
      [
        "Segurança do trabalho e equipamentos de proteção",
        "ESEG",
        "\\b(EPI|EQUIPAMENTOS DE PROTECAO|SEGURANCA DO TRABALHO|RISCO OCUPACIONAL|ACIDENTE DE TRABALHO|PRIMEIROS SOCORROS|EMERGENCIA|PREVENCAO DE ACIDENTES)\\b"
      ],
      [
        "Coleta, separação e descarte de resíduos",
        "ERES",
        "\\b(RESIDUOS|RECICLAVEIS|DESCARTE|LIXO|COLETA SELETIVA|RESIDUO HOSPITALAR|GERENCIAMENTO DE RESIDUOS)\\b"
      ],
      [
        "Saúde coletiva, atenção básica e SUS",
        "ESUS",
        "\\b(SUS|SISTEMA UNICO DE SAUDE|UNIDADE BASICA|ATENCAO BASICA|ATENCAO PRIMARIA|SAUDE COLETIVA|VIGILANCIA|PNAB|PROGRAMA SAUDE DA FAMILIA|UNIDADE DE SAUDE|ATENDIMENTO AO PACIENTE)\\b"
      ],
      [
        "Vacinação, prevenção e biossegurança",
        "EBIO",
        "\\b(VACINA|IMUNIZACAO|BIOSSEGURANCA|CONTROLE DE INFECCOES|INFECCAO|EQUIPAMENTO DE PROTECAO|PREVENCAO DE DOENCAS)\\b"
      ],
      [
        "Atendimento ao público e comunicação",
        "EATE",
        "\\b(ATENDIMENTO AO PUBLICO|PACIENTES|COMUNICACAO INTERPESSOAL|ACOLHIMENTO|EMPATIA|RELACOES INTERPESSOAIS|HUMANIZACAO|ATENDIMENTO HUMANIZADO)\\b"
      ],
      [
        "Ética profissional e relações de trabalho",
        "EETI",
        "\\b(ETICA PROFISSIONAL|SIGILO|CONFIDENCIALIDADE|POSTURA PROFISSIONAL|TRABALHO EM EQUIPE|CONVIVENCIA|RESPONSABILIDADE PROFISSIONAL)\\b"
      ],
      [
        "Rotinas administrativas e organização",
        "EROT",
        "\\b(ARQUIVAMENTO|PROTOCOLO|ORGANIZACAO DO TRABALHO|ROTINA ADMINISTRATIVA|GESTAO DE MATERIAIS|ESTOQUE|DOCUMENTOS|GESTAO PUBLICA|ARQUIVOS)\\b"
      ]
    ]
  }
};
export const normalizedSubjectText = value => String(value||'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
export function unifyQuestionTaxonomy(q){
 const s=TAXONOMY_SCHEMA, oldCode=String(q?.disciplineCode||'').toUpperCase();
 let d=(['MA','RL','RLM'].includes(oldCode)||/^(?:RACIOCINIO LOGICO|MATEMATICA)/.test(normalizedSubjectText(q?.discipline)))?'RLM':
  ['LP','IN','CG','LE','CE'].includes(oldCode)?oldCode:
  /PORTUGUES/.test(normalizedSubjectText(q?.discipline))?'LP':
  /INFORMATICA/.test(normalizedSubjectText(q?.discipline))?'IN':
  /LEGISLACAO|DIREITO/.test(normalizedSubjectText(q?.discipline))?'LE':
  /CONHECIMENTOS GERAIS|ATUALIDADES|GEOGRAFIA|HISTORIA/.test(normalizedSubjectText(q?.discipline))?'CG':'CE';
 const stem=normalizedSubjectText(q?.stem);
 // Evita que palavras como "função" (CME) ou números em contexto clínico
 // transformem Saúde/SUS ou Informática em problemas matemáticos.
 if(d==='RLM'){
  if(/\b(LEI ORGANICA|ARTIGO DA LEI|LEGISLACAO MUNICIPAL)\b/.test(stem))d='LE';
  else if(/\b(BACKUP|RANSOMWARE|CRIPT|PROTOCOLO TCP|SERVIDOR DE REDE|ANTIVIRUS|FIREWALL)\b/.test(stem))d='IN';
  else if(/\b(SUS|SAUDE|PACIENTE|PACIENTES|HOSPITAL|CENTRO DE MATERIAL E ESTERILIZACAO|AUXILIAR DE SERVICO DE SAUDE|AUXILIAR DE SERVICOS DE SAUDE|VACINACAO|LAVAGEM DAS MAOS|CONFIDENCIALIDADE DAS INFORMACOES DOS PACIENTES|CONFLITOS DE INTERESSE NO AMBIENTE DE TRABALHO)\b/.test(stem))d='CE';
 }
 let hit=s.rules[d].find(([title,code,pattern])=>new RegExp(pattern,'i').test(stem));
 if(!hit&&stem.length<90){
  const options=normalizedSubjectText((q?.options||[]).map(x=>x.text).join(' '));
  hit=s.rules[d].find(([title,code,pattern])=>new RegExp(pattern,'i').test(options));
 }
 const [topic,topicCode]=hit||s.fallback[d];
 return {discipline:s.labels[d],disciplineCode:d,topic,topicCode};
}
export const unifiedRlmTopics = TAXONOMY_SCHEMA.rules.RLM.map(row=>row[0])
 .concat(TAXONOMY_SCHEMA.fallback.RLM[0]);
