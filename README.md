# Estatística das Provas

**Versão 0.1.1 — protótipo público, ainda em testes**

Site para estudar questões de concursos, importar provas, criar simulados, imprimir atividades e acompanhar estatísticas por usuário.

**Site:** https://walarconborges.github.io/estatistica-das-provas/

## O que funciona nesta versão

- Pergunta **“Quem está aí?”** em toda abertura. Os perfis não têm senha e seus resultados são separados.
- Banco de provas e questões compartilhado **dentro do navegador em uso**.
- Importação de PDF com texto extraível, texto colado e gabaritos em formato compacto (por exemplo, `1A2B3C`).
- Identificação inicial de disciplina e assunto conforme a estrutura e o conteúdo detectáveis na prova.
- Páginas do PDF sem texto utilizável podem ser preservadas como imagem, com revisão necessária.
- Código da questão: `Q` + ano + disciplina + assunto + banca + órgão + número crescente (exemplo: `Q2026LPGIBGPSEMED1`). Sem Poder e sem cargo.
- Questões avulsas e simulados com filtros por disciplina, assunto, ano, banca, órgão, situação e desempenho.
- Quantidade de questões definida pelo usuário; sorteio priorizando inéditas e evitando questões de conteúdo igual no mesmo simulado.
- Resolução de prova inteira na ordem original, com numeração original; simulados com numeração própria.
- Confirmação antes de finalizar quando houver questões em branco.
- Correção após finalizar, com acertos, erros, brancos e porcentagem sobre as questões efetivamente respondidas.
- Estatística considerando a última resposta **válida** de cada questão. Resposta em branco não é erro, não é acerto e não altera resposta anterior.
- Questões anuladas fora do resultado estatístico; a consulta pode incluí-las por filtro.
- Sinalizações de erros de classificação, conteúdo, gabarito, anulação etc. (por enquanto, locais).
- Simulados pendentes por até 30 dias, com aviso. Resultados concluídos ficam registrados.
- Impressão em A4, com gabarito e folha de respostas separados.
- Exportação e restauração de dados em JSON.

## Limitações atuais importantes

**Os dados ainda não são sincronizados entre aparelhos.** O site é publicado pelo GitHub Pages, mas as alterações que cada visitante faz ficam guardadas no armazenamento local do navegador. Um repositório público não oferece, por si só, permissão de escrita aos visitantes. Para sincronizar, será preciso configurar um serviço intermediário, com credencial de escrita protegida. Não coloque tokens no código público.

**As sinalizações ainda não são enviadas automaticamente para Issues.** Essa integração faz parte da próxima etapa. Até lá, os registros ficam no navegador e devem ser preservados por backup.

**O importador de PDFs ainda é experimental.** PDFs escaneados, duas colunas, tabelas, imagens e documentos com diagramação difícil podem exigir conferência humana. PDF.js é carregado pela internet durante a importação.

**A impressão da prova recria o conteúdo extraído.** Não substitui nem garante reprodução exata do PDF original.

**Códigos e classificações:** os códigos são calculados no cadastro; o sistema ainda não oferece o fluxo remoto de aprovação e recálculo de classificações. Isso é uma limitação conhecida, não uma função pronta.

**Sem segurança de perfil:** qualquer visitante que tenha acesso aos dados de um dispositivo pode selecionar qualquer nome nele. Não armazene dados pessoais sensíveis.

## Como testar

1. Abra o site e crie um perfil em “Quem está aí?”.
2. Vá para **Importar prova** e informe ano, banca e órgão.
3. Cole este exemplo:

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

4. Informe o gabarito `1A2B` e importe.
5. Acesse **Questões avulsas** ou **Simulados**, resolva e confira a estatística.
6. Experimente deixar uma questão em branco. Ela não deve reduzir o aproveitamento sobre respostas dadas.

## Desenvolvimento

Código publicado diretamente neste repositório, sem necessidade de o usuário fazer upload manual. Site estático em HTML, CSS e JavaScript ES Modules, com PDF.js carregado sob demanda.

- `index.html`: estrutura e navegação.
- `styles.css`: layout responsivo e impressão.
- `core.mjs`: regras de questões e resultados.
- `pdf-import.mjs`: leitura inicial dos PDFs.
- `app.mjs`: formulários, perfis, simulados e telas.
- `tests/core.test.mjs`: testes de regras de negócio.
- `.github/workflows/pages.yml`: testes e publicação pelo GitHub Actions.

Rodar localmente:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

Para executar os testes, com Node.js 20+:

```bash
npm test
npm run check
```

Documentação adicional: [Diário de desenvolvimento](docs/diario-de-desenvolvimento.md) e [CHANGELOG](CHANGELOG.md).

## Próximos passos

1. Validar a interface publicada em navegador real e testar PDFs de bancas diferentes.
2. Implementar sincronização segura com GitHub via serviço intermediário.
3. Implementar propostas de alteração como Issues e aprovação exclusiva pelo proprietário.
4. Aprimorar a extração por recortes de imagens, tabelas e alternativas.
5. Recalcular automaticamente as estatísticas após alterações aprovadas de classificação, gabarito e situação da questão.
6. Revisar desempenho e armazenamento antes de uso compartilhado contínuo.

O projeto é experimental. A importação exige revisão quando o sistema sinaliza incerteza.
