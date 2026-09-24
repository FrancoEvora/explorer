# Metropolitan — experiência interativa

Plataforma visual em português com navegação pela implantação aprovada, cinco pontos de interesse, nove quadras, percurso guiado, ampliação, arraste, gestos de pinça, navegação por teclado, apresentação e galeria com a visão aérea fornecida e três novas renderizações.

## Executar

Node.js 20 ou posterior. Sem dependências de execução.

```sh
npm start
# http://localhost:4173
npm run build
```

O build gera `dist/`. O `vercel.json` deste diretório permite importá-lo como projeto independente no Vercel, usando `npm run build` e saída `dist`.

## Publicação integrada

A publicação inicial usa `/metropolitan` no projeto Vercel já conectado a `FrancoEvora/explorer`, branch `solaris-imersivo-mobile`. O build do projeto pai copia apenas os oito arquivos públicos do Metropolitan, acrescenta a base `/metropolitan/` ao HTML e verifica que os seis arquivos existentes do Solaris continuam com o mesmo hash.

## Conteúdo e imagens

- `assets/implantacao.png`: a renderização da implantação aprovada na conversa, preservada sem nova geração.
- `portaria.webp`, `convivencia.webp`, `logistica.webp`: novas renderizações das respectivas imagens fornecidas no Google Drive, sem as logomarcas. WebP otimizado para a navegação.
- `visao-aerea.jpg`: imagem aérea enviada pelo usuário, aplicada diretamente, preservando o arquivo original. Primeira perspectiva da galeria, com ampliação e retorno à implantação.
- Fonte: pasta de imagens Metropolitan fornecida pelo usuário em 24/09/2026.
- Quadras 1–9 seguem a implantação. Os polígonos de interação são aproximados e não constituem cadastro técnico. O mapa não informa disponibilidade, dimensões ou preços de lotes.
- Perspectivas de ocupação são conceituais; não indicam empresas instaladas ou características contratuais.

## Edição

Textos, posições dos pontos e quadras: `app.js`. Estilos e regras responsivas: `styles.css`. Estrutura e acessibilidade: `index.html`.
