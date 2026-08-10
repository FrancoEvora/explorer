# Explorer 4.2.5 — candidata de escala e integridade de release

## Objetivo

Consolidar a observabilidade do navegador introduzida na 4.2.4 e remover dois riscos técnicos objetivos identificados na auditoria de 10/08/2026: políticas RLS com avaliação repetida de `auth.uid()` por linha e um workflow legado com permissão de escrita capaz de reconstruir o Explorer 4.0.3 no branch principal.

## Escopo

- incorpora integralmente a candidata 4.2.4;
- otimiza 12 políticas RLS usando `(select auth.uid())`, conforme recomendação oficial do Supabase, sem mudar papéis, ações ou predicados de autorização;
- preserva RLS ativa em todas as tabelas afetadas;
- não altera linhas de negócio nem tipos/colunas;
- remove o pipeline legado de publicação automática da 4.0.3;
- estabelece `VERSION` como fonte canônica de versão no repositório;
- adiciona gate de integridade de release somente-leitura;
- mantém rollback explícito de banco e de governança do repositório.

## Validação

1. A migração foi compilada integralmente dentro de transação e revertida com `ROLLBACK` antes de qualquer aplicação persistente.
2. Os gates de prévia executam o frontend combinado 4.2.4 + 4.2.5 em WebKit com perfil iPhone.
3. A suíte confirma ausência de overflow horizontal, inicialização da telemetria, redação de dados sensíveis, deduplicação e limite de eventos.
4. O gate SQL confere que as 12 políticas candidatas mantêm os mesmos papéis e comandos.
5. O gate de release impede reintrodução de workflow com escrita automática para versões obsoletas.

## Política de publicação

A 4.2.4 é a primeira candidata aprovada do ciclo e a 4.2.5 é a segunda. Somente após a 4.2.5 superar todos os gates o conjunto 4.2.4 + 4.2.5 pode ser promovido ao domínio oficial.

## Rollback

Ver `ROLLBACK.md` e `migrations/20260810_01_optimize_rls_auth_initplans.rollback.sql`.
