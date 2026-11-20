module.exports = async function explorerHandler(req, res) {
  const base = 'https://qlatvknnzejjljbottxb.supabase.co/functions/v1/explorer-v42';
  const isHealth = (req.url || '').startsWith('/api/health');
  try {
    const upstream = await fetch(base + (isHealth ? '/health' : ''), {
      headers: { Accept: isHealth ? 'application/json' : 'text/html' },
      signal: AbortSignal.timeout(35000)
    });
    const body = await upstream.text();
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Explorer-Photo', '2.0.0');
    if (!upstream.ok) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(503).send('Explorer temporariamente indisponível: serviço de dados em recuperação (HTTP ' + upstream.status + ').');
    }
    if (isHealth) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(body);
    }
    if (!body.includes('<title>Explorer 4.2.3</title>') || !body.includes('</body>')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(502).send('A base do Explorer mudou. Publicação fotográfica suspensa por segurança.');
    }
    const mark = '<link rel="icon" type="image/svg+xml" href="/explorer-mark.svg?v=2.0.0"><link rel="apple-touch-icon" sizes="180x180" href="/explorer-touch-icon.png?v=2.0.0"><link rel="stylesheet" href="/photometer.css?v=2.0.0">';
    const scripts = [
      '<script defer src="/explorer-brand.js?v=2.0.0"></script>',
      '<script defer src="/photometer.js?v=2.0.0"></script>',
      '<script defer src="/photo-module.js?v=2.0.0"></script>'
    ].join('');
    const html = body
      .replace(/<\/head>/i, mark + '</head>')
      .replace(/<\/body>/i, scripts + '</body>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=(self)');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    return res.status(200).send(html);
  } catch (error) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(503).send('Explorer indisponível temporariamente. Não foi possível conectar ao servidor principal.');
  }
};
