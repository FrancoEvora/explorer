# Changelog

Todas as alterações relevantes do Explorer serão registradas neste arquivo.

## [4.2.5] - 2026-08-10 — segunda candidata

### Escala e banco

- Otimiza 12 políticas RLS de telemetria, mensagens, notificações, marcadores, contatos de emergência, confirmações de risco e itens salvos.
- Substitui avaliações por linha de `auth.uid()` por initplans `(select auth.uid())`, mantendo os mesmos papéis, comandos e condições de autorização.
- Migração validada integralmente dentro de transação com `ROLLBACK` antes de aplicação persistente.
- Nenhuma linha, coluna ou tipo de negócio é alterado.

### Integridade de release

- Remove o workflow legado `publish-explorer-v4.yml`, que ainda reconstruía e escrevia automaticamente a versão 4.0.3.
- Corrige `VERSION`, que permanecia em 2.1.0, e passa a tratá-lo como fonte canônica no repositório.
- Adiciona quality gates somente-leitura para impedir reintrodução do publicador legado e divergência de versão.

### Qualidade

- Consolida integralmente a observabilidade da candidata 4.2.4.
- Prévia isolada e suíte WebKit/iPhone verificam renderização, overflow, modo visitante, redação, deduplicação e limite da telemetria.
- Rollback de banco e frontend permanece explícito e versionado.

## [4.2.4] - 2026-08-10 — candidata retida

### Observabilidade

- Adiciona buffer de erros de inicialização, captura de `window.error`, `unhandledrejection` e falhas de recursos no navegador.
- Registra eventos na tabela `client_error_events` já existente, sem criar nova superfície de banco.
- Expõe `Explorer.telemetry.capture()` para instrumentação controlada de fluxos futuros.

### Privacidade e resiliência

- Redação automática de e-mails, JWTs, bearer tokens, publishable keys e valores de query string.
- Telemetria não coleta latitude, longitude, conteúdo de formulários, fotos, áudios ou mensagens privadas.
- Deduplicação por assinatura e limite de 12 eventos por sessão evitam tempestade de logs.
- Falha da própria telemetria é silenciosa e não interrompe a aplicação.

### Qualidade

- Função de prévia isolada versionada com JWT obrigatório.
- Smoke test WebKit/iPhone valida renderização móvel, ausência de overflow, carregamento do runtime e funcionamento do modo visitante.
- Escritas de QA em `client_error_events` são interceptadas no navegador; nenhum evento sintético é gravado na produção durante os testes.
- Nenhuma migração de banco é necessária; rollback é exclusivamente de frontend.

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
