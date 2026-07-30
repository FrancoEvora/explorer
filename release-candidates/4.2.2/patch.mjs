import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const [, , inputPath, outputPath = 'dist/explorer-4.2.2.html'] = process.argv;
if (!inputPath) throw new Error('Uso: node patch.mjs <baseline-4.2.1.html> [saida.html]');

let html = await readFile(inputPath, 'utf8');

function replaceOnce(label, before, after) {
  const occurrences = html.split(before).length - 1;
  if (occurrences !== 1) throw new Error(`${label}: esperado 1 trecho, encontrado ${occurrences}`);
  html = html.replace(before, after);
}

replaceOnce('title', '<title>Explorer 4.2</title>', '<title>Explorer 4.2.2</title>');
replaceOnce('runtime version', "const APP_VERSION = '4.2.0';", "const APP_VERSION = '4.2.2';");
replaceOnce('auth version', '<div class="auth-version">Explorer 4.2</div>', '<div class="auth-version">Explorer 4.2.2</div>');
replaceOnce('header version', '<p class="eyebrow">EXPLORER 4.2</p>', '<p class="eyebrow">EXPLORER 4.2.2</p>');
replaceOnce('auth live region', '<div id="authMessage" class="notice">', '<div id="authMessage" class="notice" role="status" aria-live="polite">');

replaceOnce(
  'trail author actions',
  "    $('trailDetailMeta').innerHTML = [formatDate(trail.start_time), trail.place, trail.activity_type].filter(Boolean).map(escapeHtml).join(' · ') + `<div class=\"entity-social-actions\"><button type=\"button\" class=\"button ghost small\" data-trail-author=\"${trail.user_id}\">Ver autor</button><button type=\"button\" class=\"button ghost small\" data-message-user=\"${trail.user_id}\">Mensagem</button></div>`;",
  "    const canMessageAuthor = Boolean(S.user && trail.user_id && S.user.id !== trail.user_id);\n    $('trailDetailMeta').innerHTML = [formatDate(trail.start_time), trail.place, trail.activity_type].filter(Boolean).map(escapeHtml).join(' · ') + `<div class=\"entity-social-actions\"><button type=\"button\" class=\"button ghost small\" data-trail-author=\"${trail.user_id}\">Ver autor</button>${canMessageAuthor ? `<button type=\"button\" class=\"button ghost small\" data-message-user=\"${trail.user_id}\">Mensagem</button>` : ''}</div>`;"
);

replaceOnce(
  'trail detail handlers',
  "  function bindRelatedItems() {\n    $('trailDetailMeta').querySelector('[data-trail-author]')?.addEventListener('click', () => X.social42?.openUserProfile(trail.user_id));\n    $('trailDetailMeta').querySelector('[data-message-user]')?.addEventListener('click', () => X.social42?.startConversation(trail.user_id));",
  "  function bindRelatedItems() {\n    const authorButton = $('trailDetailMeta').querySelector('[data-trail-author]');\n    const messageButton = $('trailDetailMeta').querySelector('[data-message-user]');\n    authorButton?.addEventListener('click', () => X.social42?.openUserProfile(authorButton.dataset.trailAuthor));\n    messageButton?.addEventListener('click', () => X.social42?.startConversation(messageButton.dataset.messageUser));"
);

replaceOnce(
  'modal focus management',
  "  function openModal(id) { $(id)?.classList.remove('hidden'); }\n  function closeModal(id) { $(id)?.classList.add('hidden'); }",
  "  const modalReturnFocus = new Map();\n  function openModal(id) {\n    const modal = $(id);\n    if (!modal) return;\n    modalReturnFocus.set(id, document.activeElement instanceof HTMLElement ? document.activeElement : null);\n    modal.classList.remove('hidden');\n    requestAnimationFrame(() => {\n      const target = modal.querySelector('[data-close], .modal-close, button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]');\n      target?.focus({ preventScroll:true });\n    });\n  }\n  function closeModal(id) {\n    const modal = $(id);\n    if (!modal) return;\n    modal.classList.add('hidden');\n    const returnTarget = modalReturnFocus.get(id);\n    modalReturnFocus.delete(id);\n    if (returnTarget?.isConnected) requestAnimationFrame(() => returnTarget.focus({ preventScroll:true }));\n  }"
);

replaceOnce(
  'escape key support',
  "    $$('.modal').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal.id); }));",
  "    $$('.modal').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal.id); }));\n    document.addEventListener('keydown', (event) => {\n      if (event.key !== 'Escape') return;\n      const activeModal = $$('.modal:not(.hidden)').at(-1);\n      if (!activeModal) return;\n      event.preventDefault();\n      closeModal(activeModal.id);\n    });"
);

html = html.replaceAll("return 'logo.svg';", "return 'icon-192.png';").replaceAll("|| 'logo.svg';", "|| 'icon-192.png';");

replaceOnce(
  'accessibility css',
  '</style>',
  `\n/* Explorer 4.2.2 — accessibility and interaction quality */\n:focus-visible{outline:3px solid var(--lime);outline-offset:3px}\n@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}\n</style>`
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, html);
console.log(`Explorer 4.2.2 gerado: ${outputPath} (${html.length} caracteres)`);