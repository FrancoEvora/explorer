(() => {
  'use strict';

  const RELEASE = '4.2.2-rc1';
  const STORAGE_KEY = 'explorer-telemetry-queue-v1';
  const SESSION_KEY = 'explorer-session-id-v1';
  const MAX_QUEUE = 20;
  const DEDUPE_WINDOW_MS = 30_000;
  const recent = new Map();
  let sending = false;
  let recoveryVisible = false;

  const sessionId = (() => {
    let value = sessionStorage.getItem(SESSION_KEY);
    if (!value) {
      value = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, value);
    }
    return value;
  })();

  function safeText(value, max = 2000) {
    return String(value ?? '')
      .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [redacted]')
      .replace(/([A-Z0-9._%+-])[A-Z0-9._%+-]*(@[A-Z0-9.-]+\.[A-Z]{2,})/gi, '$1***$2')
      .replace(/([?&#](?:token|access_token|refresh_token|code)=)[^&#\s]+/gi, '$1[redacted]')
      .slice(0, max);
  }

  function safeRoute() {
    try {
      return `${location.origin}${location.pathname}`.slice(0, 1000);
    } catch {
      return '';
    }
  }

  function queue() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveQueue(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)));
    } catch {
      // Telemetry must never break the application.
    }
  }

  function normalizeError(input, severity = 'error', metadata = {}) {
    const error = input instanceof Error ? input : new Error(safeText(input || 'Unknown client error'));
    const message = safeText(error.message || 'Unknown client error');
    return {
      user_id: window.Explorer?.state?.user?.id || null,
      session_id: sessionId,
      app_version: RELEASE,
      severity,
      message,
      stack: safeText(error.stack || '', 12000) || null,
      route: safeRoute(),
      user_agent: safeText(navigator.userAgent || '', 1200) || null,
      metadata: {
        online: navigator.onLine,
        visibility: document.visibilityState,
        screen: document.querySelector('.screen.active')?.id || null,
        guest: Boolean(window.Explorer?.state?.guestMode),
        ...metadata
      }
    };
  }

  function shouldRecord(event) {
    const signature = `${event.severity}:${event.message}:${event.stack?.slice(0, 240) || ''}`;
    const now = Date.now();
    const previous = recent.get(signature) || 0;
    recent.set(signature, now);
    for (const [key, timestamp] of recent) {
      if (now - timestamp > DEDUPE_WINDOW_MS) recent.delete(key);
    }
    return now - previous > DEDUPE_WINDOW_MS;
  }

  async function send(event) {
    const client = window.Explorer?.supabase;
    if (!client || !navigator.onLine) return false;
    try {
      const { error } = await client.from('client_error_events').insert(event);
      return !error;
    } catch {
      return false;
    }
  }

  async function flush() {
    if (sending) return;
    sending = true;
    try {
      const pending = queue();
      if (!pending.length) return;
      const remaining = [];
      for (const event of pending) {
        if (!(await send(event))) remaining.push(event);
      }
      saveQueue(remaining);
    } finally {
      sending = false;
    }
  }

  async function record(input, severity = 'error', metadata = {}) {
    const event = normalizeError(input, severity, metadata);
    if (!shouldRecord(event)) return;
    if (!(await send(event))) {
      const pending = queue();
      pending.push(event);
      saveQueue(pending);
    }
  }

  function recoveryBanner() {
    return document.getElementById('systemHealthBanner');
  }

  function showRecovery(message, details = '') {
    const banner = recoveryBanner();
    if (!banner) return;
    recoveryVisible = true;
    banner.classList.remove('hidden');
    const text = document.getElementById('systemHealthMessage');
    const detail = document.getElementById('systemHealthDetails');
    if (text) text.textContent = message;
    if (detail) detail.textContent = details;
  }

  function hideRecovery() {
    recoveryVisible = false;
    recoveryBanner()?.classList.add('hidden');
  }

  async function clearCachesAndReload() {
    try {
      if ('caches' in window) {
        for (const key of await caches.keys()) await caches.delete(key);
      }
      if ('serviceWorker' in navigator) {
        for (const registration of await navigator.serviceWorker.getRegistrations()) {
          await registration.unregister();
        }
      }
    } finally {
      location.reload();
    }
  }

  function criticalChecks() {
    const required = [
      ['Supabase', () => Boolean(window.supabase?.createClient)],
      ['Explorer core', () => Boolean(window.Explorer?.supabase && window.Explorer?.utils)],
      ['Leaflet', () => Boolean(window.L?.map)],
      ['Navigation', () => document.querySelectorAll('.nav-button').length === 5],
      ['Authentication', () => Boolean(document.getElementById('authForm'))],
      ['Trail recording', () => Boolean(document.getElementById('newTrailForm'))],
      ['SOS', () => Boolean(document.getElementById('activateSOS') && document.getElementById('stopSOS'))]
    ];
    return required.filter(([, check]) => {
      try { return !check(); } catch { return true; }
    }).map(([name]) => name);
  }

  async function runSelfCheck() {
    const missing = criticalChecks();
    if (missing.length) {
      const message = `Alguns módulos não foram carregados: ${missing.join(', ')}.`;
      showRecovery('O Explorer encontrou um problema de inicialização.', message);
      await record(new Error(message), 'fatal', { check: 'startup', missing });
      return false;
    }
    if (recoveryVisible) hideRecovery();
    await flush();
    return true;
  }

  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message || 'Resource loading error');
    record(error, 'error', {
      source: safeText(event.filename || '', 500),
      line: event.lineno || null,
      column: event.colno || null
    });
    if (!event.error && event.target instanceof HTMLElement) {
      showRecovery('Um recurso essencial não carregou.', 'Verifique sua conexão e tente recarregar o aplicativo.');
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    record(event.reason || new Error('Unhandled promise rejection'), 'error', { source: 'unhandledrejection' });
  });

  window.addEventListener('online', flush);

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('systemHealthRetry')?.addEventListener('click', () => location.reload());
    document.getElementById('systemHealthReset')?.addEventListener('click', clearCachesAndReload);
    document.getElementById('systemHealthDismiss')?.addEventListener('click', hideRecovery);
    setTimeout(runSelfCheck, 1800);
    setTimeout(runSelfCheck, 6000);
  });

  window.ExplorerObservability = {
    version: RELEASE,
    record,
    flush,
    runSelfCheck,
    showRecovery
  };
})();
