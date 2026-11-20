# Explorer · Estação Fotográfica v1.0

Extensão não destrutiva para o **Explorer 4.2.3**, mantendo trilhas, áreas de risco, ocorrências, comunidade e SOS.

## Conteúdo
- Luz natural e posição do Sol por coordenada GPS ou manual, com janelas aproximadas de hora dourada.
- Meteorologia pontual via Open-Meteo (online).
- Assistente fotográfico com propostas de velocidade, abertura, ISO e foco por cenário.
- Cadastro editável de câmeras, lentes e acessórios, com sugestões pré-preenchidas.
- Diário fotográfico com título, espécie, notas, miniatura, EXIF JPEG (quando presente) e GPS opcional.
- Exportação do diário em JSON com miniaturas; original da foto nunca é alterado ou enviado.
- Diário salvo em IndexedDB e mochila/posição em localStorage **no dispositivo**, sem sincronizar com Supabase.

## Arquitetura
`api/index.js` encaminha a aplicação original do Supabase e acrescenta apenas o script de fotografia. A função principal, a autenticação, o banco e os recursos de segurança originais não são alterados.

## Limites
A disponibilidade da aplicação depende do projeto Supabase Explorer estar ativo. Em iOS, o GPS depende das permissões do navegador. Dados locais podem desaparecer se forem limpos; exporte o diário periodicamente. O assistente é baseado em regras técnicas e não realiza análise de imagens por IA.

## Implantação
Publicação independente no projeto Vercel **explorer**, sem alterar o site Solaris.
