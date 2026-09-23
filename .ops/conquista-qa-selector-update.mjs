import fs from 'node:fs';
const file = 'tests/solaris-conquista.cjs';
let source = fs.readFileSync(file, 'utf8');
const before = 'await p.click(`[data-level="${id}"]`);';
const after = 'await p.click(`button[data-level="${id}"]`);';
if (source.split(before).length !== 2) throw new Error('Expected a single reviewed stage-click selector.');
// The body also records data-level for diagnostics. Replaying the same phase must click
// the actual phase button, not the body. Keep all gameplay and reward assertions intact.
source = source.replace(before, after);
fs.writeFileSync(file, source);
console.log('Replay selector now targets the visible phase button. All reward assertions preserved.');
