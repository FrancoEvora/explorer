# Rollback — Explorer 4.2.5

## Frontend

A 4.2.5 incorpora a observabilidade de navegador da 4.2.4. Em caso de regressão após promoção, restaurar o artefato imutável `4.2.3-r1`, com 24 blocos, 192.254 bytes e SHA-256 `3a8e540625e2d35453a09807ec03c65f29232b991eaa14572c832bdc3e085a85`, e reimplantar a função oficial `explorer-v42` preservada na release 4.2.3.

## Banco

Executar `migrations/20260810_01_optimize_rls_auth_initplans.rollback.sql`. O script restaura as 12 políticas RLS às expressões anteriores. Nenhuma tabela, coluna ou linha é removida.

## Governança do repositório

O workflow legado `publish-explorer-v4.yml` não deve ser reativado em rollback comum, pois publicava automaticamente a versão 4.0.3. Se for necessário reconstruir um artefato histórico, fazê-lo em branch isolado sem permissão de escrita sobre `main`.

O arquivo `VERSION` deve refletir a versão efetivamente publicada. Se o frontend for revertido para 4.2.3, atualizar `VERSION` para `4.2.3` em commit de rollback controlado.

## Gates após rollback

Confirmar HTTP 200, `Content-Type: text/html; charset=utf-8`, versão/título 4.2.3, hash do artefato, Vercel `READY`, ausência de erros críticos e integridade das políticas RLS.
