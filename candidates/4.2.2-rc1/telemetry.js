(() => {
  'use strict';
  const X = window.Explorer;
  if (!X?.supabase || window.__explorerTelemetryInstalled) return;
  window.__explorerTelemetryInstalled = true;

  const db = X.supabase;
  const SESSION_KEY = 'explorer-telemetry-session';
  const MAX_EVENTS_PER_SESSION = 20;
  const seen = new Set();
  let sent = 0;

  const sessionId = (() => {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const value = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, value);
    return value;
  })();

  function redact(value = '') {
    return String(value)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
      .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[token]')
      .replace(/sb_[A-Za-z0-9_-]{12,}/g, '[key]')
      .slice(0, 4000);
  }

  function routeName() {
    const active = document.querySelector('.screen.active');
    return active?.id?.replace('screen-', '') || location.pathname || '/';
  }

  async function currentUserId() {
    try {
      const { data } = await db.auth.getSession();
      return data?.session?.user?.id || null;
    } catch {
      return null;
    }
  }

  async function capture(error, metadata = {}, severity = 'error') {
    if (sent >= MAX_EVENTS_PER_SESSION) return;
    const message = redact(error?.message || error || 'Erro desconhecido');
    const stack = redact(error?.stack || '');
    const signature = `${message}|${stack.split('\n')[0]}|${routeName()}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    sent += 1;

    try {
      const userId = await currentUserId();
      await db.from('client_error_events').insert({
        user_id: userId,
        session_id: sessionId,
        app_version: X.config.APP_VERSION,
        severity,
        message,
        stack: stack || null,
        route: routeName(),
        user_agent: navigator.userAgent.slice(0, 512),
        metadata: {
          online: navigator.onLine,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          visibility: document.visibilityState,
          guest: Boolean(X.state?.guestMode),
          active_trail: Boolean(X.state?.activeTrail),
          ...metadata
        }
      });
    } catch (telemetryError) {
      console.debug('Explorer telemetry unavailable', telemetryError);
    }
  }

  window.addEventListener('error', (event) => {
    capture(event.error || new Error(event.message), {
      source: 'window.error',
      filename: event.filename?.split('/').pop() || null,
      line: event.lineno || null,
      column: event.colno || null
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    capture(reason, { source: 'unhandledrejection' });
  });

  X.telemetry = { capture };
})();
