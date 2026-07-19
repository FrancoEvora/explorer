# Explorer v1.0

Aplicativo pessoal para trilhas, registros de vida selvagem, fotografia e segurança em campo.

## Arquitetura definitiva

- **Frontend/PWA:** HTML, CSS e JavaScript, hospedado na Vercel.
- **Código-fonte:** GitHub, repositório `FrancoEvora/explorer`.
- **Banco:** PostgreSQL no Supabase, projeto `Explorer`, região de São Paulo.
- **Autenticação:** e-mail e senha pelo Supabase Auth.
- **Mídias:** bucket privado `explorer-media`, com políticas de acesso por usuário.
- **Segurança:** Row Level Security em todas as tabelas; cada conta acessa somente os próprios dados.
- **Resiliência:** cópia local no navegador para uso em campo, sincronização automática quando a internet retorna e snapshots periódicos no banco.

## Recursos

- Gravação de trilhas e pontos GPS.
- Mapa com trilhas, observações e riscos.
- Playback da rota em 1x, 2x, 4x ou 8x.
- Observações de fauna, flora, rastros e sons.
- Fotos de campo, fotos profissionais e áudios.
- Equipamentos fotográficos cadastráveis.
- Riscos e pontos úteis com imagem e localização.
- SOS, sirene, pisca visual, tentativa de lanterna e compartilhamento de coordenadas.
- Exportação JSON, CSV e GPX.
- Instalação como PWA.

## Primeiro acesso

1. Abra o Explorer publicado na Vercel.
2. Use `franco@evoraurbanismo.com.br`.
3. Toque em **Criar primeira conta** e escolha uma senha com pelo menos 8 caracteres.
4. Confirme o e-mail enviado pelo Supabase.
5. Volte ao aplicativo e toque em **Entrar**.

O projeto é restrito ao e-mail do proprietário tanto no aplicativo quanto no banco.

## Desenvolvimento local

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000`.

## Estrutura

- `index.html` — interface e autenticação.
- `app.js` — recursos de campo e funcionamento offline.
- `cloud.js` — autenticação, sincronização e Storage do Supabase.
- `styles.css` — identidade visual.
- `sw.js` — service worker e cache do PWA.
- `manifest.json` — instalação do aplicativo.
- `supabase/migrations/` — esquema versionado do banco.
- `vercel.json` — cabeçalhos e configuração de deploy.

## Segurança

A chave incluída no frontend é uma chave **publishable**, não uma chave secreta. A proteção dos registros é realizada por autenticação e políticas RLS. Nunca inclua uma chave `service_role` ou `secret` neste repositório.
