(() => {
  'use strict';
  const X = window.Explorer;
  if (!X?.supabase || window.__explorerTelemetryInstalled) return;
  window.__explorerTelemetryInstalled = true;
  window.__explorerTelemetryReady = true;

  const db = X.supabase;
  const S = X.state || {};
  const SESSION_KEY = 'explorer-telemetry-session-v1';
  const MAX_EVENTS_PER_SESSION = 12;
  const MAX_MESSAGE = 1800;
  const MAX_STACK = 3500;
  const seen = new Set();
  let sent = 0;

  function uuid() {
    try { return crypto.randomUUID(); }
    catch { return 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12); }
  }

  const sessionId = (() => {
    try {
      const existing = sessionStorage.getItem(SESSION_KEY);
      if (existing) return existing;
      const value = uuid();
      sessionStorage.setItem(SESSION_KEY, value);
      return value;
    } catch { return uuid(); }
  })();

  function redact(value = '', max = MAX_MESSAGE) {
    return String(value)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
      .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, '[token]')
      .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [token]')
      .replace(/\bsb_[A-Za-z0-9_-]{10,}/g, '[key]')
      .replace(/([?&][^=\s]+)=([^&\s#]+)/g, '$1=[redacted]')
      .slice(0, max);
  }

  function routeName() {
    const active = document.querySelector('.screen.active');
    return active?.id?.replace('screen-', '') || location.pathname || '/';
  }

  async function currentUserId() {
    if (S.user?.id) return S.user.id;
    try {
      const { data } = await db.auth.getSession();
      return data?.session?.user?.id || null;
    } catch { return null; }
  }

  function safeConnection() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return null;
    return {
      effective_type: connection.effectiveType || null,
      save_data: Boolean(connection.saveData),
      downlink: Number.isFinite(connection.downlink) ? connection.downlink : null,
    };
  }

  async function capture(error, metadata = {}, severity = 'error') {
    if (sent >= MAX_EVENTS_PER_SESSION) return;
    const message = redact(error?.message || error || 'Erro desconhecido');
    if (!message || message.includes('Explorer telemetry unavailable')) return;
    const stack = redact(error?.stack || '', MAX_STACK);
    const source = redact(metadata.source || 'client', 80);
    const signature = [source, message, stack.split('\n')[0], routeName()].join('|');
    if (seen.has(signature)) return;
    seen.add(signature);
    sent += 1;

    try {
      const payload = {
        user_id: await currentUserId(),
        session_id: sessionId,
        app_version: X.config?.APP_VERSION || '4.2.4',
        severity,
        message,
        stack: stack || null,
        route: routeName().slice(0, 120),
        user_agent: navigator.userAgent.slice(0, 512),
        metadata: {
          source,
          online: navigator.onLine,
          viewport: window.innerWidth + 'x' + window.innerHeight,
          dpr: window.devicePixelRatio || 1,
          visibility: document.visibilityState,
          guest: Boolean(S.guestMode),
          active_trail: Boolean(S.activeTrail),
          connection: safeConnection(),
          filename: metadata.filename ? redact(String(metadata.filename).split('/').pop(), 160) : null,
          line: Number.isFinite(metadata.line) ? metadata.line : null,
          column: Number.isFinite(metadata.column) ? metadata.column : null,
          resource: metadata.resource ? redact(metadata.resource, 240) : null,
        },
      };
      const { error: insertError } = await db.from('client_error_events').insert(payload);
      if (insertError) console.debug('Explorer telemetry unavailable');
    } catch {
      console.debug('Explorer telemetry unavailable');
    }
  }

  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target;
      const resource = target?.src || target?.href || target?.currentSrc || '';
      capture(new Error('Falha ao carregar recurso'), { source: 'resource.error', resource }, 'warning');
      return;
    }
    capture(event.error || new Error(event.message || 'Erro de JavaScript'), {
      source: 'window.error',
      filename: event.filename || null,
      line: event.lineno || null,
      column: event.colno || null,
    });
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason || 'Promise rejeitada'));
    capture(reason, { source: 'unhandledrejection' });
  });

  const early = Array.isArray(window.__explorerEarlyErrors) ? window.__explorerEarlyErrors.splice(0) : [];
  for (const item of early) {
    const value = item?.value || {};
    capture(new Error(value.message || 'Erro de inicialização'), {
      source: 'early.' + (item?.kind || 'error'),
      filename: value.filename || null,
      line: value.line || null,
      column: value.column || null,
    });
  }

  X.telemetry = Object.freeze({ capture, sessionId, maxEventsPerSession: MAX_EVENTS_PER_SESSION });
})();
