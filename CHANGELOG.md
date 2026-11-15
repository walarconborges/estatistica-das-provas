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
