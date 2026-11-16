## 0.6.24 — 16/11/2026

- Objetiva, PM-Sossego, Matemática Q21: remove endereço `www.objetivas.com.br` inserido indevidamente depois da alternativa D.
- Novo tratamento de rodapé na extração espacial (linha isolada ou anexada ao final da alternativa).
- Reparo automático em questões já existentes ao abrir/sincronizar o banco, sem reimportação nem alteração de respostas ou históricos.
- URL só é removida quando coincide exatamente com a assinatura do rodapé da Objetiva ao final do campo; demais links de conteúdo são preservados.
- Testes validam extração, preservação do gabarito e dos históricos e ausência de alterações nos registros originais.

## 0.6.23 — 16/11/2026

- Gabaritos com vários cargos e tabelas numéricas: novo leitor estrutural reutilizável seleciona automaticamente por código + nome da função, sem regras dependentes da banca.
- FEPESE F1 da Grande Florianópolis: 35 respostas corretas, inclusive 1-C e 35-B; cinco gabaritos de outros cargos são isolados.
- Rejeita código de caderno inexistente ou correspondente a outro cargo, mesmo que o título de uma outra tabela pareça semelhante.
- Metadados e grupos oficiais de disciplinas da prova 2026 de Auxiliar de Serviços Gerais reconhecidos.
- Texto-base em duas colunas vinculado às questões 1–5 de Português.
- Testes de regressão com gabarito real e sem alteração no banco de dados ou nos históricos.

## 0.6.22 — 16/11/2026

- Corrigida a comparação literal entre o cargo do caderno e o do gabarito FCPC/Aracati. Extração de fonte incorporada troca a letra em SERVIÇOS, resultando em SERVIAOS.
- Comparador de cargos aceita uma única diferença de caractere, com os demais termos substantivos preservados e na ordem, para arquivos de um cargo ou multicargo.
- Mantidas salvaguardas que impedem selecionar gabarito de cargo diferente.
- Testes verificam 50 respostas, comparação tolerante e recusa de cargos incompatíveis.
- Nenhum dado pré-existente precisa ser apagado ou migrado.

## 0.6.21 — 16/11/2026

- Novo cargo “Todos — estudo geral, sem edital” em Questões e Simulados, com filtros transversais de Português, Raciocínio Lógico/Matemática, Informática, Conhecimentos Gerais, Legislação e conhecimentos específicos.
- Questões originais de quaisquer concursos entram em Todos; conteúdos adaptados para Candeias e avaliações por edital não são misturados nesse modo.
- Novo botão “Conferir edital” permite indicar DENTRO/FORA para um cargo específico durante a resolução e acompanhar a solicitação em Sinalizações.
- Aprovação via GitHub registra a pertinência específica do cargo sem modificar classificação original, respostas, provas e histórico.
- Estatísticas por edital permanecem limitadas aos cargos 202/505. Os gráficos gerais continuam independentes.
- Testes de regressão e sintaxe aprovados. Sem migração ou reset de dados.

## 0.6.20 — 16/11/2026

- Conferência automática de cargo por duas rotas independentes: nome do arquivo/título e texto espacial da primeira página do caderno.
- Corrigido caso da FCPC/Aracati em que o gabarito isolado era identificado como Auxiliar de Serviços Gerais, mas o caderno era recusado sem correspondência.
- Seleção manual de gabarito reservada a casos de múltiplos cargos ambíguos; não é solicitada para um único cargo identificado.
- Testes de correspondência por capa, nome do arquivo real e recusa de cargo incompatível passaram.
- Banco e históricos preservados. Publicação do novo leitor versionada com SHA.

## 0.6.19 — 16/11/2026

- Corrigido formato de gabarito tabulado quando o PDF contém apenas a página do cargo selecionado; antes o leitor de tabelas só era habilitado para dois ou mais cargos.
- A prova FCPC Aracati Auxiliar de Serviços Gerais passa a reconhecer automaticamente as 50 respostas da tabela de 1 página (01–10, 11–20, 21–35, 36–50), sem campos manuais.
- A comparação do cargo permanece obrigatória, inclusive nos arquivos com apenas uma página, para evitar gabaritos de cargos trocados.
- Teste com transcrição fiel do PDF isolado cobre 50 alternativas e bloqueia regressão para seis respostas.
- Não alterados registros do banco, provas ou históricos.

