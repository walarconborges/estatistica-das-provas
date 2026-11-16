# Estatística das Provas

**Versão experimental 0.6.23 — 16/11/2026**  
**Site:** https://walarconborges.github.io/estatistica-das-provas/

Plataforma pública para importar provas de concursos, corrigir respostas, gerar simulados e imprimir questões, com histórico de desempenho por perfil.

## Versão 0.6.23 — leitor genérico de gabaritos tabulados por cargo

- A importação da prova **FEPESE, Consórcio Público Interfederativo de Saúde da Região da Grande Florianópolis, Auxiliar de Serviços Gerais (F1), 16/08/2026** foi corrigida no leitor geral de gabaritos.
- O PDF oficial contém **seis cargos** distribuídos em duas páginas; o cargo **F1** tem **35 respostas**, enquanto M1, M2, S1, S2 e S3 possuem **40**. A versão anterior usava um leitor inadequado e identificava apenas **7 respostas**.
- Implementado um identificador **por estrutura, não por banca**: procura código do cargo, título e duas linhas consecutivas (numeração de 1 até N; respostas A–E), verifica alinhamento e seleciona o par correspondente à capa. Um código ausente ou incompatível continua bloqueando a importação, sem selecionar o primeiro cargo da lista por aproximação.
- O mesmo identificador atende tabelas com comprimentos diferentes (35/40 ou outros totais válidos), sem misturar seções de cargos.
- Teste de regressão reproduz as **35 respostas oficiais do F1**, de **1-C a 35-B**, verifica todas individualmente e confirma que os demais cinco gabaritos não são confundidos.
- Reconhece FEPESE, 2026, o consórcio de saúde da Grande Florianópolis e a divisão efetiva da prova: **1–5 Português, 6–10 Conhecimentos Gerais, 11–15 Higiene e Segurança no Trabalho e 16–35 Conhecimentos Específicos**.
- Preserva o texto de Português iniciado na coluna esquerda e continuado na direita como apoio às questões **1–5**, incluindo as páginas seguintes.
- Testes automatizados, inclusive os de provas anteriores, passaram. Não houve migração, exclusão ou duplicação de dados; a importação real no navegador ainda precisa ser confirmada.

## Versão 0.6.22 — tolerância controlada a caracteres incorretos no cargo do gabarito

- Identificado o motivo do bloqueio persistente na prova de **Auxiliar de Serviços Gerais — FCPC/Aracati**: o PDF do gabarito fornece o título **“AUXILIAR DE SERVIAOS GERAIS”** (glifo corrompido), enquanto a capa e o nome do arquivo usam **“SERVIÇOS”**. A comparação antiga exigia identidade literal.
- Introduzida comparação conservadora por palavras no nome do cargo: permite **uma única diferença de caractere** em todo o título, com os outros termos distintivos idênticos e em sequência. Não depende de correções manuais nem aceita simplesmente o único cargo encontrado.
- A regra vale para gabaritos de uma página e de várias páginas/cargos. Cargos diferentes como **Auxiliar Administrativo**, **Copeiro** e **Auxiliar de Serviços Escolares** continuam bloqueados quando não correspondem à prova.
- Novos testes simulam o nome com o glifo corrompido e confirmam a extração das 50 respostas em ambos os formatos, além da recusa de cargos distintos.
- Nenhuma questão, resposta, sinalização ou estatística anterior foi alterada. A confirmação da importação completa no navegador ainda é necessária.

## Versão 0.6.21 — Cargo Todos e conferência explícita por edital

- Acrescentado **Todos — estudo geral, sem edital** ao seletor de cargo em **Questões** e **Simulados**, ao lado dos cargos 202 e 505. A escolha persiste no navegador.
- No modo **Todos**, é possível filtrar a disciplina original por **Língua Portuguesa**, **Raciocínio Lógico e Matemática** (juntos), **Informática**, **Conhecimentos Gerais e Atualidades**, **Legislação e Direito**, **Conhecimentos Específicos** ou **Outras**, além de assuntos originais. Mistura questões de diversos concursos e bancas.
- No modo **Todos**, não se aplica pertinência ao edital de Candeias, não se exibem rótulos “A conferir” desse edital nem normas adaptadas; as questões originais, gabaritos e histórico permanecem preservados.
- Nos cargos 202/505, as questões avulsas e as de simulados apresentam agora **Conferir edital**: o usuário informa **DENTRO** ou **FORA**, fornece uma justificativa e a solicitação aparece em **Sinalizações**.
- A opinião do usuário é uma **sinalização pendente**, não uma alteração instantânea. Se aprovada pelo responsável no GitHub, muda apenas a pertinência daquela questão naquele cargo, sem alterar a classificação original, o gabarito ou o outro cargo; a questão mostra “Revisão aprovada”.
- **Sinalizar problema** continua disponível para gabarito, extração, adaptação ou outros problemas.
- Testes automatizados verificam filtros transversais, combinação de Matemática/RLM, exclusão de adaptações e revisões independentes por cargo. Nenhum banco foi zerado ou migrado.

## Versão 0.6.20 — conferência automática independente do cargo

- Corrigida a falha da versão 0.6.19 que encontrava o único cargo “Auxiliar de Serviços Gerais” no gabarito, mas rejeitava a associação automática com a prova.
- O importador agora realiza **uma segunda conferência independente** diretamente nas linhas espaciais da capa extraídas do PDF, além da comparação inicial com nome do arquivo e título inferido.
- Para gabaritos de **um único cargo**, a seleção da página é automática quando essa identidade é comprovada por uma dessas fontes. A pessoa não precisa selecionar a página/cargo manualmente.
- O formulário só apresenta a escolha manual quando existem **dois ou mais cargos realmente ambíguos** no mesmo gabarito.
- Conferência de segurança: não aceita um gabarito de Copeiro para uma prova de Auxiliar de Serviços Gerais; mantém integridade das 50 questões e das 50 letras oficiais.
- Adicionados testes com os nomes de arquivo reais (inclusive sufixo “(1)”), o título da capa com quebra de linha e a rejeição de cargos diferentes.
- Nenhum registro existente do banco, provas, gabaritos, tentativas ou simulados foi alterado. A importação final deve ser confirmada no navegador.

## Versão 0.6.19 — detecção automática de gabarito tabulado com 1 ou várias páginas

- Corrigida a causa da mensagem "O gabarito possui 6 respostas para 50 questões" no PDF isolado de Auxiliar de Serviços Gerais (FCPC/Câmara Municipal de Aracati/CE).
- O importador reconhecia corretamente as tabelas numéricas quando o arquivo reunia vários cargos, porém só ativava o leitor de gabarito tabulado se houvesse duas ou mais páginas/cargos. Ao separar a página de Auxiliar, ele usava o leitor genérico de pares e encontrava apenas seis correspondências incidentais.
- Agora uma única página de gabarito tabulado também é reconhecida automaticamente: o cargo do cabeçalho é conferido contra a identificação do caderno e as quatro linhas de números/respostas produzem as 50 letras.
- Mantidas as validações que impedem associar automaticamente gabaritos de cargos diferentes. O arquivo original com quatro páginas continua selecionando a seção de Auxiliar de Serviços Gerais.
- Teste de regressão com as 50 respostas transcritas do PDF isolado anexado, exigindo formato de tabela, total 50, correspondência exata de cada resposta e recusa de cargo divergente.
- Nenhum preenchimento manual é necessário para essa prova. Nenhuma prova, gabarito, tentativa, simulado ou classificação existente foi modificada.
- Testes automatizados e publicação aprovados; importação no navegador ainda precisa de confirmação.

