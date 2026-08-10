const RELEASE_VERSION = "4.2.4";
const BASE_BUILD = "4.2.3-r1";
const EXPECTED_BASE_CHUNKS = 24;
const EXPECTED_BASE_SHA256 = "3a8e540625e2d35453a09807ec03c65f29232b991eaa14572c832bdc3e085a85";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Explorer-Version": RELEASE_VERSION,
};

const EARLY_ERROR_BUFFER = String.raw`<script>
(() => {
  const buffer = window.__explorerEarlyErrors = window.__explorerEarlyErrors || [];
  const push = (kind, value) => {
    if (window.__explorerTelemetryReady || buffer.length >= 8) return;
    buffer.push({ kind, value, at: Date.now() });
  };
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) return;
    push('error', { message: event.message || 'Erro de inicialização', filename: event.filename || '', line: event.lineno || null, column: event.colno || null });
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || 'Promise rejeitada');
    push('unhandledrejection', { message: reason });
  });
})();
</script>`;

const TELEMETRY_RUNTIME = String.raw`<script>
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
      const userId = await currentUserId();
      const payload = {
        user_id: userId,
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
    const error = new Error(value.message || 'Erro de inicialização');
    capture(error, {
      source: 'early.' + (item?.kind || 'error'),
      filename: value.filename || null,
      line: value.line || null,
      column: value.column || null,
    });
  }

  X.telemetry = Object.freeze({ capture, sessionId, maxEventsPerSession: MAX_EVENTS_PER_SESSION });
})();
</script>`;

let releasePromise: Promise<{ html: string; bytes: number; sha256: string }> | null = null;

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function replaceRequired(source: string, from: string, to: string, label: string) {
  if (!source.includes(from)) throw new Error(`Base incompatível: ${label}`);
  return source.replace(from, to);
}

async function loadBase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Configuração do servidor indisponível");
  const endpoint = `${url}/rest/v1/app_build_chunks?build=eq.${encodeURIComponent(BASE_BUILD)}&select=seq,content&order=seq.asc`;
  const response = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`Release store HTTP ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== EXPECTED_BASE_CHUNKS) throw new Error(`Base incompleta: ${Array.isArray(rows) ? rows.length : 0} blocos`);
  for (let index = 0; index < rows.length; index += 1) {
    if (rows[index].seq !== index || typeof rows[index].content !== "string") throw new Error(`Sequência inválida no bloco ${index}`);
  }
  const html = rows.map((row: { content: string }) => row.content).join("");
  const hash = await sha256(html);
  if (hash !== EXPECTED_BASE_SHA256) throw new Error(`Hash da base inválido: ${hash}`);
  return html;
}

async function buildRelease() {
  if (!releasePromise) releasePromise = (async () => {
    let html = await loadBase();
    html = replaceRequired(html, "<title>Explorer 4.2.3</title>", "<title>Explorer 4.2.4</title>", "title");
    html = replaceRequired(html, 'meta name="explorer-build" content="4.2.3"', 'meta name="explorer-build" content="4.2.4-rc1"', "build meta");
    html = replaceRequired(html, '<div class="auth-version">Explorer 4.2.3</div>', '<div class="auth-version">Explorer 4.2.4</div>', "auth version");
    html = replaceRequired(html, '<p class="eyebrow">EXPLORER 4.2.3</p>', '<p class="eyebrow">EXPLORER 4.2.4</p>', "header version");
    html = replaceRequired(html, "const APP_VERSION = '4.2.3';", "const APP_VERSION = '4.2.4';", "app version");
    html = replaceRequired(html, "<head>", `<head>\n${EARLY_ERROR_BUFFER}`, "early telemetry buffer");
    html = replaceRequired(html, "\n</body>", `\n${TELEMETRY_RUNTIME}\n</body>`, "telemetry runtime");
    const hash = await sha256(html);
    return { html, bytes: new TextEncoder().encode(html).length, sha256: hash };
  })();
  return releasePromise;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const release = await buildRelease();
    const pathname = new URL(req.url).pathname;
    if (pathname.endsWith("/health")) {
      const checks = {
        version: release.html.includes("<title>Explorer 4.2.4</title>") && release.html.includes("const APP_VERSION = '4.2.4';"),
        baseIntegrity: EXPECTED_BASE_SHA256 === "3a8e540625e2d35453a09807ec03c65f29232b991eaa14572c832bdc3e085a85",
        errorCapture: release.html.includes("window.addEventListener('error'") && release.html.includes("unhandledrejection"),
        earlyBuffer: release.html.includes("__explorerEarlyErrors") && release.html.includes("__explorerTelemetryReady"),
        privacyRedaction: release.html.includes("[email]") && release.html.includes("[token]") && release.html.includes("[redacted]"),
        rateLimit: release.html.includes("MAX_EVENTS_PER_SESSION = 12") && release.html.includes("seen.has(signature)"),
        safeMetadata: release.html.includes("active_trail") && !release.html.includes("latitude:") && !release.html.includes("longitude:"),
        rlsTarget: release.html.includes("client_error_events"),
        existing423Gates: release.html.includes("activeStandardModal") && release.html.includes("canMessageAuthor") && release.html.includes("prefers-reduced-motion"),
      };
      const ok = Object.values(checks).every(Boolean);
      return new Response(JSON.stringify({ ok, version: RELEASE_VERSION, build: "4.2.4-rc1", bytes: release.bytes, sha256: release.sha256, checks }), {
        status: ok ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }
    return new Response(release.html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Permissions-Policy": "geolocation=(self), camera=(self), microphone=(self)",
        "X-Explorer-Build": "4.2.4-rc1",
        "X-Explorer-SHA256": release.sha256,
      },
    });
  } catch (error) {
    return new Response(`Explorer ${RELEASE_VERSION}: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
});
