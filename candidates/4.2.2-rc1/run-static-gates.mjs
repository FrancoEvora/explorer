import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const failures = [];
const pass = (condition, message) => { if (!condition) failures.push(message); };

pass(html.includes('Explorer 4.2.2 RC1'), 'Candidate version missing');
pass(html.includes('observability.js'), 'Observability script missing');
pass(html.includes('systemHealthBanner'), 'Recovery UI missing');
pass(!html.includes('<iframe'), 'Iframe is forbidden');
pass(!/XzReadableStream|DecompressionStream\(/.test(html), 'Browser-side decompression is forbidden');
pass(css.includes('prefers-reduced-motion'), 'Reduced-motion styles missing');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
pass(duplicates.length === 0, `Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);

const requiredIds = ['authForm','newTrailForm','map','activateSOS','stopSOS','communityFeed','trailDetailModal','chatModal'];
for (const id of requiredIds) pass(ids.includes(id), `Required element #${id} missing`);

for (const file of fs.readdirSync(root).filter((name) => name.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  try { new vm.Script(source, { filename:file }); }
  catch (error) { failures.push(`${file}: ${error.message}`); }
}

if (failures.length) {
  console.error(`FAILED (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`PASS: ${ids.length} unique IDs; static gates approved.`);
