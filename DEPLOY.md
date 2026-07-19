# Deploy do Explorer

## GitHub

Repositório oficial:

```text
FrancoEvora/explorer
```

A branch de produção é `main`.

## Vercel

O projeto deve ser importado do repositório GitHub com:

- Framework Preset: Other
- Build Command: vazio
- Output Directory: vazio
- Root Directory: raiz

Cada push na `main` gera uma nova publicação.

## Supabase

Projeto: `Explorer`

```text
Project ref: qlatvknnzejjljbottxb
Region: sa-east-1
Bucket privado: explorer-media
```

O frontend usa apenas a URL do projeto e a chave publishable. O banco possui RLS e políticas de Storage por usuário.

## Atualização

```bash
git add .
git commit -m "Atualiza Explorer"
git push origin main
```

## Operação

- Crie a primeira conta pelo próprio aplicativo.
- Confirme o e-mail.
- Mantenha exportações JSON periódicas como cópia adicional.
- Em caso de mudança de domínio, atualize as URLs permitidas do Supabase Auth no painel.
