# Changelog

## 4.2.2-rc.1 — 2026-07-30

### Corrigido
- Ações **Ver autor** e **Mensagem** no detalhe de trilhas agora usam os identificadores presentes nos próprios botões, eliminando a referência indefinida que interrompia a interação.
- Rolagem horizontal involuntária na comunidade em telas móveis de 390 px.

### Melhorado
- Modais passam a receber foco ao abrir e devolvem o foco ao elemento de origem ao fechar.
- Tecla `Escape` fecha o modal padrão mais recente, sem interferir no modo SOS.
- Foco visível global para navegação por teclado e tecnologias assistivas.
- Marcador explícito de build `4.2.2-rc.1` no HTML e no runtime.
- Filtros da comunidade reorganizados em duas colunas no celular.

### Banco de dados
- Nenhuma migração. Estrutura e dados de produção permanecem inalterados.