## Versão 0.6.18 — escolha do cargo no gabarito quando a identificação automática falhar

- Gabaritos com várias páginas e um cargo por página (caso FCPC/Câmara Municipal de Aracati) são reconhecidos como seções verificáveis.
- Quando o reconhecimento automático não encontra uma correspondência única, o próprio formulário abre **Identificação manual** e apresenta o campo **Cargo no PDF do gabarito**, listando as páginas e os nomes de cargo efetivamente extraídos.
- O usuário pode escolher, por exemplo, **Página 2 — Auxiliar de Serviços Gerais**. A seleção usa apenas aquela página e exige a conferência integral das 50 respostas contra as 50 questões da prova.
- Nenhum gabarito de outro cargo é escolhido automaticamente por aproximação sem identificação; números de página inválidos ou inexistentes são rejeitados.
- Com o PDF de gabarito fornecido, a página 2 retorna 50 respostas (questão 1=A, questão 21=C, questão 50=D). Testes confirmam seleção automática quando a identificação está presente e escolha manual quando não está.
- O formulário preserva os dois PDFs selecionados depois do aviso, permitindo escolher o cargo e clicar novamente em **Importar questões**.
- Os dados existentes não foram alterados, migrados ou apagados. A extração completa no navegador ainda precisa ser validada pelo usuário.

## Versão 0.6.17 — atualização coerente dos módulos JavaScript

- Corrigido o carregamento de versões misturadas: o HTML mostrava uma versão nova (por exemplo 0.6.16), mas o navegador ainda podia executar `pdf-layout.mjs` de versão anterior, mantendo a mensagem antiga de erro.
- O processo de publicação agora utiliza a revisão SHA do commit nas URLs do HTML, dos estilos, da configuração, do aplicativo e de **todos os imports locais de módulos ES**. Assim, o leitor de PDF e o aplicativo são carregados da mesma revisão.
- O rodapé passa a mostrar **Leitor XXXXXXXX**, indicando a revisão do JavaScript efetivamente executado e permitindo diagnosticar cache antigo.
- Mantida a seleção por cargo do gabarito multicargo FCPC/Aracati (Auxiliar de Serviços Gerais, página 2, 50 questões), com normalização de quebras de linha e de sufixos de arquivo.
- Novos testes garantem que o HTML e a cadeia de módulos carreguem a mesma versão. Nenhuma prova, gabarito, tentativa, simulado, classificação ou histórico do banco foi modificado.
- O resultado final da importação deve ser confirmado no navegador com os PDFs reais.

## Versão 0.6.16 — Seleção segura do gabarito FCPC/Aracati

- Corrigida a associação das páginas do gabarito preliminar de **Auxiliar de Serviços Gerais (Câmara Municipal de Aracati, banca FCPC, 2026)**. O PDF possui 4 cargos e usa o título do cargo entre “Gabarito Preliminar” e “Prova 1”.
- A seleção aceita o nome do cargo com espaços, pontuação e quebras de linha produzidas pela extração do PDF; usa o nome do arquivo e o cargo inferido como evidências independentes.
- A prova denominada `auxiliar_de_servicos_gerais (1).pdf` pode corresponder a “Auxiliar de Serviços Gerais” mesmo com sufixo numérico no nome.
- Correspondência sempre **única**: a página de Agente Administrativo, Copeiro ou Assessor Técnico não pode ser usada como substituta. Caso não seja possível associar a página, o erro agora informa os cargos efetivamente lidos, sem inventar respostas.
- Testes de regressão cobrem título dividido em duas linhas, sufixo `(1)`, seleção da página correta e suas 50 respostas, cargos com nome curto e mensagem de diagnóstico.
- A leitura de questões e a base existente não foram alteradas. A importação final dos PDFs no navegador permanece a ser conferida.

## Versão 0.6.15 — FCPC Aracati 2026 (Auxiliar de Serviços Gerais)

- Compatibilidade com o caderno da **Câmara Municipal de Aracati/CE**, banca **Fundação Cearense de Pesquisa e Cultura — FCPC**, Edital nº 001, prova de **30/08/2026** para **Auxiliar de Serviços Gerais**.
- A capa contém **8 instruções numeradas**, não questões. O importador agora reconhece uma folha de instruções e não repete as questões 01–08.
- A quantidade de questões também é reconhecida quando aparece como “50 (cinquenta) questões”.
- O gabarito preliminar reúne **quatro cargos em quatro páginas**. A seleção escolhe apenas a página **2 — Auxiliar de Serviços Gerais**; a página 1 pertence ao cargo Agente Administrativo.
- Respostas extraídas do formato tabulado em duas linhas: números de 01–10, 11–20, 21–35 e 36–50, cada bloco com sua linha de letras A–D.
- O texto-base identificado como **TEXTO** na página 2 da prova é preservado e vinculado às questões 01–10 de Língua Portuguesa, inclusive às questões das páginas seguintes.
- Divisão original preservada: 01–10 Língua Portuguesa, 11–20 Legislação, 21–50 Conhecimentos Específicos.
- Testes de regressão verificam os 50 gabaritos transcritos do arquivo fornecido, excluem as oito instruções numeradas e conservam o texto-base compartilhado.
- A classificação por edital do cargo 202 de Candeias do Jamari continua independente, sem inclusão automática de leis locais de Aracati.
- Nenhum registro anterior do banco foi apagado ou alterado. A importação real no navegador precisa ser confirmada.

## Versão 0.6.14 — filtros simplificados para estudo por edital

- **Legislação municipal:** a primeira opção agora aparece como **Candeias adaptadas**; **Versão original das provas** permanece disponível. Os valores internos não mudaram, preservando o comportamento e as seleções existentes.
- **Classificação pelo edital:** somente **Dentro do edital** (padrão) e **Todas**. Não há opções separadas de “A conferir”, “Somente dentro” ou “Fora do edital”.
- **Dentro do edital** inclui tanto as questões classificadas dentro quanto as **pendentes de conferência**, mesmo com terminologias diferentes. O aviso “A conferir” permanece na própria questão para orientar sua revisão, não como opção de filtro.
- **Todas** inclui também as questões classificadas **Fora do edital**. Nenhuma questão foi excluída do banco.
- **Sinalizar problema** pode ser usado enquanto se resolve uma questão avulsa **ou um simulado**.
- A opção **Versão original das provas** continua ocultando versões adaptadas, e a classificação de legislação não comprovada não é apresentada como fundamento verificado.
- Valores antigos dos filtros são normalizados para o novo padrão; prova, gabarito, tentativas, perfis, flags, simulados e histórico permanecem intactos. As novas importações continuam independentes.
- Testes para os dois estados de filtro, incluindo pendências, exclusões e equivalências, aprovados.

