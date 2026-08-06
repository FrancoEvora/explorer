# Changelog

Todas as alterações relevantes do Explorer serão registradas neste arquivo.

## [4.2.3] - 2026-08-06 — publicada

### Acessibilidade e experiência

- Modais passam a controlar e restaurar foco, limitar a navegação por `Tab` e fechar com `Escape`.
- Diálogos recebem `aria-labelledby` e estado `aria-hidden` coerente.
- Mensagens de autenticação passam a usar região viva para tecnologias assistivas.
- Estados de foco ficam visíveis e movimentos respeitam `prefers-reduced-motion`.
- O SOS passa a ser fechado pelo gerenciador de modal, preservando o estado ARIA.

### iPhone e Safari

- Campos usam 16 px em telas móveis para evitar zoom automático do Safari.
- Modais e conversas usam viewport dinâmica (`dvh`) e áreas seguras do iPhone.
- Controles essenciais mantêm área mínima de toque de 44 px.
- Bloqueio de rolagem e overflow horizontal tornam-se previsíveis durante diálogos.
- Favicon, ícone de tela inicial e avatares padrão deixam de depender de arquivos estáticos externos.

### Social

- Incorpora as correções da 4.2.2 para **Ver autor** e **Mensagem**.
- A ação de mensagem não aparece para a própria conta.
- Perfis sem foto recebem avatar incorporado e consistente em todas as superfícies.

### Desempenho e banco

- Índices cobrem chaves estrangeiras críticas de mensagens, notificações, participantes, telemetria, confirmações de risco e alvos de itens salvos.
- Migrações são idempotentes, não alteram linhas e possuem rollback explícito.
- RPCs sociais privilegiadas permanecem bloqueadas para `anon`.

### Publicação e integridade

- O HTML final foi congelado como build imutável `4.2.3-r1`.
- Artefato: **24 blocos**, **192.254 bytes**.
- SHA-256: `3a8e540625e2d35453a09807ec03c65f29232b991eaa14572c832bdc3e085a85`.
- O servidor oficial valida sequência, quantidade e hash antes de entregar a página.
- Um seletor coletivo colapsado foi detectado pelo gate pós-build, corrigido e incluído como teste de regressão permanente antes da conclusão da release.
- Deployment oficial confirmado como `READY`, com `Content-Type: text/html; charset=utf-8` e nenhum erro de runtime na primeira janela pós-publicação.
- Endpoints temporários de candidata e prévia foram arquivados com autenticação obrigatória.

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
