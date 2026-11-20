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
    res.setHeader('X-Explorer-Photo', '1.0.0');
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
    const addOn = '<script defer src="/photo-module.js?v=1.0.0"></script>';
    const html = body.replace(/<\/body>/i, addOn + '</body>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=(self)');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    return res.status(200).send(html);
  } catch (error) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(503).send('Explorer indisponível temporariamente. Não foi possível conectar ao servidor principal.');
  }
};