## Versão 0.6.13 — Objetiva / Sossêgo-PB, Auxiliar de Serviços Gerais

- Prova de **40 questões** do Município de Sossêgo/PB, concurso público 01/2026, banca **Objetiva Concursos**, cargo **Auxiliar de Serviços Gerais**, com gabarito **preliminar**.
- Reconhece Objetiva pela indicação da organizadora e domínio `objetivas.com.br`, identifica o município e mantém o nome correto do cargo.
- Gabarito com dezenas de cargos: seleciona **exclusivamente Auxiliar de Serviços Gerais**, validando 40 letras. Cabeçalhos curtos, como **Gari**, delimitam nova seção e não contaminam as respostas de Auxiliar.
- Reconhece automaticamente **quatro alternativas (A–D)** a partir do padrão repetido nas questões, mesmo quando a capa não declara a quantidade. Evita transformar todas as questões em imagens por presumir A–E.
- Preserva o texto-base de Português sobre pressão arterial associado às questões que o utilizam, mesmo sem marcador explícito de intervalo.
- Mantém as disciplinas originais da prova: **Português (1–15)**, **Matemática (16–25)** e **Conhecimentos específicos (26–40)**.
- O catálogo personalizado do cargo 202 de Candeias do Jamari permanece como camada independente: assunto equivalente, fora do edital ou a conferir.
- Testes automatizados verificam metadados, seleção do gabarito correto, 40 questões com A–D e texto-base. Importação completa no navegador ainda precisa ser confirmada.
- **Nenhuma prova, resposta, gabarito, perfil, simulado ou histórico existente foi apagado ou modificado.**

## Versão 0.6.12 — Importação Legalle / CISCOPAR com quatro alternativas

- Prova do **Consórcio Intermunicipal de Saúde Costa Oeste do Paraná (CISCOPAR)**, concurso **01/2026**, cargo **Analista em Informática**, organizada pela **Legalle Concursos**: caderno com 50 questões e quatro alternativas (A–D).
- Reconhece títulos de questões danificados pelo texto PDF, como `Questão 1 1.` (11) e `Questão 4O.` (40), sem corrigir indiscriminadamente números presentes nos enunciados.
- Identifica o número de alternativas declarado na capa e valida corretamente cadernos de quatro **ou cinco** opções, inclusive nos recortes usados para revisão de extração.
- Gabarito definitivo com vários cargos: seleciona **Analista em Informática — Tabela 3**, exclusivamente pela identificação do cargo. Não mistura as 50 respostas com as tabelas de Administração, Técnico de Informática ou outros cargos.
- Reconhece Legalle e CISCOPAR nos textos efetivamente presentes nos PDFs e mantém as disciplinas de acordo com os blocos da prova.
- Associa o texto-base **“Telemedicina: avanços e desafios...”** às questões **1 a 10**, inclusive nas páginas seguintes.
- Testes de regressão com a numeração 11/40, as 50 respostas oficiais, as quatro alternativas e o texto-base compartilhado.
- A validação automatizada passou. A importação completa dos PDFs reais no navegador ainda precisa ser confirmada.
- Nenhum dado já salvo foi alterado e não é necessário reinicializar o banco.

## Versão 0.6.11 — correção da prova VUNESP/UNESP 002

- Recuperação automática do código da prova no título da capa, inclusive quando o leitor PDF divide o texto em colunas e extrai "002. Prova" separado de "Objetiva".
- Identificação independente pelo código editorial no rodapé (VNSP2511/002); se a capa e o rodapé divergirem, bloquear a associação para não usar o gabarito errado.
- Em gabaritos com múltiplas seções do mesmo cargo, seleciona primeiro o código explícito do caderno; se ausente, exige correspondência única e integral da área de atuação impressa na prova ou no nome do arquivo.
- Prova UNESP 2026, código 002 — Analista de Informática II, Desenvolvimento de Sistemas Institucionais, deve encontrar a seção 002 e as 40 letras do gabarito, sem preencher manualmente.
- Mantém opção manual de código do caderno somente como recurso alternativo de conferência.
- Testes de regressão: código de capa dividido, código de rodapé, seleção das 40 respostas, distinção entre áreas homônimas, conflito de identificadores e ausência de informação.
- Nenhum registro do banco, gabarito ou estatística existente foi alterado; a importação ainda deve ser validada no navegador com os arquivos originais.

## Versão 0.6.10 — importação VUNESP e metadados manuais

- Trata títulos numerados de caderno como “002. Prova Objetiva” (inclusive se o PDF dividir “Prova” e “Objetiva” entre duas colunas) sem contá-los como questões.
- Identifica VUNESP pela assinatura VNSP do rodapé, preservada como metadado mesmo quando o rodapé não deve aparecer nas questões, e UNESP como órgão; recupera o nome completo de Analista de Informática II e sua área de atuação.
- Seleciona exclusivamente o gabarito do código 002 e bloqueia seleção ambígua entre cargos homônimos (como Analista de Informática II — Desenvolvimento de Sistemas Institucionais e Redes e Infraestrutura).
- Recupera a tirinha da primeira questão como imagem separada das cinco alternativas em texto.
- Em “Importar prova” há uma seção recolhida opcional para preencher ano, banca, órgão e código do caderno quando o PDF não os identifica; valores identificados são protegidos e a integridade das questões/gabarito permanece obrigatória.
- A classificação de disciplinas respeita os blocos oficiais das 40 questões, preservando a classificação personalizada por edital independente.
- Testes automatizados cobrem os formatos de prova e gabarito, cabeçalhos divididos, identificação manual segura, a tirinha e a assinatura de impressão.
- Os PDFs originais ainda devem ser conferidos em uma importação real no navegador; testes de regressão de layout não substituem esse controle.

## Versão 0.6.9 — Classificação personalizada por edital

Há dois perfis oficiais no mesmo concurso da Câmara de Candeias do Jamari/RO (Edital 01/2026):
- **202 — Auxiliar de Serviços Gerais:** Anexo IV, páginas 1–2, apenas Português, Matemática e Conhecimentos Gerais.
- **505 — Analista de Tecnologia e Informática:** Anexo IV, páginas 4–5 e 7; Português, Raciocínio Lógico, Noções de Informática, Legislação Municipal, Conhecimentos Gerais e Conhecimentos Específicos.

Em **Questões** e **Simulados**, selecione o cargo, a disciplina, o assunto e a situação **Dentro do edital**, **Fora do edital** ou **A conferir**. O filtro inicial inclui **Dentro do edital + A conferir**. Em **Estatísticas**, há uma seção específica de desempenho por assunto do cargo selecionado. A classificação original da prova continua visível.

O mecanismo associa temas equivalentes mesmo quando a nomenclatura difere. Se a pertinência for incerta, mantém a questão em **A conferir**, em vez de classificá-la indevidamente como **Fora do edital**. Leis municipais de outros municípios não são admitidas como se fossem de Candeias sem validação jurídica.

