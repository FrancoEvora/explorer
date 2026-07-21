# Changelog

## 4.2.2-rc1 — 2026-07-20

### Adicionado
- Telemetria de erros JavaScript e rejeições de promises.
- Fila offline com reenvio automático após reconexão.
- Deduplicação de eventos repetidos em janela de 30 segundos.
- Redação de tokens, códigos de autenticação e endereços de e-mail.
- Self-check de módulos essenciais no início da aplicação.
- Interface de recuperação com recarregar e limpar cache.
- Suporte a preferência de movimento reduzido.
- Processo formal de quality gates e promoção a cada duas candidatas.

### Backend
- Tabela `client_error_events`.
- RLS ativado.
- Clientes possuem apenas permissão de inserção compatível com a própria sessão.
- Nenhuma leitura direta de telemetria pelo aplicativo.

### Validação
- Sintaxe aprovada em todos os módulos JavaScript.
- 210 IDs HTML únicos.
- Ausência de iframe e descompressão no navegador.
- HTML autocontido abaixo do orçamento de 200 KB.

### Status
- Candidata aprovada e retida.
- Não publicada em produção.