## 0.6.18 — 16/11/2026

- Corrigido fluxo de recuperação da importação FCPC/Aracati quando o sistema identifica todos os cargos do PDF mas falha na correspondência automática.
- O leitor devolve lista de páginas e cargos, exibida no próprio formulário para seleção explícita do usuário.
- Campo “Cargo no PDF do gabarito” aberto automaticamente, com opção para selecionar “Página 2 — Auxiliar de Serviços Gerais”.
- Importador utiliza somente a página escolhida e mantém todas as validações de gabarito, numeração e quantidade de alternativas.
- Seleções inválidas são recusadas. Provas, perfis, respostas e históricos existentes permanecem intactos.
- Testes automatizados com 4 páginas e 50 respostas passaram; conferência do resultado no navegador ainda pendente.

## 0.6.17 — 16/11/2026

- Corrigido cache de módulos ES do GitHub Pages. A versão do HTML podia avançar sem que `pdf-layout.mjs` fosse recarregado, mantendo o erro de uma versão antiga.
- URLs versionadas por SHA de commit em `index.html`, `app.mjs` e seus módulos locais, `config.js` e `styles.css`, geradas automaticamente no build de publicação.
- Rodapé exibe a revisão real do leitor JavaScript executado.
- Testes de regressão cobrem a cadeia de imports versionada e impedem misturar interface nova com parser antigo.
- Nenhuma alteração no banco central, provas, perfis ou históricos.

## 0.6.16 — 16/11/2026

- FCPC Aracati: corrigido o erro “O gabarito possui páginas para vários cargos, mas não foi possível identificar a página do cargo solicitado”.
- Reconhecimento do cargo via normalização do título entre “Gabarito Preliminar” e “Prova 1”, mesmo com fragmentação de palavras/linhas.
- Remoção de sufixos como `(1)` no nome do PDF para a identificação, sem renomear o arquivo.
- Seleção exata e única da página de Auxiliar de Serviços Gerais, sem misturar respostas de outros cargos.
- Novo diagnóstico informa quais cargos o leitor conseguiu reconhecer quando a identificação falha.
- Testes completos aprovados. Nenhuma migração ou alteração em dados salvos.

## 0.6.15 — 16/11/2026

- FCPC/Aracati: identificação da banca, Câmara Municipal e cargo Auxiliar de Serviços Gerais.
- Importador deixa de confundir as oito instruções da capa com questões da prova.
- Reconhecimento de “50 (cinquenta) questões” como quantidade oficial.
- Gabarito preliminar com vários cargos em páginas separadas: seleciona apenas a página 2 (Auxiliar de Serviços Gerais) e lê corretamente as 50 respostas tabuladas.
- Texto-base de IA generativa da página 2 compartilhado por Português 01–10.
- Disciplinas originais: 01–10 Português, 11–20 Legislação, 21–50 Conhecimentos Específicos.
- Testes automatizados completos aprovados; validação final no navegador ainda pendente.
- Banco, histórico, classificações por edital e importações existentes preservados.

## 0.6.14 — 16/11/2026

- “Candeias — normas verificadas” passa a “Candeias adaptadas” no filtro Legislação municipal, sem mudar seu identificador persistido.
- Classificação pelo edital oferece apenas “Dentro do edital” e “Todas”.
- “Dentro do edital” inclui assuntos classificados e “A conferir”; “Todas” também inclui “Fora do edital”.
- Questões pendentes podem ser sinalizadas durante a resolução, inclusive nos simulados, sem remover gabaritos ou registros.
- Versão original preserva sua separação de adaptações.
- Testes automatizados e interface protegidos; nenhum dado do banco foi migrado ou reiniciado.

## 0.6.13 — 16/11/2026

