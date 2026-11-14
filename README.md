# Estatística das Provas — Banco de Questões

**Versão experimental 0.1.0** · Site estático com sincronização opcional em GitHub · Sem cadastro por senha

Aplicação para importar provas, reunir questões, comparar respostas com gabaritos, estudar por disciplina e assunto, criar simulados aleatórios ou resolver a prova original inteira, consultar estatísticas individuais e imprimir atividades.

## Situação atual

O projeto foi **implementado como protótipo funcional**, mas **tem a publicação automatizada configurada no GitHub Actions, mas os arquivos da aplicação ainda precisam ser importados para o repositório e a sincronização depende de um Worker**. É possível testar imediatamente no modo local. A sincronização entre celular e computador depende de criar um repositório próprio, configurar a ponte Cloudflare Workers e informar a URL dessa ponte no site. O código-fonte não contém nenhuma credencial.

### Recursos já implementados

- Tela **“Quem está aí?” em toda abertura**, com perfis ilimitados e sem senhas.
- Biblioteca de provas e questões compartilhada; cada usuário possui histórico e estatísticas próprias.
- Código por conteúdo no formato `Q2026LPGIBGPSEMED1`: Q + ano + disciplina + assunto + banca + órgão + sequência. Não inclui Poder, cargo nem escolaridade. Um UUID interno preserva os registros independentemente das alterações do código público.
- Análise inicial do PDF da prova e do PDF do gabarito, com fallback em imagem quando a extração textual é precária. Também recebe texto colado e gabarito compacto `1A2B3C`.
- Variações de questões entre provas são conservadas com seus próprios anos e códigos. Textos/alternativas iguais (mesmo em ordem diferente) são agrupados para evitar repetição no mesmo sorteio. Comparações visuais são conservadoras.
- Classificação principal obrigatória e possibilidade de acrescentar secundárias **somente após solicitação e aprovação**.
- Filtros por disciplina, assunto, código, histórico e situação da questão.
- Questões avulsas, simulados de quantidade escolhida e provas completas na ordem original.
- Priorização de questões inéditas e, depois, questões não dominadas; questões corretas podem reaparecer.
- Página de resultado após concluir, com respostas, gabarito e situação de cada questão.
- Questões em branco **não contam como acerto ou erro**, não alteram o último resultado válido e podem aparecer novamente.
- O resultado consolidado do usuário considera a **última resposta válida** dada em cada questão. Todas as tentativas ficam no histórico.
- Anulações e gabaritos alterados por aprovação repercutem retroativamente nas estatísticas.
- Impressão em A4 com códigos, folha de respostas e gabarito em páginas separadas. Acesso ao PDF original quando disponível.
- Simulados pendentes por 30 dias, com aviso ao escolher o perfil. A expiração mantém a informação de exposição das questões.
- Sinalizações de classificação, gabarito, anulação, desatualização, problemas na extração e outros, com análise por **Issues e GitHub Actions**.
- Exportação/importação local de backup JSON e cache do PDF no dispositivo por IndexedDB.

## Teste local sem configurar GitHub

No Windows, você também pode dar dois cliques em `iniciar-site.bat` se tiver Python instalado. Ou, no terminal, a partir desta pasta:

```bash
python3 -m http.server 8000
```

Acesse `http://localhost:8000`. Também é possível abrir com um servidor estático do editor de código. **Não abra `index.html` diretamente como arquivo**, pois módulos JavaScript podem ser bloqueados pelo navegador.

Ao entrar, crie um perfil. Em **Importar**, preencha nome, ano, banca e órgão. Escolha um PDF ou cole o seguinte texto para uma primeira prova de demonstração:

```text
LÍNGUA PORTUGUESA
1) Qual palavra está grafada corretamente?
A) Exceção
B) Excessão
C) Esceção
D) Ecceção

MATEMÁTICA
2) Quanto é 20% de 100?
A) 10
B) 20
C) 30
D) 40
```

Gabarito oficial: `1A2B`. Depois confirme a importação, acesse o banco e crie um simulado.

**A leitura de PDF carrega PDF.js por CDN; precisa de internet.** O modo textual funciona sem PDF.js.

## Publicação no GitHub Pages

O repositório público usa **GitHub Actions** como fonte do Pages. Para importar a versão inicial, faça o upload do arquivo `estatistica-das-provas-v0.1.0.zip` **sem extrair**, na raiz do repositório (Add file → Upload files → Commit changes). O workflow `.github/workflows/pages.yml` extrai automaticamente os 21 arquivos do pacote, grava o código-fonte no repositório, executa os testes e publica a interface. O ZIP é apagado do repositório depois da extração.

Endereço previsto: https://walarconborges.github.io/estatistica-das-provas/

Essa etapa não ativa a sincronização entre dispositivos: para isso é necessário configurar o Cloudflare Worker descrito abaixo.

## Sincronização central no GitHub (sem senha dos participantes)

A leitura do repositório público não necessita de credencial, mas **alterar** `data/state.json` e enviar PDFs exige uma credencial de escrita. A aplicação nunca inclui esse token em arquivos servidos ao público: ele fica em um **Cloudflare Worker**. Essa abordagem não autentica os participantes, como decidido para o protótipo.

1. Crie uma conta Cloudflare (pode iniciar pelo plano gratuito).
2. No GitHub, gere um **fine-grained personal access token**, com acesso **somente ao repositório** `estatistica-das-provas` e permissões **Contents: Read and write** e **Issues: Read and write**. Nunca publique o token ou cole em conversas e arquivos do projeto.
3. Ajuste `wrangler.toml` com `GITHUB_OWNER` (seu login), `GITHUB_REPO` e, se quiser restringir acesso por origem de navegador, `ALLOWED_ORIGINS`. A variável de origem é apenas uma proteção adicional; **não é autenticação**.
4. No terminal, tendo Node.js e npm instalados, autentique o Wrangler e crie o segredo:

   ```bash
   npx wrangler login
   npx wrangler secret put GITHUB_TOKEN
   npx wrangler deploy
   ```

