import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RELEASE_VERSION = "4.2.3";
const BASE_VERSION = "4.2.0";
const EXPECTED_CHUNKS = 44;
const DEFAULT_AVATAR = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2228%22%20fill%3D%22%2306151f%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2237%22%20fill%3D%22none%22%20stroke%3D%22%23c7ff19%22%20stroke-width%3D%226%22%2F%3E%3Cpath%20d%3D%22M50%2010l8%2032-8%208-8-8z%22%20fill%3D%22%23c7ff19%22%2F%3E%3Cpath%20d%3D%22M90%2050l-32%208-8-8%208-8z%22%20fill%3D%22%231595ff%22%2F%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%229%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E";
const commonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Explorer-Version": RELEASE_VERSION,
};

const ACCESSIBILITY_CSS = String.raw`
/* Explorer 4.2.3 — accessibility, iPhone and modal reliability */
html,body{max-width:100%;overflow-x:hidden}
html.modal-open,body.modal-open{overflow:hidden;overscroll-behavior:none}
:where(button,a,input,select,textarea,[tabindex]):focus-visible{outline:3px solid var(--lime);outline-offset:3px}
.modal[aria-hidden="true"]{display:none!important}
.modal-card{max-width:100%;padding-bottom:calc(20px + env(safe-area-inset-bottom))}
@media(max-width:720px){
  input,select,textarea{font-size:16px!important}
  .button,.icon-button,.map-action,.nav-button,.feed-action,.social-row-button,.modal-close{min-height:44px}
  .modal{padding:8px;align-items:end}
  .modal-card{max-height:calc(100dvh - env(safe-area-inset-top) - 8px)}
  .chat-card{height:min(88dvh,760px)}
  .app-header,.app-main,.bottom-nav{max-width:100vw}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;

const MODAL_RUNTIME = String.raw`
  const modalFocusStack = new Map();
  const modalFocusableSelector = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function prepareModal(modal) {
    if (!modal?.classList.contains('modal')) return;
    modal.setAttribute('aria-hidden', modal.classList.contains('hidden') ? 'true' : 'false');
    modal.setAttribute('tabindex', '-1');
    const heading = modal.querySelector('h2');
    if (heading) {
      if (!heading.id) heading.id = modal.id + '-title';
      modal.setAttribute('aria-labelledby', heading.id);
    }
  }

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    const managed = modal.classList.contains('modal');
    if (managed) {
      modalFocusStack.set(id, document.activeElement instanceof HTMLElement ? document.activeElement : null);
      prepareModal(modal);
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    }
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    if (managed) requestAnimationFrame(() => {
      const target = modal.querySelector('.modal-close,[data-close],'+modalFocusableSelector) || modal;
      target.focus?.();
    });
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    const managed = modal.classList.contains('modal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    if (managed && !document.querySelector('.modal:not(.hidden)')) {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    if (managed) {
      const previous = modalFocusStack.get(id);
      modalFocusStack.delete(id);
      requestAnimationFrame(() => previous?.focus?.());
    }
  }

  function initializeModalSemantics() {
    $$('.modal').forEach(prepareModal);
  }

  function handleModalKeydown(event) {
    const visible = $$('.modal:not(.hidden)');
    const modal = visible.at(-1);
    if (!modal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(modal.id);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(modal.querySelectorAll(modalFocusableSelector)).filter((node) => !node.hidden && node.getClientRects().length);
    if (!focusable.length) {
      event.preventDefault();
      modal.focus();
      return;
    }
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
`;

function decodePart(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Base incompatível: ${label}`);
  return source.replace(from, () => to);
}

