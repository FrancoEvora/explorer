# Relatório de QA — Explorer 4.2.3

**Data:** 6 de agosto de 2026  
**Decisão final:** aprovada e publicada em conjunto com a candidata 4.2.2  
**Domínio:** `https://explorer-six-self.vercel.app`

## 1. Auditoria anterior à mudança

- Projeto Vercel em produção: `READY`, sem erro de alias.
- Erros de runtime na Vercel nos sete dias anteriores: nenhum.
- Feedback pendente na Vercel Toolbar: nenhum.
- Integridade referencial: zero mensagens, participantes e notificações órfãos.
- Grants sociais: `anon` sem execução das RPCs privilegiadas; `authenticated` com as permissões necessárias.
- RLS preservada nas tabelas sensíveis inspecionadas.

## 2. Mudanças incorporadas

### Explorer 4.2.2

- Corrigido o uso de variável fora do escopo nos comandos **Ver autor** e **Mensagem** da central de trilha.
- A ação de mensagem deixa de ser exibida para a própria conta.
- RPCs sociais privilegiadas foram endurecidas contra execução anônima.
- Funções internas de notificação deixaram de ser executáveis diretamente por clientes.

### Explorer 4.2.3

- Entrada, confinamento e restauração de foco nos modais.
- Navegação por `Tab` limitada ao diálogo ativo e fechamento por `Escape`.
- `aria-hidden`, `aria-labelledby`, regiões vivas e foco visível.
- Compatibilidade com `prefers-reduced-motion`.
- Campos móveis em 16 px para impedir zoom automático no Safari.
- Viewport dinâmica (`dvh`), safe areas e áreas mínimas de toque.
- Proteção contra overflow horizontal e rolagem da página atrás de diálogos.
- Avatar próprio e avatares sociais deixam de depender de arquivos estáticos ausentes.
- Fechamento do SOS passa pelo gerenciador de modal e mantém o estado ARIA coerente.
- Favicon e ícone de tela inicial passam a ser incorporados ao HTML.

## 3. Banco, segurança e desempenho

Migrações aplicadas com sucesso:

1. `explorer_4_2_2_harden_social_rpc_grants`
2. `explorer_4_2_3_add_social_fk_indexes`
3. `explorer_4_2_3_add_saved_item_target_indexes`

Índices sociais e de telemetria adicionados:

- `conversation_participants_user_id_idx`
- `messages_sender_id_idx`
- `notifications_actor_id_idx`
- `client_error_events_user_id_idx`
- `risk_confirmations_user_id_idx`
- `saved_items_trail_id_idx`
- `saved_items_observation_id_idx`
- `saved_items_risk_id_idx`

Resultados:

- Nenhuma linha de negócio foi alterada pelas migrações.
- Zero mensagens, participantes e notificações órfãos após a aplicação.
- `anon` não pode executar `get_or_create_conversation`.
- `authenticated` preserva a execução necessária da RPC.
- Rollbacks dos índices e grants permanecem versionados no repositório.

## 4. Validação da candidata

A candidata foi validada em prévia paralela, sem alterar o domínio oficial, com:

- sintaxe dos módulos JavaScript aprovada;
- HTML sem IDs duplicados e com elementos essenciais presentes;
- emulação móvel automatizada em viewport `390 × 844` e densidade 3x;
- ausência de overflow horizontal;
- abertura de modal com foco interno;
- confinamento de `Tab`;
- fechamento por `Escape`;
- retorno do foco ao acionador;
- comandos **Ver autor** e **Mensagem** apontando para o usuário correto;
- mensagem oculta para a própria conta;
- zero erros de página no smoke test automatizado.

A validação móvel foi automatizada com perfil compatível com Safari/iPhone. Ainda não substitui uma fazenda física completa de dispositivos Apple.

## 5. Artefato final imutável

O HTML aprovado foi congelado em `app_build_chunks` e passou a ser servido sem reconstrução dinâmica.

- Versão: `4.2.3`
- Build: `4.2.3-r1`
- Blocos contíguos: **24** (`0` a `23`)
- Tamanho UTF-8: **192.254 bytes**
- SHA-256: `3a8e540625e2d35453a09807ec03c65f29232b991eaa14572c832bdc3e085a85`
- Função oficial: `explorer-v42`, versão **9**
- Fonte exata do servidor: `candidates/4.2.3/release-server.ts`

A função oficial valida, antes de servir:

- quantidade e sequência dos blocos;
- SHA-256 do HTML;
- versão e título;
- seletor coletivo correto dos modais;
- ausência da forma colapsada do seletor;
- acessibilidade, viewport móvel, correções sociais, avatar autônomo e SOS.

## 6. Ocorrência interceptada pelos gates

Durante a promoção, a inspeção do HTML real detectou que um seletor coletivo de modais havia sido colapsado de `$$('.modal')` para `$('.modal')`. Essa regressão poderia interromper a inicialização do aplicativo.

Providências adotadas:

1. a release não foi considerada concluída;
2. o HTML foi corrigido e congelado como `4.2.3-r1`;
3. o health check passou a testar explicitamente a presença do seletor correto e a ausência do seletor colapsado;
4. o hash foi recalculado e fixado no servidor;
5. a função oficial foi promovida novamente somente após todos os gates retornarem `true`.

Não houve alteração, perda ou reversão de dados.

## 7. Gates de produção

No domínio oficial foram confirmados:

- HTTP **200**;
- `Content-Type: text/html; charset=utf-8`;
- `Cache-Control: no-store, max-age=0`;
- `X-Content-Type-Options: nosniff`;
- `Permissions-Policy` limitada a localização, câmera e microfone no próprio domínio;
- título e runtime `4.2.3`;
- corpo com **192.254 bytes**;
- SHA-256 idêntico ao artefato congelado;
- seletor coletivo de modais correto;
- correções sociais, região viva, avatar autônomo e SOS presentes;
- deployment Vercel `READY`, sem erro de alias;
- **14** respostas HTTP 200 observadas na primeira janela pós-publicação;
- nenhum erro de runtime registrado na Vercel nessa janela.

## 8. Limpeza e redução de superfície

- A extensão PostgreSQL `http`, instalada exclusivamente para QA server-side, foi removida após os testes.
- As funções antigas de candidata, prévia e artefato foram arquivadas com `verify_jwt=true` e resposta HTTP 410.
- Apenas a função oficial `explorer-v42` permanece pública.
- O artefato final e a fonte exata do servidor estão versionados.

## 9. Rollback

- A implementação estável anterior permanece versionada em `rollback/explorer-v42-version-3.ts`.
- O pacote-base `4.2.0` permanece preservado no release store.
- A restauração do frontend não exige exclusão ou transformação de dados.
- Os índices podem permanecer durante rollback por serem retrocompatíveis; scripts de remoção também estão disponíveis.
- O hardening de segurança não deve ser revertido em um rollback comum.

## 10. Riscos residuais

- Ainda não existe uma suíte E2E completa em uma fazenda física de iPhones e versões distintas do Safari.
- O frontend continua concentrado em HTML monolítico, elevando custo de manutenção e dificultando observabilidade no cliente.
- O próximo ciclo deve priorizar modularização, telemetria de Web Vitals e testes autenticados automatizados.

## 11. Resultado

A combinação **4.2.2 + 4.2.3** superou os gates de produto, acessibilidade, segurança, integridade, compatibilidade estrutural e entrega real. O Explorer 4.2.3 está publicado no domínio oficial com artefato imutável, hash verificado, rollback preservado e superfície temporária de QA encerrada.
