# Relatório de QA — Explorer 4.2.5

**Data:** 10 de agosto de 2026  
**Estado:** segunda candidata implementada; promoção bloqueada por gate formal  
**Produção preservada:** Explorer 4.2.3

## 1. Auditoria anterior à mudança

- Produção Vercel sem clusters de erro de runtime nos últimos 7 dias.
- Vercel Toolbar sem feedback pendente.
- Função oficial `explorer-v42` segue ACTIVE na versão 9, servindo 4.2.3.
- A tabela `client_error_events` estava vazia na auditoria, confirmando que a nova telemetria ainda não foi promovida à produção.
- As 12 políticas RLS candidatas ainda usam `auth.uid()` diretamente em produção; nenhuma alteração persistente foi aplicada.

## 2. Escopo da 4.2.5

A candidata incorpora a 4.2.4 e adiciona:

- otimização de 12 políticas RLS por meio de `(select auth.uid())`, preservando papéis, comandos e predicados de autorização;
- remoção, na branch candidata, do workflow legado capaz de reconstruir o Explorer 4.0.3;
- `VERSION` canônico em 4.2.5;
- gate de integridade da release;
- rollback explícito da migração e da governança de repositório.

## 3. Ensaio de migração

A migração completa das 12 políticas foi executada dentro de transação com `ROLLBACK` e compilou sem erro. Uma consulta posterior confirmou que a produção permaneceu inalterada: as 12 políticas continuam com a forma antiga, demonstrando que o ensaio não deixou efeitos persistentes.

Nenhuma linha de negócio, coluna ou tipo foi alterado.

## 4. Artefato imutável de prévia

Build: `4.2.5-r1`

- 25 blocos contíguos, sequência 0 a 24;
- 198.122 bytes UTF-8;
- SHA-256 `f4122ab17f20f66cc986fcb8d89498163582eea10e6b2affe4c2a0eafa280e76`;
- Edge Function isolada `explorer-v425-preview` ACTIVE;
- título e runtime 4.2.5 presentes;
- telemetria, redação, acessibilidade, viewport móvel, movimento reduzido e correções sociais presentes;
- marcação HTML anterior aos scripts com 204 IDs e zero IDs duplicados.

A prévia exige token específico e envia `no-store`/`noindex`, evitando indexação ou confusão com produção.

## 5. Privacidade e segurança

A telemetria herdada da 4.2.4 limita a coleta a 12 eventos por sessão, deduplica assinaturas e redige e-mail, JWT, Bearer token, chave publicável e valores de query string. O código não coleta latitude ou longitude para telemetria.

A política de inserção de `client_error_events` aceita usuário anônimo somente com `user_id` nulo e usuário autenticado somente quando `user_id` corresponde ao `auth.uid()` atual.

## 6. Gates bloqueadores

O GitHub Actions está recusando os workflows candidatos com `startup_failure` antes da criação de jobs. O último run inspecionado tinha zero jobs. A falha persistiu após simplificação do workflow e trigger explícito por push na branch candidata.

Além disso, as tentativas de atualizar metadados do PR 4.2.4 e de abrir o PR da 4.2.5 foram rejeitadas pelo GitHub com a exigência de haver pelo menos um endereço de e-mail verificado na conta.

Enquanto esses gates formais não estiverem resolvidos, a política profissional de release impede aplicar a migração e promover `explorer-v42` para 4.2.5.

## 7. Rollback

- A produção continua em 4.2.3, portanto não é necessário rollback de frontend nesta execução.
- A migração candidata possui script de reversão versionado.
- O ensaio SQL já foi revertido transacionalmente.

## 8. Decisão

**BLOQUEADA. NÃO PUBLICAR.**

As candidatas 4.2.4 e 4.2.5 permanecem versionadas e tecnicamente preparadas para nova rodada, mas a promoção está corretamente interrompida até que o ambiente GitHub execute os quality gates e permita a governança normal de pull requests.