- Identificação da banca Objetiva Concursos e órgão PM-SOSSEGO para o caderno Auxiliar de Serviços Gerais, concurso 01/2026.
- Gabarito preliminar multicargo: a seleção da seção exata do cargo elimina risco de utilizar respostas de Agente Comunitário, Gari ou outros cargos. Reconhece cabeçalhos curtos.
- Importador detecta quatro alternativas pelo padrão reiterado A–D quando a capa não informa 4/5 explicitamente.
- Preserva o texto-base sobre pressão arterial para as primeiras questões de Português.
- Separação oficial de disciplinas 1–15 Português, 16–25 Matemática e 26–40 Conhecimentos específicos.
- Testes de regressão e integridade aprovados; importação real no navegador ainda depende de confirmação.
- Banco de dados, tentativas, simulados e classificações personalizadas preservados.

## 0.6.12 — 16/11/2026

- Corrigidas questões 11 (`Questão 1 1.`) e 40 (`Questão 4O.`) da Legalle/CISCOPAR.
- Suporte de importação e integridade a cadernos de quatro alternativas, como declarado na capa do concurso 01/2026.
- Gabarito com múltiplas tabelas por cargo: selecionar somente `Analista em Informática - Tabela 3`, com 50 respostas.
- Identificação da banca Legalle e do órgão CISCOPAR, com nome correto do cargo.
- Texto-base sobre telemedicina associado a todas as questões 1–10.
- Testes automatizados específicos adicionados e aprovados.
- Sem migração de dados, reclassificação retroativa destrutiva ou alteração de respostas.
- Importação real em dispositivo do usuário ainda depende de conferência.

## 0.6.11 — 16/11/2026

- Corrigida a seleção automática do gabarito 002 da VUNESP/UNESP quando a capa divide o título entre colunas.
- Inferência do código pelo título "002. Prova" e pela assinatura de impressão VNSP2511/002; discordâncias bloqueiam a importação.
- Desempate seguro entre cargos homônimos por área de atuação integral (Desenvolvimento de Sistemas Institucionais versus Redes e Infraestrutura), sem aceitar trecho genérico.
- Testes adicionados para o cenário real informado e para proteção contra gabaritos de outros cargos.
- Não foi necessário reinicializar ou modificar as provas importadas; validar importação final no navegador.

## 0.6.10 — 16/11/2026

- Corrigido o falso duplicado “002. Prova Objetiva” da capa VUNESP/UNESP; o leitor não confunde código de caderno com questão.
- Metadados: instituição UNESP, banca VUNESP por assinatura VNSP de rodapé, cargo Analista de Informática II e área de atuação; curso 2026 identificado pelo gabarito oficial.
- Gabarito multicargo: seleção estrita da seção 002. Códigos ausentes ou conflitantes não acionam seleção por nome genérico de cargo.
- Inclusão de identificação manual opcional de ano, banca, órgão e código quando os arquivos não fornecem dados reconhecíveis.
- Identificação da tirinha como elemento gráfico isolado; mantém enunciado e alternativas como texto.
- Classificação conforme blocos originais de Português (1–10), Matemática e Raciocínio Lógico (11–15), Legislação (16–20) e Informática (21–40).
- Testes de regressão passaram; a importação completa no navegador permanece sujeita à verificação.
- Não alterados o banco de questões, respostas, simulados, provas ou os catálogos de editais já salvos.

## 0.6.9 — 15/11/2026

- Catálogos personalizados do Edital 01/2026 da Câmara de Candeias do Jamari: cargo 505 (Analista de Tecnologia e Informática, nível superior) e 202 (Auxiliar de Serviços Gerais, ensino fundamental).
- Cargo 202: Português, Matemática e Conhecimentos Gerais, sem incluir Informática nem Legislação (reservadas a outro cargo de nível fundamental).
- Cargo 505: os seis blocos programáticos e os assuntos específicos mantidos a partir das páginas 4–5 e 7 do Anexo IV.
- Reconhecimento de equivalências de termos e conceitos; sem correspondência clara, sinaliza "A conferir"; conteúdos comprovadamente não previstos recebem "Fora do edital".
- Novos filtros de cargo, disciplina, assunto e pertinência ao edital; simulados e relatórios por assunto; seleção inicial inclui "Dentro + a conferir" para não excluir falsos negativos.
- Classificação retroativa e dinâmica para questões já importadas e futuras; os IDs, códigos, gabaritos, tentativas, perfis e simulados permanecem inalterados. Nenhuma migração nem reinicialização em data/state.json.
- A classificação original permanece visível; a classificação do edital é independente e pode evoluir conforme o usuário enviar outros editais.
- Casos de legislação municipal exigem correspondência jurisdicional verificada; provas originais de outras cidades não herdam automaticamente regras de Candeias.
- Testes de regressão para equivalência, exclusão, disciplinas e preservação do estado; catálogo acessível no painel recolhível.