**Importações durante a atualização são permitidas.** A classificação é calculada sobre o banco em tempo de consulta, sem modificar o banco de dados e sem apagar histórico de perfis, questões, gabaritos, simulados ou tentativas. Os novos cadernos passam a ser avaliados automaticamente pelo edital selecionado. Para alterar o programa, deve-se revisar o catálogo correspondente sem recriar o banco.

## Versão 0.6.7 — FEPESE: enunciados e alternativas em texto

- A importação da FEPESE agora reconhece alternativas minúsculas `a.` a `e.` e remove `SQUARE` / `Check-square`, que revelavam a resposta correta ao aparecer como imagem.
- Quando há conteúdo gráfico, o importador preserva o texto anterior e posterior, recortando somente a área da figura. No PDF FEPESE da questão 2, a imagem fica entre o título da questão e a linha de fonte, sem incluir alternativas nem gabarito marcado.
- Questões comuns são apresentadas como enunciado e cinco alternativas selecionáveis em texto; não são convertidas em imagem completa só por mencionarem tabelas ou planilhas.
- Reimportar o mesmo caderno pode atualizar uma prova antiga salva com 40 imagens, preservando IDs, códigos, respostas, tentativas e simulados. Não cria uma segunda cópia quando existe uma prova correspondente; quando há dúvida, bloqueia a atualização.
- O Worker inclui validação estrita para aceitar somente melhoria de extração; mudanças em resposta oficial, enunciado, origem, disciplina ou código não são aceitas.
- O site confirma a atualização com a sincronização antes de informar sucesso; se o Worker ainda não tiver sido implantado, sinaliza a pendência sem anunciar uma migração bem-sucedida.
- Testes automatizados cobrem alternativas, marcações, recorte, proteção dos registros e sincronização. **Ainda é necessário conferir o resultado real da reimportação no navegador e garantir a implantação atualizada do Worker na Cloudflare.**
- A classificação personalizada por conteúdo programático de editais será tratada em uma etapa separada.

## Versão 0.6.6 — FEPESE Brusque S01 e extração fiel

- **Prova:** 2026, Município de Brusque/SC, banca FEPESE, cargo **S01 Analista de Informática**; o caderno anuncia **40 questões**.
- **Gabarito multicargo:** seleciona exclusivamente a seção S01, sem misturar outros cargos; tabela horizontal de 1 a 40 com letras A–E. Se o código ou cargo for ambíguo, a importação continua bloqueada.
- **Numeração:** listas internas recuadas não viram novas questões. A proteção específica se aplica ao formato FEPESE, preservando leitores de outras bancas.
- **Texto 1:** preserva os artigos legais que começam na coluna esquerda e continuam na direita, antes da questão 1.
- **Contagem:** a mensagem "PDF declara X" só é usada para total anunciado na capa, jamais para um número parcial de respostas extraídas.
- **Metadados e disciplinas:** FEPESE e Município de Brusque reconhecidos; Português (1–5), Conhecimentos Gerais (6–8), Raciocínio Lógico (9–13), Legislação (14–20), Informática/Conhecimentos Específicos (21–40).
- **Integridade:** não modifica provas, perfis, tentativas e gabaritos preexistentes. Testes automatizados adicionados. A importação integral dos PDFs originais em navegador ainda precisa de conferência.

## Versão 0.6.5 — Meu histórico em português e multisseleção

O campo **Meu histórico**, usado nos filtros de Questões e Simulados, deixou de ser uma lista de seleção única com rótulos internos em inglês. Agora usa três caixas independentes, traduzidas:
- **Não respondidas**
- **Erradas**
- **Acertadas**

O usuário pode marcar uma, duas ou as três simultaneamente. A busca reúne (critério **OU**) todas as categorias marcadas. **Se nenhuma caixa estiver marcada, todas as situações são incluídas.** Assim, por exemplo, marcar Não respondidas + Erradas traz questões inéditas e aquelas cuja resposta mais recente foi incorreta.

O filtro continua baseado na última resposta válida **do perfil ativo**, não modifica tentativas anteriores e vale também para a geração de simulados. Ao executar a busca, a escolha permanece marcada na tela. O algoritmo mantém compatibilidade com o parâmetro antigo `outcome` de seleção única e agora aceita `outcomes` como lista de valores.

A apresentação das caixas foi ajustada para leitura em celulares, sem alterar o formulário das demais disciplinas ou o conteúdo das provas. Adicionados sete testes sobre seleções únicas, duplas e triplas, ausência de seleção, histórico separado por perfil, tradução e compatibilidade com filtros anteriores.

Nenhuma limpeza do banco é necessária.

## Versão 0.6.4 — Quadrix: alternativas numéricas e recuperação fiel

**Erro reproduzido:** na prova Quadrix/CRQ-V de Analista de Informática, o importador identificou 46 de 50 questões. Perdeu as questões 16, 17, 18 e 20, reconheceu só duas alternativas na 25 e quatro na 43.

**Correções:**
- Valores numéricos curtos (`4`, `24`, `36` etc.) não são mais descartados automaticamente como se fossem números de página. A verificação geométrica dos itens foi ajustada para recuperar letras e números com pequenas diferenças verticais ou horizontais.
- Quando o PDF separa o título `QUESTÃO` do respectivo número em itens gráficos, o leitor recompõe o cabeçalho. Um título explícito `QUESTÃO N` não é tratado como número solto do enunciado.
- Uma questão não é descartada porque o texto das alternativas ficou incompleto. Caso a transcrição textual falhe, o sistema gera um **recorte visual com a questão inteira e as alternativas originais**. O usuário continua podendo selecionar A–E e consultar o gabarito oficial, mas o texto das opções não é inventado.
- O recorte de recuperação inclui **todas as alternativas**, em vez de parar antes da alternativa A; para casos como a 25, termina antes da área de anotações.
- Questões apresentadas por imagem ficam com o estado **Revisão da extração** e são contabilizadas explicitamente na mensagem e na lista de provas.
- O controle de integridade permite o recorte visual **somente quando a imagem foi realmente gerada**. Se não houver imagem, persistirem questões ausentes ou o gabarito não tiver as 50 respostas correspondentes, a importação permanece bloqueada.

**Validação:** o PDF original foi inspecionado e contém os títulos explícitos das questões 1 a 50. A suíte automatizada inclui 85 cenários aprovados, entre eles uma simulação da prova com 50 questões e seis extrações propositalmente incompletas, recuperadas por imagem. A **importação integral no navegador com PDF.js ainda precisa ser confirmada**: não apresentar os testes simulados como prova de funcionamento em produção.

Não houve alterações no banco existente, nos perfis, nos gabaritos cadastrados ou nas estatísticas. Os arquivos originais da Quadrix podem ser importados novamente quando o rodapé indicar 0.6.4.

## Versão 0.6.3 — Identificação do cargo no gabarito Quadrix

O PDF de **Analista de Informática — CRQ-V — Quadrix 2026** traz o nome do cargo apenas no **rodapé** do caderno. A leitura espacial utilizada para separar questões descartava esse rodapé; consequentemente, a versão 0.6.2 não identificava o cargo ao selecionar uma das seções do gabarito multicargo.

