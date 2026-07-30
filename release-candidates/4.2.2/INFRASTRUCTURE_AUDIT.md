# Auditoria de infraestrutura — 30/07/2026

## Produção

- Domínio oficial respondeu HTTP 200.
- `Content-Type`: `text/html; charset=utf-8`.
- Políticas de geolocalização, câmera e microfone presentes.
- Nenhum grupo de erro de runtime foi encontrado nos últimos sete dias.
- Houve uma resposta HTTP 500 isolada nas últimas 24 horas durante a indisponibilidade do backend.

## Supabase

O projeto foi encontrado em estado `INACTIVE`, restaurado e confirmado como `ACTIVE_HEALTHY` antes do encerramento da auditoria.

Todas as 26 tabelas públicas possuem RLS habilitada e pelo menos uma política.

### Alertas de segurança para a segunda candidata

- Funções `SECURITY DEFINER` expostas ao papel `anon`, inclusive `get_or_create_conversation`, `is_conversation_participant` e funções de notificação.
- Proteção contra senhas comprometidas desativada.

Não foi aplicada migração nesta primeira candidata. A correção deverá ser implementada em migration reversível, validada antes da publicação conjunta.

### Alertas de desempenho

- Chaves estrangeiras sem índices de cobertura em mensagens, participantes, notificações, confirmações e itens salvos.
- Políticas RLS com avaliação repetida de `auth.*` por linha.
- Políticas permissivas duplicadas na tabela `risks`.

## Engenharia de release

A branch principal ainda não representa integralmente o bundle efetivamente servido em produção. A segunda candidata deverá consolidar uma fonte única, reproduzível e verificável para evitar divergência entre GitHub e Vercel.

## Decisão

Produção preservada em 4.2.1. A 4.2.2 permanece como primeira candidata retida.