# Relatório de QA — Explorer 4.2.4

**Data:** 10 de agosto de 2026  
**Estado:** candidata implementada e retida; publicação bloqueada  
**Produção preservada:** Explorer 4.2.3

## Auditoria de produção

- Vercel sem clusters de erro de runtime nos últimos 7 dias.
- Vercel Toolbar sem feedback pendente.
- Função oficial `explorer-v42` permanece ACTIVE na versão 9, servindo o Explorer 4.2.3.
- A tabela `client_error_events` existe, está protegida por RLS e não possuía eventos gravados no momento da auditoria.

## Mudança candidata

A 4.2.4 adiciona observabilidade de navegador sem alterar dados de negócio:

- buffer de erros durante inicialização;
- captura de `window.error`, `unhandledrejection` e falhas de recursos;
- redação de e-mails, JWTs, Bearer tokens, chaves publicáveis e valores de query string;
- deduplicação de assinaturas repetidas;
- limite de 12 eventos por sessão;
- metadados técnicos mínimos, sem latitude, longitude, conteúdo de formulário, foto, áudio ou mensagens privadas;
- reutilização da tabela `client_error_events` já existente, sem migração de schema.

## Prévia

A Edge Function isolada `explorer-v424-preview` está ACTIVE e constrói a candidata sobre a base imutável 4.2.3-r1, validando previamente o SHA-256 da base. O código da prévia mantém a produção intocada.

## Gate formal

O workflow GitHub Actions `Explorer 4.2.4 Quality Gates` falhou antes de iniciar qualquer job (`startup_failure`; zero jobs criados). Foram feitas tentativas de correção do workflow, inclusive remoção de entrada não essencial e adição de trigger por push na branch candidata, mas o GitHub continuou recusando a inicialização.

Como a política de release exige todos os gates verdes, a 4.2.4 **não é considerada liberada para produção** nesta execução.

## Rollback

Não há rollback de banco para esta candidata, pois nenhuma migração é necessária. Para descartar a mudança, basta não promover o artefato e manter `explorer-v42` na versão oficial atual.

## Decisão

**RETER. NÃO PUBLICAR.**

A candidata permanece versionada para continuidade futura. O bloqueio é exclusivamente o gate formal de CI que não chega a iniciar; a produção 4.2.3 permanece preservada.
