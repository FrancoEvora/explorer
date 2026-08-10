# Explorer 4.2.4 — candidata de observabilidade do cliente

## Objetivo

Fechar o principal ponto cego operacional da 4.2.3: hoje a Vercel pode permanecer totalmente verde mesmo quando um navegador real sofre erro de JavaScript, falha de recurso ou rejeição de Promise. A 4.2.4 adiciona telemetria de erro no cliente sem alterar UX, modelo de negócio ou dados existentes.

## Escopo

- buffer de erros de inicialização antes do runtime completo;
- captura de `window.error`, `unhandledrejection` e falhas de recursos;
- deduplicação por assinatura do erro;
- limite rígido de 12 eventos por sessão;
- redação de e-mail, JWT, bearer token, publishable key e valores de query string;
- metadados técnicos mínimos: rota lógica, viewport, DPR, conectividade, visibilidade, modo visitante e presença de trilha ativa;
- nenhuma coleta de latitude, longitude, conteúdo de formulário, foto, áudio ou mensagem privada;
- integração com a tabela `client_error_events` já existente e protegida por RLS.

## Banco de dados

Nenhuma migração é necessária. A tabela `client_error_events` já existe, está com RLS ativa e permite apenas `INSERT` para `anon` e `authenticated`, exigindo `user_id IS NULL` para visitante e `user_id = auth.uid()` para usuário autenticado.

A ausência de DDL nesta candidata reduz o risco de rollback e mantém a produção de dados inalterada.

## Estratégia de validação

1. Validar a integridade do build-base imutável `4.2.3-r1` (24 blocos, 192.254 bytes, hash conhecido).
2. Compilar a função de prévia isolada `explorer-v424-preview` com JWT obrigatório.
3. Executar smoke test WebKit com perfil iPhone 13 em prévia local isolada que consome a produção 4.2.3 somente como fonte de leitura.
4. Interceptar a escrita de telemetria durante o teste para validar payload, redação, deduplicação e rate limit sem inserir dados sintéticos no banco de produção.
5. Revalidar Vercel, RLS, integridade referencial e ausência de regressões dos gates 4.2.3.

## Política de publicação

Esta é a primeira candidata após a publicação da 4.2.3. Mesmo aprovada, deve permanecer retida. A produção só poderá avançar depois que uma segunda candidata independente também superar os gates.

A validação final de publicação é executada pelo gate combinado 4.2.4 + 4.2.5, preservando esta candidata como primeira etapa auditável do ciclo.

## Rollback

Ver `ROLLBACK.md`. O rollback de frontend é puro e não exige alteração no banco.
