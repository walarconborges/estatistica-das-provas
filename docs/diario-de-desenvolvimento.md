# Diário de desenvolvimento

## 14/11/2026 — Sincronização entre dispositivos

**Problema:** o GitHub Pages publica arquivos, mas não concede autorização de gravação aos visitantes, mesmo no repositório público. A interface versão 0.1.1 armazenava dados apenas no navegador.

**Decisão e solução:** preservar a interface existente e adicionar um Cloudflare Worker para realizar leitura/escrita autorizada no GitHub. O token fica no secret do Worker e não no HTML/JavaScript público. O cliente envia alterações por ID, mescla registros já existentes e mantém uma cópia local. O código do Worker e o arquivo wrangler.toml estão no mesmo repositório.

**Problema de integridade:** alterar a classificação ou o gabarito diretamente pelo site poderia afetar as estatísticas de todos. A API ignora atualizações públicas a questões já cadastradas. Uma nova sinalização gera Issue; a automação aplica decisões exclusivamente por comentário da conta proprietária.

**Limitações e risco aberto:** ainda falta autorizar a Cloudflare e configurar o token pessoal de acesso; essa etapa exige ação do proprietário. Sem autenticação dos participantes, qualquer visitante poderá criar registros públicos. O GitHub pode sofrer excesso de commits se o volume crescer. O uso com PDFs de mais de 4 MB ou digitalizações grandes exige nova estratégia de armazenamento.

**Verificação:** módulos conferidos quanto à sintaxe; casos de mesclagem, idempotência e bloqueio de edição de gabarito avaliados em execução isolada; testes automatizados adicionados ao GitHub Actions. Não afirmar que o compartilhamento entre aparelhos foi testado até a implantação do Worker.


## 14/11/2026 — Migração para o repositório

**Objetivo:** evitar uploads manuais do usuário e colocar o código diretamente em `walarconborges/estatistica-das-provas`.

**Problema encontrado:** inicialmente havia somente um pacote ZIP no ambiente de trabalho. A integração de GitHub permite criar e alterar arquivos de texto, mas não enviou diretamente o arquivo ZIP binário completo.

**Solução adotada:** recriar no GitHub os arquivos da aplicação (HTML, CSS e JavaScript), incluindo núcleo de estatísticas, leitor de PDF, interface, testes e workflow de implantação. A configuração anterior, que esperava um ZIP, foi substituída por publicação direta de arquivos da raiz do repositório.

**Verificações executadas:** GitHub Actions executa `node --check` em módulos JavaScript e `npm test` com testes do núcleo. Uma execução com esses testes foi concluída com sucesso antes do ajuste da documentação.

**Decisões de produto preservadas:**
- Perfil perguntado a cada entrada, sem login.
- Numeração do simulado independente dos códigos permanentes.
- Código com Q, ano, disciplina, assunto, banca, órgão e sequência, sem Poder.
- Questão em branco não é erro nem acerto; resposta válida anterior continua como último resultado.
- Questões anuladas não entram nas estatísticas.
- Simulados pendentes expiram em 30 dias.
- Permissão para buscar deliberadamente questões já respondidas e anuladas.
- Duplicatas textualmente iguais podem existir nas respectivas provas, com seus códigos próprios.
- Propostas de classificação secundária devem ser avaliadas, não aplicadas sem aprovação.
- Priorizar questões inéditas, permitindo repetições.

**Limites não resolvidos:** gravação compartilhada no GitHub a partir de navegador público depende de serviço intermediário seguro. O GitHub Pages não executa código servidor. Implementar a API e testar conflitos de edição é uma etapa independente. O importador de PDF também precisa de comparação com provas reais, principalmente imagens, tabelas e colunas.

**Próxima validação:** abrir o endereço público em celular e computador, importar uma prova textual de exemplo, responder, imprimir e verificar o resultado; repetir depois com PDFs diferentes.
