# Changelog

Todas as alterações relevantes do Explorer serão registradas neste arquivo.

## [4.2.3] - 2026-08-06 — publicada

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

- Índices cobrem chaves estrangeiras críticas de mensagens, notificações, participantes, telemetria e confirmações de risco.
- Migrações são idempotentes, não alteram linhas e possuem rollback explícito.

### Validação e publicação

- Incorpora integralmente as correções aprovadas da 4.2.2.
- Gates de release, segurança, integridade, entrega e rollback aprovados.
- Publicada no domínio oficial em 6 de agosto de 2026.

## [4.2.2] - 2026-08-03 — incorporada à 4.2.3

### Corrigido

- Fluxos **Ver autor** e **Mensagem** na central de trilha, eliminando referência a variável fora do escopo.
- Ação de mensagem não é mais exibida para a própria conta.
- Avatar padrão das superfícies sociais deixa de depender de uma rota estática potencialmente inexistente.

### Segurança

- Migração revoga execução anônima de RPCs sociais `SECURITY DEFINER`.
- Funções exclusivas de gatilho deixam de ser executáveis diretamente por usuários autenticados.
- Permissões necessárias para conversas e políticas RLS são preservadas para `authenticated` e `service_role`.

### Validação

- Candidata aprovada nos gates locais e SQL e posteriormente publicada como parte da versão 4.2.3.