## 0.6.8 — 15/11/2026

- Filtro para Candeias: não incluir questões originais sobre a Lei Complementar Municipal nº 143/2009 de Brusque, incluindo a questão 20 (promoção horizontal de 90 horas).
- Leis complementares municipais de outras localidades passam a ser reconhecidas como legislação local e impedidas no estudo específico de Candeias sem adaptação validada.
- Mantém a questão e o gabarito na prova original; nenhum histórico ou dado existente foi excluído.
- Incluídos testes de regressão para elegibilidade jurídica e preservação da prova original.

## 0.6.7 — 15/11/2026

- FEPESE: letras minúsculas das alternativas são convertidas em A–E antes da validação, evitando 40 questões reproduzidas como imagem.
- Marcas SQUARE/Check-square são eliminadas do texto selecionável para não revelar o gabarito.
- Figuras são recortadas separadamente; questões textuais mantêm texto e alternativas no site.
- Reimportação pode atualizar prova anterior no mesmo ID, sem duplicar histórico, após validação de integridade.
- Worker permite somente melhoria controlada da extração; não permite trocar gabaritos, disciplinas, enunciados ou códigos.
- Feedback do navegador indica quando a sincronização da correção ainda não foi confirmada.
- A implantação do Worker na Cloudflare e a verificação da importação real permanecem pendentes de confirmação.

## 0.6.6 — 15/11/2026

- Corrigida a seção do gabarito FEPESE para o cargo S01 Analista de Informática, Brusque, com 40 questões e 40 respostas.
- Evitada a contagem duplicada de listas numeradas internas aos enunciados.
- Preservado o Texto 1, que atravessa as duas colunas da questão 1.
- Corrigida a falsa mensagem de que um PDF declara a contagem parcial obtida do gabarito.
- Reconhecidos FEPESE, Município de Brusque e cinco blocos de disciplinas.
- Acrescentados testes de regressão e mantidos os dados anteriores intactos.
- Importação integral no navegador ainda não foi verificada com os PDFs originais.

## 0.6.5 — 15/11/2026
- Traduzidas as opções de “Meu histórico”: Não respondidas, Erradas e Acertadas.
- Substituída a lista de escolha única por três caixas de seleção independentes em Questões e Simulados.
- Qualquer combinação de categorias é válida; nenhuma marcada equivale a Todas.
- Corrigido o filtro para aplicar união (OU) das situações selecionadas segundo a última resposta válida do perfil ativo.
- Compatibilidade preservada com o parâmetro legado `outcome`.
- Ajustada a apresentação para celular; o filtro mantém as seleções após a busca.
- Sete testes adicionais de multisseleção, tradução, compatibilidade e isolamento entre perfis.
- Banco, provas, gabaritos, estatísticas e histórico preservados.

## 0.6.4 — 15/11/2026
- Corrigida perda de alternativas numéricas isoladas e títulos `QUESTÃO` separados de seus números no PDF Quadrix.
- Aumentada a tolerância geométrica para reunir rótulos e valores próximos sem fundir alternativas de linhas diferentes.
- Questões com extração incompleta deixam de ser descartadas: são recuperadas como recorte fiel do PDF com controles A–E.
- Corrigido o recorte para incluir alternativas e, quando aplicável, encerrar antes de `ANOTAÇÕES`.
- Permissão de importação somente quando os recortes forem gerados com sucesso; falhas de imagem e de numeração continuam bloqueando a importação.
- Questões recuperadas continuam marcadas como `Revisão da extração` e são identificadas na mensagem de sucesso.
- Adicionados testes para os casos das questões 16–20, 25 e 43, para cabeçalhos gráficos divididos e para recuperação de 50 questões.
- 85 testes automatizados aprovados; importação completa no navegador ainda requer validação.
- Banco, gabaritos, perfis e histórico existentes preservados.

