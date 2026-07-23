# Changelog — Explorer 4.2.2-rc.1

## 2026-07-23

### Corrigido
- Corrigida a referência indefinida na Central da Trilha que impedia abrir o perfil do autor e iniciar uma conversa a partir dos detalhes da trilha.
- Substituído o fallback de avatar por um ativo existente e compatível com publicação estática.

### Adicionado
- Telemetria de erros do cliente com deduplicação, limite por sessão e remoção de e-mails, tokens e chaves.
- Marcador explícito de versão candidata.

### Segurança e privacidade
- A telemetria não coleta coordenadas, conteúdo de formulários, fotos, mensagens privadas ou contatos de emergência.
- Eventos são protegidos por RLS e associados ao usuário somente quando autenticado.

### Estado
- Candidata implementada e retida.
- Publicação em produção: não realizada.
- Gate pendente: preview precisa responder como `text/html; charset=utf-8`.