**Corrigido:** `chosenAnswerSection` agora recebe, além do texto lido do PDF, o **nome real do arquivo da prova** (`analista_de_informatica (2).pdf`) e o **título inferido**. Os sublinhados do nome do arquivo são normalizados para espaços. A busca prioriza, nessa ordem, nome do arquivo, título inferido e texto do PDF. A seleção só é aceita se localizar uma seção de cargo única e explícita — nesse caso, **2.7 ANALISTA DE INFORMÁTICA (CÓDIGO 401)**.

A correção **não seleciona automaticamente o primeiro gabarito** e não permite misturar respostas de cargos diferentes. Se a identificação continuar ambígua, a importação permanece bloqueada para conferência.

Reproduzido em teste o erro com o rodapé excluído; após a correção, o gabarito da seção 401 contém 50 respostas, da questão 1 à 50. O fluxo completo em navegador ainda precisa de validação após a publicação do GitHub Pages.

Nenhum registro anterior foi excluído ou reimportado. Provas, respostas, perfis e estatísticas continuam preservados.

## Versão 0.6.2 — Anexo IV e referência real do cargo 505

O **Anexo IV — Conteúdos Programáticos** do Edital nº 01/2026 de Candeias do Jamari foi recebido e organizado com o cargo **505 — Analista de Tecnologia e Informática** como referência exclusiva para este modo de estudo.

- **Base curricular:** `programa-candeias-505.mjs` registra seis grupos exigidos no nível superior: Português (p. 4), Raciocínio Lógico (p. 4), Noções de Informática (p. 4–5), Legislação Municipal (p. 5), Conhecimentos Gerais (p. 5) e Conhecimentos Específicos do cargo 505 (p. 7). Os subtópicos são uma organização resumida da redação do Anexo IV.
- **Consulta no site:** em Questões e Simulados, o usuário pode abrir o painel recolhível **Consultar conteúdo programático — Candeias, cargo 505**. O painel não interfere no banco de questões e não altera as importações.
- **Legislação Municipal efetivamente prevista no Anexo IV:** **Lei Orgânica do Município**, **Resolução nº 001/CMCJ-93** e **Resolução nº 173/CMCJ/2025**. O módulo não confunde essa lista com leis apenas citadas na apresentação geral do edital.
- **Leis Municipais nº 100/1997, nº 1.267/2021 e nº 1.268/2021:** citadas no preâmbulo do edital principal, mas não nomeadas na lista da disciplina **Legislação Municipal** do Anexo IV do cargo 505. **Não acrescentá-las à disciplina sem previsão adicional.**
- **Lei Federal nº 13.709/2018 (LGPD):** exigida expressamente no encerramento de Conhecimentos Específicos do cargo 505 (p. 7). É conteúdo de TI neste edital e não uma quarta norma da lista de Legislação Municipal.
- **Programa específico de TI:** internet e Web, hardware/memória/drivers/CPU, montagem/manutenção, BIOS/UEFI, segurança, Windows 10/11, redes/IP/sub-redes, Office e Access 2016/2019/365, software livre/Linux/LibreOffice, algoritmos/programação estruturada, orientação a objetos e LGPD.
- **Adaptação jurídica automática:** mantém-se limitada às regras com fundamento legal verificado no catálogo existente. A **Resolução nº 001/CMCJ-93** consta agora como exigida, mas nenhuma adaptação com artigo dessa resolução será criada até seu texto oficial ser conferido e incorporado ao catálogo.
- **Não há bloqueio automático por assunto:** o painel fornece referência para futuras análises de aderência. Como a classificação de questões ainda é aproximada, não se excluem questões de TI ou Português apenas porque não houve correspondência textual por palavras-chave.

**Dados preservados.** Nenhuma prova, gabarito, resposta ou perfil foi zerado. Este registro curricular não exige reimportar documentos. O código de publicação do GitHub Pages foi ajustado para disponibilizar o novo módulo público.

## Versão 0.6.1 — Importação Quadrix CRQ-V 2026 e referências de Candeias

**Falha corrigida:** o leitor anterior exigia `1.` para reconhecer uma questão. A Quadrix usa títulos `QUESTÃO 1`, `QUESTÃO 2` etc., sem ponto. A importação do caderno de **Analista de Informática, CRQ-V, Quadrix, 2026** agora reconhece as 50 questões objetivas e mantém o texto-base comum às questões 1–15, mesmo aparecendo na outra coluna e em páginas seguintes.

**Gabarito:** o PDF enviado reúne vários cargos e organiza as respostas em linhas horizontais, com números separados das letras. O importador passa a selecionar especificamente **2.7 ANALISTA DE INFORMÁTICA — CÓDIGO 401** e reconstruir as 50 correspondências. Não mistura respostas de outros cargos. O gabarito fornecido é **preliminar**, e isso fica sinalizado na lista de provas.

**Integridade:** o total de questões esperado passa a ser derivado da seção de gabarito selecionada, evitando confundir a numeração de outra seção do PDF com uma quantidade declarada. A importação continua bloqueando provas incompletas ou inconsistentes. Foram registrados testes com 50 títulos de questão, opções A–E, texto compartilhado entre colunas, gabarito 401 e metadados do CRQ-V.

**Disciplinas oficiais do gabarito (nível superior):** 1–15 Língua Portuguesa; 16–25 Raciocínio Lógico e Matemática; 26–50 Conhecimentos Específicos (Analista de Informática). A classificação segue essa divisão por número, sem transformar questões de Português em Informática.

**Legislação de Candeias do Jamari — Edital nº 01/2026 consolidado até a Retificação nº 01:** o documento enviado menciona a Constituição Federal, a Lei Orgânica Municipal de 11/10/1993, a Lei Municipal nº 100/1997 (regime jurídico), a Lei Municipal nº 1.267/2021 (estrutura da Câmara), a Lei Municipal nº 1.268/2021 (quadro efetivo e remunerações) e a Resolução nº 173/CMCJ/2025. O item 1.5 exclui leis e alterações que entrarem em vigor após a publicação do edital. Esses atos foram registrados em `study-context.mjs` como referências; **não constituem, por si só, validação de artigos ou gabaritos adaptados**.

**Registro histórico da 0.6.1:** naquele momento, o PDF principal de 63 páginas citava o Anexo IV sem incluí-lo. O Anexo IV foi fornecido e incorporado na versão 0.6.2. A lista de legislação efetivamente cobrada está documentada acima; atos mencionados apenas no preâmbulo não foram incluídos automaticamente.

Não houve limpeza, reimportação automática nem alteração de gabaritos de provas anteriormente cadastradas. O usuário pode continuar importando normalmente. A visualização final no navegador precisa ser validada após a atualização do GitHub Pages.

## Versão 0.6.0 — Adaptação automática de legislação municipal

**Decisão de produto:** o usuário não precisa mais pedir aprovação prévia para toda adaptação. O site pode criar automaticamente uma versão nova de uma questão de outra cidade quando a matéria coincide com um dispositivo previamente conferido na legislação oficial de Candeias do Jamari. Uma adaptação nunca sobrescreve a questão, o gabarito ou o código original.