## 0.6.3 — 15/11/2026
- Corrigido erro de seleção do gabarito Quadrix CRQ-V: o cargo está no rodapé da prova e era removido pela leitura espacial.
- O seletor de gabarito agora considera o nome real do PDF e o título inferido, além do texto extraído.
- Sublinhados no nome do arquivo são normalizados (`analista_de_informatica (2).pdf`).
- Mantida exigência de correspondência única com a seção 2.7, cargo 401, sem misturar gabaritos de outros cargos.
- Criados testes que reproduzem o bloqueio anterior e validam as 50 respostas do cargo 401.
- Dados existentes preservados; nova importação deve ser validada no navegador.

## 0.6.2 — 15/11/2026
- Incorporado o Anexo IV do Edital nº 01/2026 ao perfil de estudo de Candeias, com foco no cargo 505 — Analista de Tecnologia e Informática.
- Registrados seis grupos programáticos, páginas de referência e os tópicos exigidos de Conhecimentos Específicos de TI.
- Criado módulo `programa-candeias-505.mjs` e painel recolhível de consulta em Questões e Simulados.
- A disciplina Legislação Municipal foi delimitada à Lei Orgânica e às Resoluções nº 001/CMCJ-93 e nº 173/CMCJ/2025.
- As Leis Municipais nº 100/1997, nº 1.267/2021 e nº 1.268/2021 permanecem como referências do preâmbulo, sem ser presumidas como conteúdo diretamente cobrado.
- LGPD nº 13.709/2018 confirmada em Conhecimentos Específicos do cargo 505, não como quarta norma da disciplina municipal.
- Adaptação de normas sem artigos previamente conferidos permanece bloqueada; apenas o catálogo validado produz questões adaptadas.
- Adicionados testes de regressão do programa e corrigida a documentação histórica sobre a ausência anterior do anexo.
- Dados de provas, questões, perfis e estatísticas preservados; sem reimportação necessária.

## 0.6.1 — 15/11/2026
- Corrigida importação da prova Quadrix/CRQ-V 2026 de Analista de Informática com títulos `QUESTÃO N` sem pontuação.
- Textos de apoio como “Texto para as questões de 1 a 15” são associados às questões em duas colunas e páginas seguintes.
- Gabarito tabulado multicargo: seleciona o cargo 401 (seção 2.7), lê 50 respostas em duas faixas numeradas e bloqueia se houver ambiguidade.
- Total esperado derivado da seção de gabarito efetivamente selecionada, não de números soltos em trechos do PDF.
- Reconhecimento do CRQ-V como órgão e indicação de que o gabarito fornecido é preliminar.
- Classificação por blocos de disciplinas conforme divisão oficial da prova Quadrix para nível superior.
- Acrescentadas referências legislativas do Edital Candeias nº 01/2026, consolidado até a Retificação nº 01, sem extrapolar seu Anexo IV não anexado.
- Sem alterações nem limpeza do banco existente; nova importação deve ser testada no navegador.

## 0.6.0 — 15/11/2026
- Substituída a aprovação prévia por **adaptação automática** quando existe equivalência jurídica específica no catálogo oficial de Candeias.
- Implementados dez modelos de questões com dispositivo legal, URL oficial, gabarito independente e explicação factual.
- As adaptações são novas questões com vínculo e código próprios; o banco e o gabarito originais permanecem intactos.
- O Worker gera adaptações ao sincronizar provas e pode recuperar adaptações das importações anteriores via `/api/auto-adapt`.
- Ao conferir uma questão adaptada ou finalizar o simulado, o fundamento legal aparece automaticamente, sem usar Workers AI.
- Usuários podem sinalizar erros de adaptação; questões sem correspondência permanecem excluídas somente do modo municipal.
- Corrigida uma falsa equivalência: termos de posse de prefeito e vereadores não são tratados como investidura em cargo de servidor.
- Cobertura inicial limitada aos artigos previamente conferidos da Resolução 173/CMCJ/2025 e da Lei Orgânica de Candeias.
- Sem limpeza de banco ou redefinição de estatísticas. Publicação efetiva do Worker Cloudflare ainda requer confirmação.

