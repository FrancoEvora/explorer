# Rollback — Explorer 4.2.4

## Condição

A 4.2.4 não altera esquema, políticas, funções SQL ou linhas de negócio. Seu rollback é exclusivamente de frontend.

## Procedimento

1. Manter o domínio oficial apontado para a 4.2.3 enquanto esta candidata estiver retida.
2. Se a 4.2.4 vier a ser incorporada a uma release futura e for necessário reverter, restaurar o artefato imutável `4.2.3-r1` e a função oficial `explorer-v42` versionada na release 4.2.3.
3. Confirmar HTTP 200, `Content-Type: text/html; charset=utf-8`, título/runtime 4.2.3 e hash `3a8e540625e2d35453a09807ec03c65f29232b991eaa14572c832bdc3e085a85`.
4. Não excluir `client_error_events`: a tabela é retrocompatível e já existia antes desta candidata.
5. Arquivar a função de prévia `explorer-v424-preview` com JWT obrigatório ou removê-la após encerramento do ciclo.

## Perda de dados

Nenhuma. A reversão não exige transformação ou exclusão de registros.
