# Explorer — Quality Gates

Uma versão candidata só pode ser publicada depois de duas candidatas consecutivas aprovadas.

## Gates obrigatórios
1. **Build:** JavaScript válido e arquivos obrigatórios presentes.
2. **Smoke:** página abre, scripts carregam e a navegação principal não lança exceções.
3. **Safari/iPhone:** ausência de APIs incompatíveis sem fallback; mapa não bloqueia a rolagem.
4. **Acessibilidade:** controles nomeados, áreas de toque adequadas e contraste suficiente.
5. **Segurança:** RLS ativa, ausência de segredo administrativo no cliente e dados sensíveis fora da telemetria.
6. **Privacidade:** geolocalização somente após consentimento e respeito à geoprivacidade.
7. **Integridade:** nenhuma migração destrutiva e rollback documentado.
8. **Preview:** ambiente isolado com HTTP 200, `Content-Type: text/html; charset=utf-8` e marcadores corretos de versão.
9. **Produção:** deployment READY, zero erro crítico novo, domínio real verificado e rollback disponível.

## Rollback da 4.2.2-rc.1
- Não há migração obrigatória para a aplicação atual.
- Remover `telemetry.js` e restaurar `trail.js`, `social42.js`, `config.js` e `index.html` da 4.2.1.
- Como a candidata não foi promovida, a produção não requer rollback.