## 0.5.0 — 15/11/2026
- Cloudflare Workers AI para explicações opcionais após a correção.
- Cache compartilhado no GitHub; explicações reutilizadas sem novo processamento.
- Limite gratuito tratado sem alterar questões, perfis ou estatísticas.
- Explicações incorretas podem ser sinalizadas para revisão.
- A impressão de simulados pendentes não contém gabarito.
- Contexto legislativo de Candeias do Jamari ativado como referência; leis específicas de outros municípios exigem adaptação e validação antes do uso no modo local.
- Provas e questões originais preservadas; nenhuma migração ou limpeza necessária.
- Testes automatizados do modelo, cache e classificação jurídica incluídos.
- A publicação final e a execução de IA no Worker real ainda precisam de confirmação.

## 0.4.3 — 15/11/2026
- Preservada uma passagem por linha nas listas de enunciados, incluindo os quatro itens da questão 9.
- Preservadas linhas independentes para pares de nomes e hashes, como na questão 37.
- Corrigido o deslocamento de glifos `o` sobrescritos: agora compõem `1º parágrafo`, `2º parágrafo` e `nº 04` pelo tamanho da fonte e coordenadas.
- Corrigidas as contaminações da alternativa E da questão 4 e da questão 21, sem substituir `à` por `ao`.
- Impressão passa a respeitar as quebras de linha dos itens.
- Adicionados seis testes de regressão; **47 testes automatizados aprovados**.
- 50 questões e 1 prova removidas na v0.4.3; PDF associado excluído; perfis Wilber e TESTE preservados.
- Proteção de identificadores excluídos mantida contra ressincronização de navegadores antigos.
- Pendente: confirmação da extração real no navegador com os PDFs originais.

## 0.4.2 — 15/11/2026
- Corrigida a posição vertical de frações que apareciam deslocadas ou agrupadas no enunciado.
- A fração reconstruída passa a herdar a linha do texto vizinho, respeitando a sequência das palavras e a pontuação.
- Reproduzidos e corrigidos os erros das questões 11 (duas ocorrências de 11/9 e 3/2) e 15 (3/8 e 7/8).
- Regressões construídas com coordenadas reais dos PDFs originais, verificando posição e quantidade de frações.
- 41 testes automatizados passaram; demais layouts de equações requerem validação adicional.
- Banco compartilhado reiniciado: 50 questões da importação anterior removidas na v0.4.2, junto com o registro da prova e o PDF, preservando os dois perfis.
- Pendente: novo teste de importação no navegador com a prova original.

## 0.4.1 — 15/11/2026
- Textos-base passam pela limpeza de hifenização e fragmentos, como nos enunciados.
- Tratados ordinais do PDF que deixavam caracteres `o` deslocados nas alternativas.
- Removidas da exibição as legendas de autorização repetidas de imagens, mantendo o PDF original inalterado.
- Corrigidos os recortes de desenho, tabela e planilha para evitar textos adjacentes e legendas duplicadas.
- A questão 11 deixa de exigir imagem apenas porque há a expressão "o equivalente a"; frações numéricas simples permanecem em texto.
- Metadados completos recolhidos para reduzir distrações na resolução; código permanente preservado.
- 39 testes automatizados aprovados e recortes conferidos com o PDF original das questões 17, 19 e 26.
- Limpeza final do banco compartilhado: 1 prova e 50 questões removidas; PDF anterior excluído; preservados os perfis Wilber e TESTE.
- Identificadores excluídos mantidos como proteção contra restauração por sincronização de navegadores antigos.
- Pendente: validação da nova importação no navegador e observação de outras bancas.

