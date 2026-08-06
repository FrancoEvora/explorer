# Relatório de QA — Explorer 4.2.3

**Data:** 6 de agosto de 2026  
**Decisão final:** aprovada e publicada em conjunto com a candidata 4.2.2  
**Domínio:** `https://explorer-six-self.vercel.app`

## 1. Auditoria anterior à mudança

- Projeto Vercel em produção: `READY`, sem erro de alias.
- Erros de runtime na Vercel nos sete dias anteriores: nenhum.
- Feedback pendente na Vercel Toolbar: nenhum.
- Projeto Supabase: `ACTIVE_HEALTHY`.
- Telemetria do cliente: zero eventos em `client_error_events`.
- Integridade referencial: zero mensagens, participantes, notificações, mídias ou pontos de trilha órfãos.
- RLS ativa nas tabelas sensíveis inspecionadas.
- Baseline de dados: 2 perfis, 4 trilhas, 4 observações, 1 risco, 2 participantes de conversas, 2 mensagens e 3 notificações.

## 2. Mudanças incorporadas

### Explorer 4.2.2

- Corrigido o uso de variável fora do escopo nos comandos **Ver autor** e **Mensagem** da central de trilha.
- Mensagem para a própria conta deixa de ser exibida.
- Avatar padrão passa a ser incorporado ao HTML.
- Execução anônima de RPCs sociais privilegiadas foi revogada.
- Funções exclusivas de gatilho deixaram de ser executáveis diretamente por usuários autenticados.

### Explorer 4.2.3

- Controle e restauração de foco nos modais.
- Navegação por `Tab` confinada no diálogo ativo.
- Fechamento por `Escape`.
- `aria-hidden`, `aria-labelledby` e foco visível.
- Compatibilidade com `prefers-reduced-motion`.
- Campos móveis em 16 px para impedir zoom automático no Safari.
- Uso de viewport dinâmica (`dvh`), safe areas e áreas de toque mínimas de 44 px.
- Proteção contra overflow horizontal e rolagem indevida atrás de diálogos.
- Cinco índices adicionados para chaves estrangeiras críticas do módulo social e da telemetria.

## 3. Migrações

Aplicadas com sucesso:

1. `explorer_4_2_2_harden_social_rpc_grants`
2. `explorer_4_2_3_add_social_fk_indexes`

Resultado:

- `anon` não pode executar `get_or_create_conversation` nem `is_conversation_participant`.
- `authenticated` e `service_role` preservam as permissões necessárias nessas duas RPCs.
- Funções de notificação acionadas por gatilhos não são executáveis por `anon` ou `authenticated`.
- Índices presentes:
  - `conversation_participants_user_id_idx`
  - `messages_sender_id_idx`
  - `notifications_actor_id_idx`
  - `client_error_events_user_id_idx`
  - `risk_confirmations_user_id_idx`
- Nenhuma linha foi alterada pelas migrações.
- Contagens e integridade referencial permaneceram inalteradas.

## 4. Gates da release

A função paralela e a função oficial confirmaram:

- HTTP 200.
- 44 blocos canônicos presentes.
- 43.552 bytes compactados.
- 183.697 caracteres no HTML final.
- Título e versão `4.2.3` corretos.
- Correções sociais 4.2.2 presentes.
- Avatar inline presente.
- Runtime de foco e semântica de modais presentes.
- Seletores de coleção `$$` preservados literalmente.
- Forma corrompida de seletor simples ausente.
- Proteções para iPhone/Safari presentes.
- Mensagens, notificações e SOS preservados.

No domínio oficial:

- Deployment Vercel: `READY`.
- `Content-Type: text/html; charset=utf-8`.
- `Cache-Control: no-store, max-age=0`.
- `X-Content-Type-Options: nosniff`.
- `Permissions-Policy` limitada a localização, câmera e microfone no próprio domínio.
- Erros de runtime na primeira hora após a promoção: nenhum.
- Eventos de erro do cliente após a promoção: zero.

## 5. Ocorrência durante a promoção

A primeira tentativa de promoção revelou um problema no próprio builder: o mecanismo padrão de `String.replace` interpretou `$$` como token de substituição e gerou seletores incorretos no runtime dos modais.

O gate pós-publicação detectou a falha imediatamente. Foram executados:

1. rollback da função oficial para a versão estável anterior;
2. correção do builder para usar `source.replace(from, () => to)`;
3. inclusão de três gates específicos contra a regressão;
4. nova validação integral em função paralela;
5. segunda promoção somente após aprovação dos novos gates.

Não houve migração de dados reversa, perda de registros ou erro registrado por usuário durante o intervalo.

## 6. Limpeza da infraestrutura de QA

- Objeto HTML temporário removido.
- Bucket temporário `explorer-qa` removido pela API de Storage.
- Extensão temporária `http` removida do PostgreSQL.
- Funções auxiliares de prévia, artefato e release aposentadas com HTTP 410.
- Função oficial `explorer-v42` permanece ativa na versão 4.2.3.

## 7. Rollback disponível

- Código da função estável anterior preservado em `rollback/explorer-v42-version-3.ts`.
- Rollback dos grants documentado na candidata 4.2.2.
- Rollback dos índices documentado nesta candidata.
- A restauração do frontend não exige alteração ou exclusão de dados.

## 8. Riscos residuais

- Ainda não existe uma suíte completa de browser E2E em uma fazenda real de dispositivos Safari/iPhone.
- A aplicação continua concentrada em um HTML monolítico montado em runtime, elevando custo de manutenção.
- Parte das recomendações gerais dos advisors do Supabase, não vinculadas diretamente a esta release, permanece para ciclos posteriores.

## 9. Resultado

A combinação **4.2.2 + 4.2.3** superou os gates técnicos, de segurança, integridade, compatibilidade estrutural e entrega real. A versão 4.2.3 foi publicada no domínio oficial com rollback preservado e infraestrutura temporária removida.
