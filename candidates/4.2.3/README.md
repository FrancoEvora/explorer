# Explorer 4.2.3 — candidata de acessibilidade e confiabilidade móvel

## Objetivo

Consolidar a candidata 4.2.2 e elevar a experiência do Explorer em iPhone/Safari, navegação por teclado e tecnologias assistivas, sem alterar o modelo de dados nem remover funcionalidades existentes.

## Escopo

- Correções sociais herdadas da 4.2.2.
- Controle de foco, restauração de foco, `Tab` confinado e fechamento por `Escape` nos modais.
- Semântica `aria-hidden` e `aria-labelledby` aplicada dinamicamente.
- Foco visível e suporte a `prefers-reduced-motion`.
- Campos móveis em 16 px, viewport dinâmica, safe areas e áreas de toque mínimas de 44 px.
- Índices idempotentes para chaves estrangeiras críticas do módulo social e da telemetria.

## Estratégia de publicação

1. Gerar a release diretamente dos 44 blocos canônicos da 4.2.0.
2. Aplicar os patches aprovados da 4.2.2 e da 4.2.3.
3. Validar a função paralela `explorer-v423-release`.
4. Aplicar migrações de permissões e índices com rollback documentado.
5. Promover exatamente o mesmo código para `explorer-v42`.
6. Confirmar o domínio Vercel, headers, versão, erros e integridade do banco.

## Rollback

- Reimplantar a função `explorer-v42` versão 3 preservada no repositório.
- Executar os dois scripts `.rollback.sql`, em ordem inversa.
- Confirmar a versão 4.2.0 no domínio e a restauração dos grants anteriores, somente se necessária.