## 0.4.0 — 15/11/2026
- Recompostos enunciados e alternativas removendo quebras artificiais, hifens do fim da coluna e espaçamento redundante.
- Acrescentada detecção geométrica conservadora de frações escritas verticalmente no PDF: representação textual `3/8`, `11/9` etc.
- Corrigidos símbolos privados de fontes apenas quando o contexto é inequívoco (como caminhos de menu: `Inserir → Objeto OLE`). Símbolos desconhecidos não são adivinhados.
- Suporte a recorte de gráfico/figura inserido entre trechos do enunciado quando o leitor detecta um intervalo visual; caso contrário, mantém o recorte do enunciado.
- Alternativas aparecem sempre como texto independente, mesmo em questões com enunciado em imagem.
- Adicionada eliminação reversível por botão × à direita de cada alternativa, com visual cinza e riscado. A escolha da resposta continua sendo feita ao clicar na alternativa; em simulados, eliminar a alternativa marcada desmarca a resposta.
- Preferências de eliminação são locais ao navegador e vinculadas ao perfil/questão/simulado; não alteram estatísticas nem gabaritos.
- Estilos responsivos ocupam a largura disponível e ocultam botões × na impressão.
- 33 testes automatizados do núcleo/leitor aprovados nesta etapa; teste visual no navegador ainda pendente.
- Removidos 50 registros de questões, 1 prova VUNESP e seu PDF anterior do estado ativo, preservando Wilber e TESTE. Tombstones impedem restauração por clientes antigos.

## 0.3.2 — 15/11/2026
- Corrigida a causa de mensagens enganosas "alternativas não reconhecidas": erros de imagem deixaram de alterar a classificação da extração textual.
- PDF.js passou a gerar os recortes antes de `page.cleanup()`, evitando renderizar páginas cujos recursos já foram liberados.
- Renderização agrupada por página e segunda tentativa em escala menor para falhas de memória ou navegador.
- Mensagens de erro de imagem passam a informar questão, página e motivo técnico sem gravar importações incompletas.
- Questão 34 da VUNESP não solicita imagem: "tabela MAC" é conceito de redes, não uma tabela impressa.
- Recortes das questões 11, 17, 19 e 26 conferidos visualmente a partir dos PDFs enviados.
- 29 testes automatizados aprovados, incluindo sucesso, falha e recuperação da geração de imagens; versão de navegador ainda precisa ser testada com os dois PDFs originais.
- Banco de dados de testes continua com dois perfis e zero questões.

## 0.3.1 — 15/11/2026
- Renomeada a seção "Questões avulsas" para **"Questões"** em todo o menu, tela inicial, filtro e impressão.
- Textos de apoio continuam vinculados a cada questão e são exibidos abertos quando a questão aparece isoladamente ou inicia uma nova sequência.
- Quando questões consecutivas da mesma prova compartilham o mesmo texto-base, ele fica recolhido nas subsequentes, com opção para abrir novamente.
- Em simulados e na impressão, textos de apoio de questões consecutivas são exibidos uma única vez.
- Incluídos testes de regressão para textos em provas diferentes, seleções aleatórias e interrupção de sequências; total de 24 testes aprovados em execução isolada.
- Nenhuma alteração no banco de questões ou nos perfis.

## 0.3.0 — 15/11/2026
- Criado um extrator espacial por coordenadas e colunas para PDFs de concursos.
- Recuperados enunciados, alternativas, textos de apoio compartilhados e regiões visuais sem unir duas questões distintas.
- Isolado automaticamente o gabarito do cargo 004 em um arquivo contendo seis cargos.
- Adicionada validação de numeração, alternativas e respostas antes da importação.
- Reconhecidos o ano 2026 e a Câmara Municipal de Votorantim a partir dos dois PDFs.
- Preparados recortes como imagem para tabelas, figuras, frações e planilhas.
- Testados os PDFs reais por simulação das coordenadas de leitura: 50 questões, 50 gabaritos, zero lacunas; testes sintéticos adicionados ao projeto.
- Limitação: validação de uso em navegadores e em outros formatos de prova ainda pendente.

## 0.2.3 — 15/11/2026
- Removida a importação incorreta VUNESP (1 prova, 49 questões) do banco compartilhado e excluído o PDF anterior da versão atual do repositório.
- Mantidos os perfis Wilber e TESTE. Não havia respostas, simulados ou sinalizações associados à prova.
- Adicionado controle de IDs excluídos para impedir que sincronizações antigas recriem provas e questões descartadas.
- Examinados os documentos originais: caderno 004 Analista de Informática (50 questões, 16 páginas), gabarito do cargo 004 em documento com vários cargos (3 páginas).
- Registradas pendências de importação de provas em duas colunas, textos-base compartilhados, gráficos, tabelas e seleção de gabarito específico por cargo na Issue #1.

