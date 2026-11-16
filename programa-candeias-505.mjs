/**
 * Câmara Municipal de Candeias do Jamari — Concurso 01/2026.
 * Anexo IV — Conteúdos Programáticos, cargo 505.
 * Referência de estudo extraída do documento fornecido pelo usuário.
 *
 * Os tópicos abaixo são uma organização sintética dos conteúdos do Anexo IV,
 * não uma transcrição integral nem validação automática de pertinência de
 * questões. Consulte sempre o edital e eventuais retificações.
 */
export const PROGRAM_505=Object.freeze({
 id:'candeias-do-jamari-2026-cargo-505',
 edital:'Edital nº 01/2026 — Câmara Municipal de Candeias do Jamari/RO',
 annex:'Anexo IV — Conteúdos Programáticos',
 cargoCode:'505',
 cargo:'Analista de Tecnologia e Informática',
 level:'Nível superior',
 sections:[
  {
   id:'portugues',title:'Português',pages:'4',
   topics:[
    'Compreensão, interpretação, gêneros e tipos de textos',
    'Variação linguística; discursos direto, indireto e indireto livre',
    'Coerência, coesão e estratégias argumentativas',
    'Formação de palavras; classes de palavras; verbos e suas flexões',
    'Sintaxe da oração e do período; concordância e regência',
    'Pronomes relativos e colocação de pronomes oblíquos átonos',
    'Crase, pontuação, ortografia oficial e acentuação gráfica'
   ]
  },
  {
   id:'raciocinio',title:'Raciocínio Lógico',pages:'4',
   topics:[
    'Proposições, conectivos, equivalência, implicação e argumentos válidos',
    'Conjuntos, pertinência, inclusão, subconjuntos e operações com conjuntos',
    'Operações fundamentais, potenciação, radiciação, decimais e valor absoluto',
    'Números naturais; fatores primos; múltiplos, divisores, MDC e MMC',
    'Problemas de verdades e mentiras e sequências numéricas, figurais e verbais',
    'Análise combinatória, probabilidade e resolução de problemas lógicos'
   ]
  },
  {
   id:'informatica-basica',title:'Noções de Informática',pages:'4–5',
   topics:[
    'Windows 10: ambiente, arquivos, pastas, configurações e compartilhamento',
    'Internet e Intranet; aplicativos, navegadores e mecanismos de busca',
    'Princípios de IA aplicada a softwares, produtividade, assistentes e automação',
    'Microsoft 365: Word, Excel, PowerPoint, Teams e Outlook',
    'Segurança da informação, malwares, golpes, senhas e ética digital',
    'Backup, contingência e recuperação de dados',
    'Redes, protocolos, Internet/Intranet, hardware, software e arquitetura de computadores'
   ]
  },
  {
   id:'legislacao',title:'Legislação Municipal',pages:'5',
   topics:[
    'Lei Orgânica do Município de Candeias do Jamari',
    'Resolução nº 001/CMCJ-93',
    'Resolução nº 173/CMCJ/2025'
   ]
  },
  {
   id:'gerais',title:'Conhecimentos Gerais',pages:'5',
   topics:[
    'Fatos políticos, econômicos e sociais dos últimos cinco anos',
    'Aspectos geográficos, históricos, sociais, políticos, econômicos e estatísticos do Brasil, de Rondônia e do município',
    'Cidadania e símbolos nacionais, estaduais e municipais',
    'Atualidades: meio ambiente, justiça, saúde, educação, cultura, ciência, tecnologia e demais temas listados',
    'Realidade histórica, geográfica, cultural, econômica e socioambiental de Rondônia',
    'Notícias gerais do site da Câmara Municipal de Candeias do Jamari'
   ]
  },
  {
   id:'especificos',title:'Conhecimentos Específicos — Cargo 505',pages:'7',
   topics:[
    'Internet, Web, URLs, navegadores, correio eletrônico, Intranet, Extranet e buscadores',
    'Hardware, periféricos, tipos e hierarquia de memória, drivers, CPU e barramentos',
    'Portas USB, HDMI e Thunderbolt; armazenamento, BIOS/UEFI, montagem e manutenção',
    'Segurança: vírus, malware, ransomware, phishing e antivírus',
    'Tipos de software e Windows 10/11: configuração, pastas, arquivos, impressão, compartilhamento e backup',
    'Redes: hardware, switches, roteadores, IP, máscaras, sub-redes, arquiteturas, topologias e protocolos',
    'Word, Excel, PowerPoint e Access (2016/2019/365)',
    'Software livre, Linux (comandos) e LibreOffice',
    'Algoritmos, programação estruturada, tipos de dados, seleção, repetição, vetores, matrizes, funções e ponteiros',
    'Compiladores, ambientes de desenvolvimento e prototipação de sistemas',
    'Programação orientada a objetos: classes, objetos, associação, agregação, herança, polimorfismo, sobrecarga e reuso',
    'Lei Federal nº 13.709/2018 — Lei Geral de Proteção de Dados (LGPD)'
   ]
  }
 ]
});
export const MUNICIPAL_LAWS_505=Object.freeze([
 'Lei Orgânica do Município de Candeias do Jamari',
 'Resolução nº 001/CMCJ-93',
 'Resolução nº 173/CMCJ/2025'
]);
export const PREAMBLE_ONLY_MUNICIPAL_ACTS=Object.freeze([
 'Lei Municipal nº 100/1997',
 'Lei Municipal nº 1.267/2021',
 'Lei Municipal nº 1.268/2021'
]);
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ');
/**
 * Esta função reconhece apenas menção direta às três normas cobradas
 * sob o título "Legislação Municipal" do Anexo IV.
 * A LGPD está em Conhecimentos Específicos, não nessa disciplina.
 */
export function listedMunicipalAct(text){
 const t=normalize(text);
 if(/\bLEI ORGANICA(?: DO MUNICIPIO)?\b/.test(t))return MUNICIPAL_LAWS_505[0];
 if(/(?:\bRESOLUCAO\b[^;\n]{0,25}?)?\b0*01\s*\/\s*CMCJ\s*[-/]?\s*93\b/.test(t))return MUNICIPAL_LAWS_505[1];
 if(/(?:\bRESOLUCAO\b[^;\n]{0,25}?)?\b173\s*\/\s*CMCJ\s*\/\s*2025\b/.test(t))return MUNICIPAL_LAWS_505[2];
 return null;
}