**Como funciona:**
- O Cloudflare Worker verifica novas questões de legislação durante a sincronização. Para questões já importadas, o site consulta o endpoint `POST /api/auto-adapt` ao iniciar e ao usar o modo Candeias.
- O módulo `legal-adapt.mjs` contém dez modelos de adaptação **baseados em fatos normativos específicos e verificáveis**. A nova questão tem ID, código, gabarito, alternativas, fundamento legal, artigo e URL de fonte próprios.
- A correção de uma questão adaptada apresenta **automaticamente** a justificativa e o artigo, tanto nas questões avulsas quanto **após a finalização** de um simulado. Não é necessário consumir créditos de IA para essa explicação; ela deriva diretamente do dispositivo jurídico catalogado.
- Cada usuário pode clicar em **Sinalizar erro na adaptação**, informando o problema. O relato segue para as Issues do GitHub e não apaga a questão original.
- Se a correspondência for ambígua ou não existir, **nenhuma adaptação é inventada**: a questão original é considerada inaplicável ao modo Candeias e permanece acessível no modo **Prova original, sem adaptação**.
- Questões oficiais de Candeias não precisam ser adaptadas; aparecem no modo local normalmente.
- A nova adaptação conta como questão distinta para estatísticas e traz vínculo explícito com a original. Provas completas preservam somente as questões originais.
- Este mecanismo **não é uma tradução jurídica universal**: o catálogo inicial cobre disposições dos artigos 2º, 4º, 5º, 6º, 7º, 16, 17 e 26 da Resolução nº 173/CMCJ/2025, e artigos 63 e 65 da Lei Orgânica municipal. Outros temas dependerão de ampliar e conferir o catálogo; até lá, não serão adaptados.
- A legislação pode sofrer mudanças. As fontes precisam ser revistas periodicamente, particularmente antes de concursos com edital e data de corte diferentes.

**Fontes primárias do catálogo:**
- Resolução nº 173/CMCJ/2025 (Câmara Municipal): https://athus4.candeiasdojamari.ro.leg.br/transparencia/documento/ver/25935D61EE0A1BFB7E6F55E9168A5A42D2BE25A6/
- Lei Orgânica do Município de Candeias do Jamari: https://www.candeiasdojamari.ro.leg.br/leis/lei-organica-municipal/lei-organica-do-municipio-de-candeias-do-jamari/at_download/file

O site continua com GitHub Pages + Worker, sem banco novo e sem limpar registros existentes. O binding de IA permanece para explicações gerais, mediante solicitação; a adaptação normativa controlada não precisa de IA por questão. É necessário confirmar a publicação da nova versão do Worker na Cloudflare para que as adaptações automáticas funcionem em produção.

## Versão 0.5.0 — Explicações de IA e referência Candeias

**Nenhuma prova ou questão foi apagada.** As importações, códigos, gabaritos, perfis e tentativas existentes permanecem preservados.

- O botão **Explicar questão** aparece depois da correção de uma questão avulsa ou da finalização de um simulado. Importar questões não consome IA.
- O servidor Cloudflare Workers AI usa um binding privado chamado AI e o modelo de texto Meta Llama 3.1 8B FP8 Fast. Não há chave de IA no navegador.
- As explicações são armazenadas em arquivos individuais dentro de data/explanations, no GitHub público. Todos os perfis reutilizam o mesmo resultado. Se enunciado/gabarito mudar, a impressão digital do conteúdo invalida o cache.
- Quando a franquia gratuita termina, as novas explicações ficam indisponíveis até o próximo período; as explicações já salvas podem continuar sendo consultadas. Não há contratação automática de plano pago.
- A impressão dos simulados em andamento deixa de incluir o gabarito. A tela de resultados e o gabarito ficam disponíveis apenas após finalizar.
- O contexto legislativo inicial passa a ser **Candeias do Jamari — RO**, com seleção entre legislação local validada e prova original. Legislação institucional de outras cidades sem equivalência comprovada fica fora dos simulados adaptados, mas permanece no banco original.
- Na versão 0.5.0, as adaptações jurídicas dependiam de aprovação manual. **Regra substituída na versão 0.6.0:** adaptações podem ser publicadas automaticamente quando existir um fato jurídico previamente conferido no catálogo oficial; o usuário pode sinalizar eventual erro.
- As explicações automáticas de questões dependentes de figura e de normas municipais não verificadas ficam suspensas para evitar respostas inventadas.

### Cloudflare e publicação

A configuração do Wrangler habilita o binding AI e aponta para o Worker já conectado ao site, estatistica-das-provas. O código depende de publicação automática via integração GitHub/Cloudflare ou implantação com Wrangler. O segredo GITHUB_TOKEN deve permanecer apenas no Worker; não precisa criar token da OpenAI ou do Gemini.

Os testes de regras e integração acompanham o repositório. As alterações são retrocompatíveis e não requerem migração do arquivo principal de dados. Quando houver novo edital, o município poderá ser modificado sem apagar as provas.

### Itens e sobrescritos tipográficos — versão 0.4.3

- **Questão 9:** cada passagem que começa com um marcador `•` é exibida em uma linha própria, preservando o enunciado introdutório e a pergunta final. Esse padrão vale também para outras listas estruturadas.
- **Questão 37:** pares de nomes e hashes de 32 a 64 dígitos são apresentados em linhas individuais.
- O PDF usa letras sobrescritas menores em ordinais como `1º parágrafo`, `2º parágrafo` e `nº 04`. A ordenação vertical anterior interpretava a letra `o` como uma linha própria, podendo colocá-la no texto ou na alternativa E da questão anterior. O leitor agora associa apenas esses glifos menores ao número ou à abreviatura correspondente usando fonte, distância e coordenadas da página, sem apagar artigos legítimos.
- Conferência no PDF original: a alternativa **E da questão 4** termina em `à` (o `o` indevido pertence a `1º parágrafo` da questão 5); a alternativa **E da questão 21** termina em `Mesa Diretora.` (o `o` indevido pertence ao `nº 04` da questão 22). Não é correto transformar `à` em `ao`.
- A impressão também preserva as quebras dos itens. Foram adicionados testes para listas, hashes, ordinal e integridade das alternativas; **47 testes automatizados passaram**.

### Frações em PDF — correção de posição (v0.4.2)

Os PDFs VUNESP apresentam frações com numerador e denominador em alturas diferentes da linha do parágrafo. A versão anterior reconhecia o valor (`11/9`, `3/2`, `3/8`, `7/8`), mas **mantinha a fração na altura do numerador**, deslocando-a para outra linha ou juntando duas frações na mesma parte do texto. O resultado eram frases fora de ordem nas questões 11 e 15.

Agora a fração reconstruída é posicionada na linha do texto vizinho, de acordo com a geometria original do PDF, e recebe espaçamento apropriado em relação às palavras e à pontuação. Assim não se duplicam valores nem se perde a posição da fração. Dois novos testes reproduzem as coordenadas dessas questões observadas no PDF original, que são verificados antes de cada publicação de código. **41 testes automatizados passaram** após as alterações.

Essa detecção continua conservadora e não garante reconhecimento de todos os formatos de equações, matrizes ou frações de outras bancas; nesses casos, deve-se preservar a fonte visual para conferência.

### Ajustes na extração e na tela de resolução — v0.4.1

