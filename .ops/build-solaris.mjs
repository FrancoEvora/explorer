import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { applyLocationUpdate, VERSION, SCENES } from './location-update.mjs';

// Publish only the isolated, image-based Solaris assets. Never publish Explorer or its workflows.
// This exact HTML transformation passed mobile WebKit and desktop Chromium in Actions run 35797526458.
const out = path.resolve('solaris-dist');
const source = path.resolve('site');
let html = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
if (!html.startsWith('<!doctype html>') || !html.includes('2026-09-22-image-v2')) {
  throw new Error('The reviewed image-only Solaris baseline is missing.');
}
html = applyLocationUpdate(html);
if (!html.includes(VERSION) || !html.includes('id="portaria-implantacao"')) {
  throw new Error('The landmark release is incomplete.');
}
if (/<canvas|WebGLRenderer|three\.module|DeviceOrientationEvent|rotateX\(/i.test(html)) {
  throw new Error('Unexpected volumetric renderer or simulated AR in the image-only build.');
}
for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
const webp = fs.readFileSync(path.join(source, 'assets/masterplan.webp'));
const jpg = fs.readFileSync(path.join(source, 'assets/masterplan.jpg'));
if (webp.length < 100000 || webp.toString('ascii', 0, 4) !== 'RIFF' || webp.toString('ascii', 8, 12) !== 'WEBP') throw new Error('Invalid WebP reference image.');
if (jpg.length < 100000 || jpg[0] !== 255 || jpg[1] !== 216) throw new Error('Invalid JPEG fallback.');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
html = html.replace('</head>', '<link rel="manifest" href="./manifest.webmanifest"></head>');
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, 'assets/masterplan.webp'), webp);
fs.writeFileSync(path.join(out, 'assets/masterplan.jpg'), jpg);
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({ name:'Solaris Residencial Resort', short_name:'Solaris', start_url:'./', scope:'./', display:'standalone', background_color:'#10221c', theme_color:'#10221c', lang:'pt-BR' }));
// Retire only the legacy Solaris worker. Do not cache stale HTML between releases.
fs.writeFileSync(path.join(out, 'sw.js'), "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));");
fs.writeFileSync(path.join(out, 'version.json'), JSON.stringify({
  version: VERSION,
  mode: 'image-only',
  volumetry: false,
  referenceImage: { width:1448, height:1086 },
  sceneCount: SCENES.length,
  landmarks: SCENES.filter(s=>s.featured).map(s=>({ id:s.id, name:s.name, x:s.x, y:s.y })),
  gateRepresentation: 'two-dimensional illustrative implantation',
  entry: 'site/index.html + .ops/location-update.mjs',
  qaRun: 'https://github.com/FrancoEvora/explorer/actions/runs/35797526458'
}));
console.log(`Solaris ${VERSION}: ${SCENES.length} scene shortcuts, three calibrated landmarks, 2D gate illustration, zero 3D geometry. All assets are local.`);