## 0.2.2 — 15/11/2026
- Corrigida a separação de enunciados quando o PDF insere \`RASCUNHO 19.\` após a questão 18.
- Removidos vários padrões de marcas d'água e trechos técnicos do PCI Concursos.
- Aprimorada a classificação conservadora por evidências do enunciado (Português, Matemática, Redes, Segurança da Informação, Sistemas Operacionais e Legislação).
- O leitor passa a guardar o número da página de origem; páginas com tabelas/figuras podem ter imagem de referência.
- Questões com extração duvidosa recebem status \`needs-review\` e não entram no sorteio padrão.
- Importações com numeração ausente ou repetida são bloqueadas antes da gravação.
- A impressão direta do navegador omite filtros e controles.
- Foram incluídos testes de regressão específicos; 15 testes de núcleo aprovados em execução isolada.
- A prova anteriormente importada com 49 questões foi preservada, sem alterações de classificação, e registrada para revisão na Issue #1.

## 0.2.1 — 15/11/2026
- Simplificada a importação: apenas PDF da prova e PDF do gabarito oficial, ambos obrigatórios.
- Corrigida perda de arquivos selecionados após sincronização em segundo plano.
- Adicionada confirmação visual dos nomes dos PDFs selecionados.
- Criada identificação automática de ano, banca, órgão e título, com sinalização de dados não identificados.
- Acrescentados testes para extração dos metadados.

# Histórico de versões

## 0.2.0 — 14/11/2026

- API Cloudflare Worker criada para gravar dados no GitHub sem expor o token no navegador.
- Sincronização incremental de perfis, questões, provas, tentativas, simulados e sinalizações; mesclagem entre dispositivos e cache local.
- Registros já existentes de gabarito e classificação não podem ser alterados por participantes na API.
- Ajuste da exclusão estatística de questões anuladas e desatualizadas; expiração de rascunhos com 30 dias.
- Envio de sinalizações estruturadas para Issues e decisão por comentário "aprovar"/"rejeitar" do proprietário.
- Suporte a armazenamento remoto de PDF original (até 4 MB por arquivo) e acesso a partir de outros aparelhos.
- Página de configuração e rotina de ativação automática com /api/setup; testes adicionais de sincronização.
- **A ativação efetiva da API ainda depende de criar o secret GITHUB_TOKEN e publicar o Worker na Cloudflare.** Não houve validação de integração real entre dois navegadores.


## 0.1.1 — 14/11/2026

- Reconstrução direta dos arquivos no repositório GitHub por integração.
- Publicação por GitHub Actions, com validação de sintaxe e testes automatizados.
- Tela obrigatória “Quem está aí?” ao abrir.
- Biblioteca de questões com prova e numeração de origem, códigos por ano/disciplina/assunto/banca/órgão.
- Importação inicial de provas e gabaritos, incluindo PDF digital e imagem de página quando o texto for insuficiente.
- Questões avulsas, provas completas, simulados aleatórios, impressão A4, folha de respostas e gabarito.
- Resultados por perfil; branco não entra em acertos/erros; última tentativa respondida prevalece.
- Filtros, questões anuladas e classificação por assunto.
- Backup JSON e limite de 30 dias para simulados pendentes.
- Sinalizações locais para posterior integração por Issues.

### Limitações conhecidas
- Armazenamento é local no navegador; sincronização GitHub ainda não foi ativada.
- PDF.js não garante leitura fiel de tabelas, colunas ou documentos digitalizados.
- Sinalizações ainda não são enviadas às Issues automaticamente.
- Fluxo remoto de aprovação, mudança de códigos e recálculo após gabaritos retificados não está conectado.
- Impressão da prova é uma reconstrução, não o PDF original inalterado.

## 0.1.0 — 14/11/2026

- Protótipo inicial preparado para testes em pacote ZIP local.
- Registro das regras de negócio e planejamento do armazenamento no GitHub.
