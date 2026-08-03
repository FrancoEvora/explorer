# QA Report — Explorer 4.2.2

## Decisão

**APROVADA COMO CANDIDATA E RETIDA.** Não promover nesta rodada.

## Escopo validado

- Ações `Ver autor` e `Mensagem` na central de trilha.
- Ausência de ação de mensagem para a própria conta.
- Fallback de avatar sem dependência de arquivo estático.
- Identidade visual e número da versão.
- Migração de grants das funções sociais privilegiadas.

## Gates executados

| Gate | Resultado |
|---|---|
| Sintaxe JavaScript (`node --check`, 8 módulos) | Passou |
| HTML válido e título 4.2.2 | Passou |
| IDs duplicados no DOM | 0 |
| IDs essenciais ausentes | 0 |
| Teste mock: abrir perfil do autor | Passou |
| Teste mock: iniciar conversa com outro autor | Passou |
| Teste mock: ocultar mensagem para o próprio autor | Passou |
| Migração SQL em transação com `ROLLBACK` | Passou |
| `anon` impedido de chamar RPCs sociais no dry-run | Passou |
| `authenticated` preservado nas RPCs necessárias | Passou |
| Funções de gatilho indisponíveis para chamada direta autenticada | Passou |
| Produção após rollback | Inalterada |
| Endpoint de saúde da prévia | HTTP 200; todos os marcadores verdadeiros |
| Bundle candidato isolado | HTTP 200; 179.910 caracteres |
| Carregador renderizável | HTTP 200; `text/html; charset=utf-8` |
| Erros Vercel nos últimos 7 dias | 0 |
| Telemetria de erros cliente registrada | 0 eventos |
| Feedback Vercel não resolvido | 0 threads |

## Prévia isolada

- Carregador HTML: `https://raw.githack.com/FrancoEvora/explorer/b329193c9d116074af80326411072182e38bedaa/candidates/4.2.2/preview-loader.html`
- Origem candidata: `https://qlatvknnzejjljbottxb.supabase.co/functions/v1/explorer-v422-preview`
- Saúde: `https://qlatvknnzejjljbottxb.supabase.co/functions/v1/explorer-v422-preview/health`
- Cabeçalhos: `no-store`, `noindex`, CORS restrito a leitura pública da prévia e `X-Content-Type-Options: nosniff`.

## Métricas do artefato

- HTML autônomo local: 250.149 bytes.
- GZIP local: 95.549 bytes.
- SHA-256 do HTML local: `b44ae79d03af5d50050b3f822bae74e196f859d57582d08312ac332120ac09ae`.
- Bundle derivado da produção na prévia: 179.910 caracteres.

## Riscos residuais

- Proteção contra senhas vazadas permanece desativada no Supabase Auth.
- Existem políticas RLS com `auth.uid()` não encapsulado em `select`, o que merece otimização futura.
- Há chaves estrangeiras sem índice de cobertura em tabelas sociais.
- O repositório principal ainda mantém artefatos históricos fragmentados; a consolidação do código-fonte deve entrar em um ciclo posterior.
- A prévia usa um carregador externo somente para QA; esse mecanismo não é candidato a produção.

## Rollback

- Código: descartar a branch `candidate/v4.2.2` ou restaurar a compilação 4.2.1.
- Banco: executar `20260803_01_harden_social_rpc_grants.rollback.sql`.
- Prévia: remover a função `explorer-v422-preview` e fechar o PR draft.
- Produção não foi modificada nesta rodada.