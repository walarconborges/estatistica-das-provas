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
