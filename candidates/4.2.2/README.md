# Explorer 4.2.2 — candidata retida

Status: **validada em prévia; não publicada em produção**.

## Objetivo

Aumentar a confiabilidade dos fluxos sociais ligados às trilhas e reduzir a superfície de execução anônima de funções privilegiadas do banco.

## Alterações

- Corrige `ReferenceError` nos botões **Ver autor** e **Mensagem** da central de trilha.
- Usa o autor da trilha armazenado em `currentTrail`, com validação defensiva.
- Oculta **Mensagem** quando o autor é o próprio usuário.
- Elimina dependência de arquivo externo para o avatar padrão em superfícies sociais.
- Eleva o identificador da aplicação para `4.2.2`.
- Inclui migração candidata para revogar execução anônima de RPCs `SECURITY DEFINER` e impedir execução direta de funções exclusivas de gatilho.

## Artefato validado

- HTML autônomo: 250.149 bytes.
- SHA-256: `b44ae79d03af5d50050b3f822bae74e196f859d57582d08312ac332120ac09ae`.
- Migração: somente permissões; nenhuma alteração de tabelas ou dados.

## Regra de promoção

Esta candidata permanece isolada. A promoção ao domínio oficial somente poderá ocorrer junto da próxima candidata aprovada, após repetição dos gates de segurança, compatibilidade, desempenho e rollback.