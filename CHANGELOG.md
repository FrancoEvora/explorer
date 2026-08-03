# Changelog

Todas as alterações relevantes do Explorer serão registradas neste arquivo.

## [4.2.2] - 2026-08-03 — candidata retida

### Corrigido

- Fluxos **Ver autor** e **Mensagem** na central de trilha, eliminando referência a variável fora do escopo.
- Ação de mensagem não é mais exibida para a própria conta.
- Avatar padrão das superfícies sociais deixa de depender de rota estática potencialmente inexistente.

### Segurança

- Migração candidata revoga execução anônima de RPCs sociais `SECURITY DEFINER`.
- Funções exclusivas de gatilho deixam de ser executáveis diretamente por usuários autenticados.
- Permissões necessárias para conversas e políticas RLS são preservadas para `authenticated` e `service_role`.

### Validação

- Candidata aprovada nos gates locais e SQL, mantida fora da produção até a próxima versão aprovada.
