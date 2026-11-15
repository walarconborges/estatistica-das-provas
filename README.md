# Estatística das Provas

**Versão experimental 0.4.0 — 15/11/2026**  
**Site:** https://walarconborges.github.io/estatistica-das-provas/

Plataforma pública para importar provas de concursos, corrigir respostas, gerar simulados e imprimir questões, com histórico de desempenho por perfil.

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
