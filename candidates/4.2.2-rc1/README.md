# Explorer 4.2.2-rc1

Primeira versão candidata do ciclo permanente de evolução.

## Objetivo

Elevar a confiabilidade operacional antes de acrescentar novas funcionalidades. Esta candidata adiciona observabilidade no navegador, autorrecuperação e critérios formais de release.

## Estado

- **Candidata:** validada em build isolado.
- **Produção:** não alterada.
- **Política:** a candidata somente poderá ser promovida junto da próxima versão aprovada.

## Artefato verificável

- Versão: `4.2.2-rc1`
- HTML autocontido: `181736` bytes
- Pacote GZIP: `45092` bytes
- SHA-256 do HTML: `f3b6016a34839e623fffedee908296cc3d55206e8aa2b6b0fcf4528743c2c6ce`
- Elementos HTML com IDs únicos: `210`

## Mudanças

- Captura de `window.error` e `unhandledrejection`.
- Fila offline de telemetria com reenvio automático.
- Deduplicação de erros repetidos.
- Redação de tokens, códigos de autenticação e e-mails.
- Self-check de Supabase, Leaflet, navegação, autenticação, trilhas e SOS.
- Faixa de recuperação com recarregar e limpar cache.
- Respeito a `prefers-reduced-motion`.
- Tabela `client_error_events` com RLS e sem leitura pelo cliente.

## Integração necessária

1. Carregar `observability.js` antes das bibliotecas externas.
2. Inserir o componente `systemHealthBanner` no início do `body`.
3. Aplicar os estilos descritos no changelog da candidata.
4. Definir `APP_VERSION` como `4.2.2-rc1`.

## Rollback

Nenhum rollback de produção é necessário, pois esta candidata não foi promovida.
