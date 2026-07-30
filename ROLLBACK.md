# Plano de rollback — 4.2.2-rc.1

1. A candidata não altera banco de dados nem objetos de armazenamento.
2. Em caso de falha na futura promoção, reatribuir o alias de produção ao deployment Vercel `dpl_wFNkaFnDaBPaUo7cYirNmh2Phpbt`.
3. Restaurar a função de origem `explorer-v42` versão 3, caso tenha sido atualizada na etapa de publicação.
4. Confirmar `200`, `Content-Type: text/html; charset=utf-8` e título `Explorer 4.2` após o rollback.