- Os textos de apoio passam pela mesma limpeza dos enunciados: remoção conservadora de hifens artificiais e restauração de palavras fragmentadas.
- Corrigidas sobras tipográficas de ordinais, como o `o` solto em alternativas referentes ao `3º slide`, sem remover artigos legítimos.
- Removida a legenda repetida "Arquivo pessoal; imagem usada com autorização" da representação textual e dos recortes, preservando-a no PDF original.
- As imagens de desenhos (questão 17), tabelas (questão 19) e planilhas (questão 26) são delimitadas entre o texto anterior e o posterior. As frações simples (questão 11) permanecem em texto.
- Os metadados completos da prova ficam recolhidos em **Ver origem da questão**, mantendo o código permanente visível.
- A extração foi verificada com recortes do PDF original e por **39 testes automatizados**; outros modelos de provas e o uso em navegadores ainda precisam de validação.

### Correção de falhas de imagens — versão 0.3.2

Os erros "questão com alternativas não reconhecidas" em itens com figuras, tabelas ou frações eram indevidamente disparados quando **a renderização da imagem falhava**. Agora os problemas são independentes: só há erro de alternativas se o leitor realmente identificar menos de cinco ou a sequência A–E estiver incorreta.

O PDF.js passou a renderizar as páginas **antes de liberar seus recursos** (`page.cleanup()`). As páginas com figuras são renderizadas uma vez por página e recortadas; se houver falha, o navegador tenta uma escala de imagem menor. Erros remanescentes mostram número da questão, página e motivo, sem gravar uma importação incompleta.

A questão 34 da prova VUNESP menciona uma *tabela MAC* (estrutura de rede), mas não contém tabela gráfica: ela não deve acionar recorte de imagem. Os recortes das questões 11 (frações), 17 (desenho), 19 (tabela) e 26 (planilha) foram conferidos no PDF original por coordenadas e preservam as partes relevantes. Os testes automatizados não substituem a conferência da renderização no navegador do usuário.


### Textos de apoio compartilhados

Cada questão mantém o texto-base necessário para resolvê-la isoladamente. Quando duas ou mais questões consecutivas da mesma seleção (inclusive simulados) compartilham o mesmo texto-base, ele fica **aberto na primeira** e **recolhido nas seguintes**, com o controle *Ver texto de apoio novamente*. Quando houver outra questão no meio, a próxima questão do grupo mostra o texto novamente. Na impressão de questões selecionadas ou simulados, o mesmo texto não é repetido em questões adjacentes. A ocultação é somente visual: nenhum dado é apagado ou alterado.

## Melhorias de leitura e resolução — versão 0.4.0

- Enunciados e alternativas não conservam a largura estreita do PDF: quebras de linha artificiais e hifens de fim de linha são recompostos, com visualização responsiva na largura disponível.
- Frações simples compostas verticalmente no PDF podem ser reconstruídas de modo conservador como `3/8`, `11/9` etc. Quando a geometria do PDF não permite uma leitura segura, não é feita substituição arbitrária.
- Glifos privados são interpretados **somente com contexto confiável** (ex.: menus `Inserir → Objeto OLE`); outros símbolos desconhecidos permanecem para revisão.
- Questões com elementos gráficos podem ter a imagem entre os trechos de texto, quando o leitor detecta a área do desenho. Quando não consegue isolar a figura, o enunciado continua disponível como recorte da prova, mas **todas as alternativas A–E são exibidas em texto clicável**.
- Cada alternativa possui um botão **×** independente, que elimina visualmente a opção (cinza e riscada) e permite restaurar. O clique na alternativa continua marcando a resposta; eliminar uma alternativa selecionada em simulado a desmarca. Eliminações são anotações locais do navegador, identificadas por perfil e simulado; não entram nas estatísticas nem alteram o gabarito.
- A função de impressão continua usando as alternativas em texto, sem os botões de eliminação.
- Testes sintéticos do importador e das regras de negócio passaram. Ainda são necessários testes reais no navegador do usuário após a publicação.


## Versão 0.3.0 — importação espacial e validação

A importação continua pedindo **somente dois PDFs**: a prova e o gabarito. O leitor trabalha por **coordenadas da página**, separando as colunas da prova antes de reconhecer as questões. Para textos compartilhados por várias questões, mantém o vínculo do texto-base. Em questões com elementos visuais ou fórmulas, salva um recorte da questão original como imagem, preservando a possibilidade de responder pelas alternativas.

Quando o gabarito contém vários cargos, o sistema busca primeiro o **número da prova** e o **cargo** no caderno, seleciona a seção correspondente e rejeita documentos ambíguos ou incompatíveis. Antes de gravar, exige sequência consistente de questões, cinco alternativas por questão (provas no formato A–E), e gabarito completo. Se houver algum problema, nenhuma nova prova é cadastrada.

**Validação inicial com PDFs reais:** prova VUNESP 2026, Câmara Municipal de Votorantim, cargo 004 — Analista de Informática (16 páginas), mais gabarito com seis cargos (3 páginas). Extração espacial validada em uma simulação das coordenadas do PDF: **50 questões numeradas de 1 a 50, cinco alternativas por questão, dois textos-base associados aos grupos 1–5 e 6–10, e 50 respostas do gabarito 004**. Os recortes especiais foram preparados para questões como 11 (frações), 17 (figura geométrica), 19 (tabela), 26 (planilha) e 34 (elemento visual).

**Limitação ainda pendente:** a validação visual final, com os PDFs importados pelo navegador no celular, ainda precisa ser realizada. PDFs com diagramações diferentes, digitalizados ou apenas imagens podem exigir outros métodos, inclusive OCR; não há garantia de extração perfeita para todas as bancas. Gabaritos de certo/errado e questões com menos de cinco alternativas exigem regras adicionais antes de serem aceitos.

## Sincronização e armazenamento

O serviço Cloudflare Worker está conectado ao GitHub; a gravação e a leitura dos perfis **Wilber** e **TESTE** foram confirmadas em navegadores diferentes. Provas e respostas devem ser verificadas durante os testes. Nunca incluir tokens em arquivos públicos, prints ou conversas. A importação anterior com 49 questões foi removida, mantendo ambos os perfis e uma lista de IDs eliminados para evitar que navegadores desatualizados a recriem.

## Importação apenas com PDFs

O formulário solicita somente **PDF da prova** e **PDF do gabarito oficial**. O sistema tenta extrair automaticamente ano, banca, órgão e título a partir do conteúdo e do nome dos arquivos. Se algum dado não puder ser identificado, usa um marcador provisório e aponta a necessidade de revisão, sem inventar a informação.

No celular, o formulário deixa de ser redesenhado durante a sincronização com o GitHub, preservando os arquivos escolhidos. O nome selecionado também aparece abaixo de cada campo. A importação e a classificação de PDFs complexos continuam experimentais.

## Auditoria de importação (15/11/2026)