5. O Wrangler mostrará uma URL do Worker, por exemplo `https://estatistica-das-provas-api.<conta>.workers.dev`.
6. Para todos os dispositivos sincronizarem automaticamente, edite o arquivo público `config.js` no repositório e preencha `apiBase` com a URL do Worker. O arquivo **não recebe o token**, apenas o endereço público. Depois da publicação da alteração, qualquer celular/computador que abrir o site usará o mesmo GitHub. Alternativamente, é possível informar a URL uma vez na tela **Configurações** de cada navegador.
7. **Não misture dados locais já preenchidos com um banco remoto novo** sem exportar e avaliar a migração. No estágio inicial, é preferível conectar a sincronização antes de importar as provas reais.

> A gravação de uma resposta gera uma atualização do arquivo de dados no GitHub. Para volume maior, serão necessárias otimizações/banco de dados. O Worker restringe os tipos de operação, mas sua URL é pública e não está protegida contra uso abusivo. Não considere este projeto adequado para dados sensíveis.

### Limite de arquivos

Esta versão sincroniza PDFs com até **4 MB por arquivo**. Arquivos maiores podem ser analisados localmente, mas o PDF original não estará disponível em outros dispositivos. PDFs públicos no repositório poderão ser acessados por terceiros. Use somente documentos cuja publicação seja permitida.

## Aprovações de sinalizações

O participante abre a questão e clica em **Sinalizar problema**. A sugestão entra em `data/state.json` com status pendente, e o Worker cria uma Issue em `https://github.com/SEU_USUARIO/estatistica-das-provas/issues`.

O proprietário revisa a Issue e adiciona **exatamente um** destes rótulos do GitHub:

- `aprovado`: aplicar a mudança descrita;
- `rejeitado`: encerrar sem modificar a questão.

Crie esses dois rótulos uma vez em **Issues → Labels**, se ainda não existirem. O workflow `.github/workflows/revisar-sinalizacao.yml` reage ao rótulo somente se aplicado pela **conta proprietária do repositório**, atualiza o JSON pelo GitHub Actions, comenta e fecha a Issue. O site não contém botões de aprovação. Se houver conflito de escrita, o workflow falhará de forma visível e poderá ser reexecutado.

## Regras de estatística

- Na **estatística geral do perfil**, cada questão contribui com a última tentativa com resposta marcada; respostas em branco ficam no histórico, mas não substituem essa última tentativa.
- Gabaritos e status são lidos a cada cálculo: alterações posteriores **recalculam os resultados** dos usuários e simulados passados.
- Questões anuladas, desatualizadas ou sem gabarito não entram no denominador da taxa atual.
- Uma questão com secundárias aprovadas contribui para cada assunto correspondente, mas só **uma vez no total geral**.
- Na página de **resultado de um simulado**, questões em branco aparecem separadamente; o aproveitamento percentual usa acertos / (acertos + erros).
- Questões inéditas têm prioridade; depois vêm questões não dominadas ou apenas apresentadas; as acertadas ficam por último, com sorteio aleatório dentro de cada faixa.
- Simulado pendente expira após 30 dias: as respostas parciais são apagadas na normalização, mas o registro de que aquelas questões foram apresentadas é conservado.

## Limitações conhecidas

A extração de PDFs complexos ainda é experimental. Páginas em duas colunas, tabelas, fórmulas, textos escaneados e questões que atravessam páginas podem exigir correção. O fallback de imagens é aplicado quando o texto/alternativas parece insuficiente; **não substitui um OCR completo nem garante detectar toda tabela ou figura**. A classificação automática nesta versão é feita por regras simples de cabeçalhos e palavras-chave, não por IA treinada; questões ambíguas ficam como “Não classificada”. As sugestões do usuário e aprovações permitem melhorar o banco sem alterar os dados diretamente na interface.

Ainda não foi executada uma validação visual de ponta a ponta com PDFs reais do acervo do usuário. Consulte [`docs/diario-de-desenvolvimento.md`](docs/diario-de-desenvolvimento.md) para problemas, decisões e correções.

## Testes automáticos

```bash
npm test
```

Os testes usam o executor nativo do Node.js e não precisam instalar pacotes. A pasta `tests/` mantém verificações de regras de domínio e do leitor textual.

## Estrutura do projeto

```text
config.js                  URL pública do Worker para todos os dispositivos
index.html                 interface inicial
styles.css                 layout responsivo, tela e impressão A4
app.mjs                    navegação, interação e sincronização
core.mjs                   regras de domínio compartilhadas
pdf-import.mjs             leitura de PDFs, classificação e gabaritos
worker/index.mjs           API Cloudflare de escrita/leitura no GitHub
data/state.json            banco inicial do protótipo
.github/workflows/         aprovação externa via Issues
scripts/resolve-issue.mjs  rotina administrativa de atualização
iniciar-site.bat           inicialização local no Windows
wrangler.toml              configuração pública do Worker, SEM token
CHANGELOG.md               histórico de versões
docs/diario-de-desenvolvimento.md  problemas e soluções
```

## Evolução planejada

Melhor extração de imagens por região, detecção de colunas e OCR de PDFs digitalizados; migração assistida de dados locais para sincronizados; sincronização em lote e retomada robusta após perda de conexão; mais filtros (cargo, prova e banca), edição visual de enunciados via aprovação, impressão com escolhas específicas de páginas e folha de resposta; testes com diversos formatos de banca.