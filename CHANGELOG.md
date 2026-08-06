# Changelog

Todas as alterações relevantes do Explorer serão registradas neste arquivo.

## [4.2.3] - 2026-08-06 — candidata para publicação conjunta

### Acessibilidade e experiência

- Modais passam a controlar e restaurar foco, limitar a navegação por `Tab` e fechar com `Escape`.
- Diálogos recebem `aria-labelledby` e estado `aria-hidden` coerente.
- Estados de foco ficam visíveis para navegação por teclado e tecnologias assistivas.
- Movimentos e animações respeitam `prefers-reduced-motion`.

### iPhone e Safari

- Campos usam 16 px em telas móveis para evitar zoom automático do Safari.
- Modais e conversas usam viewport dinâmica (`dvh`) e áreas seguras do iPhone.
- Controles essenciais mantêm área mínima de toque de 44 px.
- Bloqueio de rolagem e overflow horizontal tornam-se previsíveis durante diálogos.

### Desempenho e banco

- Índices candidatos cobrem chaves estrangeiras críticas de mensagens, notificações, participantes, telemetria e confirmações de risco.
- Migrações são idempotentes, não alteram linhas e possuem rollback explícito.

### Validação

- A candidata incorpora integralmente as correções aprovadas da 4.2.2.
- Publicação conjunta condicionada à aprovação de todos os gates de prévia, segurança, integridade e produção.

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