function buildRelease(base) {
  let html = base;
  html = replaceRequired(html, "<title>Explorer 4.2</title>", "<title>Explorer 4.2.3</title>", "title");
  html = replaceRequired(html, '<div class="auth-version">Explorer 4.2</div>', '<div class="auth-version">Explorer 4.2.3</div>', "auth version");
  html = replaceRequired(html, '<p class="eyebrow">EXPLORER 4.2</p>', '<p class="eyebrow">EXPLORER 4.2.3</p>', "header version");
  html = replaceRequired(html, "const APP_VERSION = '4.2.0';", "const APP_VERSION = '4.2.3';", "app version");
  html = replaceRequired(
    html,
    "    $('trailDetailMeta').innerHTML = [formatDate(trail.start_time), trail.place, trail.activity_type].filter(Boolean).map(escapeHtml).join(' · ') + `<div class=\"entity-social-actions\"><button type=\"button\" class=\"button ghost small\" data-trail-author=\"${trail.user_id}\">Ver autor</button><button type=\"button\" class=\"button ghost small\" data-message-user=\"${trail.user_id}\">Mensagem</button></div>`;",
    "    const canMessageAuthor = Boolean(S.user?.id && trail.user_id && S.user.id !== trail.user_id);\n    $('trailDetailMeta').innerHTML = [formatDate(trail.start_time), trail.place, trail.activity_type].filter(Boolean).map(escapeHtml).join(' · ') + `<div class=\"entity-social-actions\"><button type=\"button\" class=\"button ghost small\" data-trail-author=\"${trail.user_id}\">Ver autor</button>${canMessageAuthor ? `<button type=\"button\" class=\"button ghost small\" data-message-user=\"${trail.user_id}\">Mensagem</button>` : ''}</div>`;",
    "trail actions",
  );
  html = replaceRequired(
    html,
    "  function bindRelatedItems() {\n    $('trailDetailMeta').querySelector('[data-trail-author]')?.addEventListener('click', () => X.social42?.openUserProfile(trail.user_id));\n    $('trailDetailMeta').querySelector('[data-message-user]')?.addEventListener('click', () => X.social42?.startConversation(trail.user_id));",
    "  function bindRelatedItems() {\n    const authorId = currentTrail?.user_id;\n    $('trailDetailMeta').querySelector('[data-trail-author]')?.addEventListener('click', () => { if (authorId) X.social42?.openUserProfile(authorId); });\n    $('trailDetailMeta').querySelector('[data-message-user]')?.addEventListener('click', () => { if (authorId) X.social42?.startConversation(authorId); });",
    "trail event handlers",
  );
  html = replaceRequired(
    html,
    "  async function avatarUrl(profile) {\n    if (!profile?.avatar_path) return 'logo.svg';\n    return await X.signedUrl(profile.avatar_path, 3600) || 'logo.svg';\n  }",
    `  const DEFAULT_AVATAR = '${DEFAULT_AVATAR}';\n\n  async function avatarUrl(profile) {\n    if (!profile?.avatar_path) return DEFAULT_AVATAR;\n    return await X.signedUrl(profile.avatar_path, 3600) || DEFAULT_AVATAR;\n  }`,
    "avatar fallback",
  );
  html = replaceRequired(html, "\n</style>", `${ACCESSIBILITY_CSS}\n</style>`, "accessibility css");
  html = replaceRequired(
    html,
    "  function openModal(id) { $(id)?.classList.remove('hidden'); }\n  function closeModal(id) { $(id)?.classList.add('hidden'); }",
    MODAL_RUNTIME,
    "modal runtime",
  );
  html = replaceRequired(
    html,
    "  function bindEvents() {\n",
    "  function bindEvents() {\n    document.addEventListener('keydown', handleModalKeydown);\n",
    "modal keyboard binding",
  );
  html = replaceRequired(
    html,
    "  document.addEventListener('DOMContentLoaded', async () => {\n    bindEvents(); renderActiveTrail();",
    "  document.addEventListener('DOMContentLoaded', async () => {\n    initializeModalSemantics();\n    bindEvents(); renderActiveTrail();",
    "modal semantics init",
  );
  return html;
}

async function loadBaseHtml() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Configuração do servidor indisponível");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("app_release_chunks").select("part,data").eq("version", BASE_VERSION).order("part", { ascending: true });
  if (error) throw error;
  if (!data || data.length !== EXPECTED_CHUNKS) throw new Error(`Pacote incompleto: ${data?.length || 0} blocos`);
  const decoded = data.map((row) => decodePart(row.data));
  const total = decoded.reduce((sum, part) => sum + part.length, 0);
  const compressed = new Uint8Array(total);
  let offset = 0;
  for (const part of decoded) {
    compressed.set(part, offset);
    offset += part.length;
  }
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  const base = await new Response(stream).text();
  return { base, chunks: data.length, compressedBytes: compressed.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: commonHeaders });
  try {
    const { base, chunks, compressedBytes } = await loadBaseHtml();
    const html = buildRelease(base);
    const pathname = new URL(req.url).pathname;
    if (pathname.endsWith("/health")) {
      const checks = {
        title: html.includes("<title>Explorer 4.2.3</title>"),
        appVersion: html.includes("const APP_VERSION = '4.2.3';"),
        authorFix: html.includes("const authorId = currentTrail?.user_id;"),
        selfMessageGuard: html.includes("const canMessageAuthor = Boolean"),
        inlineAvatar: html.includes("const DEFAULT_AVATAR = 'data:image/svg+xml"),
        focusRuntime: html.includes("const modalFocusStack = new Map();"),
        focusTrap: html.includes("function handleModalKeydown(event)"),
        modalSemantics: html.includes("aria-labelledby"),
        modalCollectionLiteral: html.includes("$$('.modal').forEach(prepareModal);"),
        visibleModalCollectionLiteral: html.includes("const visible = $$('.modal:not(.hidden)');"),
        noCollapsedModalSelector: !html.includes("const visible = $('.modal:not(.hidden)');"),
        iosInputZoomGuard: html.includes("font-size:16px!important"),
        reducedMotion: html.includes("prefers-reduced-motion:reduce"),
        dynamicViewport: html.includes("100dvh"),
        messages: html.includes("Mensagens"),
        notifications: html.includes("Notificações"),
        sosHome: html.includes("home-safety-card") && html.includes("SEGURANÇA EM CAMPO"),
      };
      const ok = Object.values(checks).every(Boolean);
      return new Response(JSON.stringify({ ok, version: RELEASE_VERSION, chunks, compressedBytes, characters: html.length, checks }), {
        status: ok ? 200 : 500,
        headers: { ...commonHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }
    return new Response(html, {
      status: 200,
      headers: {
        ...commonHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Permissions-Policy": "geolocation=(self), camera=(self), microphone=(self)",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  } catch (error) {
    return new Response(`Explorer ${RELEASE_VERSION}: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
      headers: { ...commonHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
});
