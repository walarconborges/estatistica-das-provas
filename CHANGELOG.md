# Histórico de versões

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
