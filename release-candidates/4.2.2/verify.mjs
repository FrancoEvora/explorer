import { readFile } from 'node:fs/promises';

const [, , candidatePath = 'dist/explorer-4.2.2.html'] = process.argv;
const html = await readFile(candidatePath, 'utf8');

const gates = {
  title: html.includes('<title>Explorer 4.2.2</title>'),
  runtimeVersion: html.includes("const APP_VERSION = '4.2.2';"),
  authorHandler: html.includes('authorButton.dataset.trailAuthor'),
  messageHandler: html.includes('messageButton.dataset.messageUser'),
  noBrokenTrailClosure: !html.includes("openUserProfile(trail.user_id)") && !html.includes("startConversation(trail.user_id)"),
  ownTrailGuard: html.includes('canMessageAuthor'),
  modalFocus: html.includes('modalReturnFocus'),
  escapeSupport: html.includes("event.key !== 'Escape'"),
  focusVisible: html.includes(':focus-visible'),
  reducedMotion: html.includes('prefers-reduced-motion'),
  authLiveRegion: html.includes('id="authMessage" class="notice" role="status" aria-live="polite"'),
  essentialFlows: ['authView','appShell','map','trailDetailModal','userProfileModal','chatModal','sosModal'].every((id) => html.includes(`id="${id}"`)),
};

const failed = Object.entries(gates).filter(([, passed]) => !passed).map(([name]) => name);
console.table(gates);
if (failed.length) throw new Error(`Quality gates reprovados: ${failed.join(', ')}`);
console.log(`Quality gates aprovados (${Object.keys(gates).length}/${Object.keys(gates).length}).`);