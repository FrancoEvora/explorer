# Explorer Release Quality Gates

Toda candidata precisa passar por todos os gates bloqueantes antes de promoção.

## Produto e UX
- Fluxos centrais concluídos sem controles ocultos ou conteúdo sobreposto.
- Todo elemento interativo visível produz feedback imediato.
- Layout móvel verificado em 320, 375, 390, 430 e 768 CSS pixels.
- Estados vazio, carregando, offline, permissão negada e erro definidos.

## Confiabilidade
- Nenhum erro não tratado nos testes de fumaça.
- Telemetria global de erros e promises rejeitadas ativa.
- Fila offline recuperada após reconexão.
- Caminho de limpeza de cache validado.
- Deployment anterior disponível para rollback.

## Fluxos críticos
- Cadastro, login e recuperação de senha.
- Geolocalização inicial e centralização do mapa.
- Iniciar, pausar, recuperar e finalizar trilha.
- Criar observação, risco e ponto com mídia.
- Abrir detalhes de trilhas, observações, riscos e pontos.
- Seguir, enviar mensagem, receber notificação e marcar como lida.
- Ativar, compartilhar localização e desligar SOS.

## Segurança e privacidade
- RLS habilitado para dados pessoais, mensagens, emergência e telemetria.
- Nenhuma chave service-role ou segredo privado em assets do cliente.
- Geoprivacidade aplicada a registros de fauna.
- Logs redigem tokens e parcialmente redigem e-mails.

## Acessibilidade
- Controles relevantes possuem nome acessível.
- Alvos principais de toque com pelo menos 44 × 44 CSS pixels.
- Foco de teclado visível.
- Preferência por movimento reduzido respeitada.
- Contraste WCAG AA sempre que aplicável.

## Orçamento de desempenho
- HTML inicial abaixo de 200 KB sem compressão.
- IA de identificação carregada apenas sob demanda.
- Dados do mapa limitados e carregados por camada.
- Produção deve responder `text/html; charset=utf-8`.

## Política de promoção
- Candidata 1: validar e reter.
- Candidata 2: validar contra a candidata 1 e contra produção.
- Publicar somente após aprovação das duas e confirmação de rollback.
