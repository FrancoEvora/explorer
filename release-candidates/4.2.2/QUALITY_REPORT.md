# Explorer 4.2.2 — Relatório de Qualidade

**Status:** candidata validada e retida; não publicada.

## Melhoria prioritária

Correção de confiabilidade nos detalhes das trilhas e evolução de acessibilidade dos modais.

### Correções

- Os botões **Ver autor** e **Mensagem** deixaram de referenciar uma variável inexistente no detalhe da trilha.
- A ação de mensagem não é exibida na própria trilha do usuário.
- Imagens de perfil ausentes recebem um fallback válido do aplicativo.

### Acessibilidade e UX

- O foco entra no modal ao abrir e retorna ao controle de origem ao fechar.
- A tecla Escape fecha o modal ativo.
- Estados de foco visível foram reforçados.
- Preferência de movimento reduzido passou a ser respeitada.
- A mensagem de autenticação foi convertida em região viva acessível.

## Banco e privacidade

A candidata não altera tabelas, políticas, dados, autenticação ou Storage. Não há migração. O rollback é integralmente de código.

## Gates executados

- Sintaxe JavaScript: aprovado em todos os módulos.
- Estrutura HTML e IDs essenciais: aprovada.
- Regressão dos controles de autor/mensagem: aprovada por teste estático determinístico.
- Proteção contra mensagem para a própria conta: aprovada.
- Foco, Escape, foco visível e movimento reduzido: aprovados por inspeção automatizada do bundle.
- Integridade do bundle: SHA-256 registrado no relatório operacional.
- Produção: preservada em 4.2.1.

## Compatibilidade móvel

As APIs introduzidas são suportadas no Safari/iOS moderno usado como alvo do Explorer: `Map`, `requestAnimationFrame`, `Element.focus`, `Array.prototype.at` e `prefers-reduced-motion`. O ambiente de execução não disponibilizou o binário WebKit para um teste end-to-end; por política, isso impede promoção direta, mas não impede a retenção desta primeira candidata.

## Rollback

Nenhuma ação em produção foi executada. Para descartar a candidata, basta remover a função de prévia e a branch `candidate/v4.2.2`.