Foi observado um PDF impresso pelo navegador com questões VUNESP incorretamente separadas e classificadas. As melhorias da **versão 0.2.2** corrigem casos de marcas d'água, separação de questões, identificação de assuntos e preservação de páginas visuais. Quando uma importação tem números ausentes/repetidos, o sistema cancela o cadastro para evitar provas incompletas. O reconhecimento automático não garante 100% de fidelidade: PDFs com tabelas, duas colunas ou digitalizações ainda precisam de conferência.

**A prova VUNESP de 49 questões que já estava no GitHub não foi reclassificada nem removida.** Alterações de classificações já cadastradas dependem de aprovação do proprietário. Consulte [Issue #1](https://github.com/walarconborges/estatistica-das-provas/issues/1) antes de reimportar a mesma prova.

Para imprimir questões pelo navegador, os filtros são ocultados. É preferível usar o botão **Imprimir seleção**, que produz enunciados, cartão de respostas e gabarito.


## Funcionalidades

- Pergunta **Quem está aí?** ao iniciar, sem senha para os participantes.
- Perfis com estatísticas independentes e provas/questões compartilhadas.
- Importação de PDF ou texto e gabaritos compactos (ex.: `1A2B3C`).
- Classificação automática preliminar; sinalizações revisadas pelo proprietário no GitHub.
- Código permanente `Q+ANO+DISCIPLINA+ASSUNTO+BANCA+ÓRGÃO+SEQUÊNCIA`, ex.: `Q2026LPGIBGPSEMED1`. Quando uma classificação principal muda por aprovação, o código antigo é mantido como referência.
- Classificações secundárias aprovadas contam nas estatísticas próprias, sem duplicar a questão geral.
- Questões avulsas e simulados filtráveis, sorteio que prioriza inéditas, provas completas e cartões de respostas.
- Resultado do simulado e histórico da última resposta válida; questão em branco não conta como erro nem acerto.
- Anulação e desatualização aprovadas excluem a questão dos cálculos; gabarito e classificação alterados recalculam os resultados ao consultar novamente.
- Impressão A4, Arial 11, margem esquerda 2,5 cm, demais 1,5 cm.
- Simulados pendentes expiram em 30 dias; PDFs originais até 4 MB podem ser gravados no repositório quando a API estiver ativa.

## Ativar sincronização entre celular e computador

Não há autenticação dos perfis, **mas o GitHub exige autorização para modificar arquivos**, inclusive em repositórios públicos. O Worker guarda essa credencial; o visitante nunca a recebe.

A programação necessária está no repositório. Faltam apenas autorizações que exigem acesso à sua conta Cloudflare/GitHub.

### 1. Criar token restrito no GitHub

Acesse https://github.com/settings/personal-access-tokens e crie um **Fine-grained token**.

- Repository access: **Only select repositories** → `walarconborges/estatistica-das-provas`
- Repository permissions: **Contents — Read and write**; **Issues — Read and write**
- Defina o prazo de validade desejado. Quando vencer, será necessário substituir o segredo no Worker.

Guarde o token apenas para inserir no painel da Cloudflare. **Não envie o valor pelo chat.**

### 2. Publicar a API gratuita na Cloudflare

Acesse https://dash.cloudflare.com/ e abra **Workers & Pages → Create application → Connect to Git** (o nome pode variar conforme a interface). Autorize o GitHub e selecione **`walarconborges/estatistica-das-provas`**. O projeto já contém `wrangler.toml`; a implantação deve usar o Worker chamado **`estatistica-das-provas-api`** e o comando **`npx wrangler deploy`**.

Após criar o Worker, abra **Settings → Variables and Secrets** e acrescente um **Secret** chamado `GITHUB_TOKEN`, com o token da etapa anterior. As demais variáveis (owner, repository, branch, origins) já estão em `wrangler.toml`.

### 3. Conectar o site automaticamente

Abra no navegador:

`https://SEU-WORKER.workers.dev/api/setup`

Use o endereço `workers.dev` real que aparecer na Cloudflare. O Worker escreverá **somente sua URL pública** em `config.js` no GitHub e acionará a publicação do GitHub Pages. Esse endereço não é um segredo.

Quando aparecer `configured` ou `already-configured`, abra novamente o site e veja o indicador no topo: **GitHub sincronizado**. Isso confirma a leitura da versão remota. Para testar a gravação, crie um perfil de demonstração, espere o indicador voltar a sincronizado e abra o site em outro aparelho.

Também é possível inserir manualmente a URL do Worker em **Dados → Sincronização entre aparelhos**. Esta opção fica registrada somente no aparelho em uso.

### Se ocorrer erro

- `GITHUB_TOKEN` não configurado → registre o secret no Worker e publique-o novamente.
- HTTP 403 ou 404 no GitHub → confira as permissões do token e nome do repositório.
- `Alterações pendentes` → os dados continuam no navegador e a sincronização será retomada ao voltar a conexão. Evite limpar dados locais até normalizar.
- `PDF acima de 4 MB` → os textos extraídos poderão ser sincronizados, mas o PDF original não será copiado para o repositório.

## Revisões no GitHub

Ao sinalizar uma questão, a API grava a solicitação no banco e abre uma **Issue**. O proprietário acessa https://github.com/walarconborges/estatistica-das-provas/issues, verifica a evidência e comenta **exatamente** `aprovar` ou `rejeitar`. A automação só aceita comentários feitos pela conta proprietária do repositório e aplica a alteração autorizada.

Se o usuário apenas relatar um problema de extração, sem fornecer uma correção estruturada, o comentário `aprovar` registra a revisão, mas a transcrição deve ser corrigida separadamente.

## Arquitetura e armazenamento

- GitHub Pages: site estático público.
- Cloudflare Worker: leitura e gravação via API, sem expor o token.
- `data/state.json`: perfis, provas, questões, tentativas, simulados e sinalizações.
- `storage/pdfs/`: originais PDF carregados pelo serviço.
- `sync-client.mjs`: envia somente registros novos ou alterados; combina os dados recebidos de outros aparelhos; preserva o cache local.
- `worker/index.mjs`: limita operações públicas e impede alterações diretas de gabaritos e classificações de questões já cadastradas.
- `.github/workflows/revisar-sinalizacao.yml`: rotina administrativa para decisões via Issue.
- `.github/workflows/pages.yml`: testes e publicação do site.

A sincronização agrupa alterações após alguns segundos, sem gerar um commit por tecla. Para até cinco pessoas, essa arquitetura é adequada para testes, **mas um repositório Git não substitui um banco de dados transacional em escala**. Sem senha, qualquer visitante pode criar perfis, usar nomes existentes ou cadastrar provas; dados e PDFs do repositório são públicos. Há também risco de uso excessivo da API. Não utilize dados sensíveis neste protótipo.

## Testes e limites

```bash
npm run check
npm test
```

Os testes verificam parsing, códigos de questões, resultados, mesclagem de perfis e proteção contra edição direta do gabarito. Ainda faltam testes reais em dois aparelhos com a Cloudflare conectada e validação visual de PDFs difíceis (colunas, tabelas, gráficos e digitalizações). A extração automática é experimental, não garante fidelidade integral nem OCR completo.

Consulte [CHANGELOG.md](CHANGELOG.md) e [docs/diario-de-desenvolvimento.md](docs/diario-de-desenvolvimento.md) para decisões, problemas e correções.
