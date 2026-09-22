import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Only the Solaris assets below are published. Explorer source and workflows stay private to the build.
const root = process.cwd();
const out = path.join(root, 'solaris-dist');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.startsWith('<!doctype html>') || !html.includes('Solaris Residencial Resort')) {
  throw new Error('The input is not the expected Solaris HTML. Build stopped.');
}
const match = html.match(/const IMG='(data:image\/jpeg;base64,([A-Za-z0-9+/=]+))';/);
if (!match) throw new Error('Embedded masterplan not found. Build stopped.');
const image = Buffer.from(match[2], 'base64');
if (image.length < 10000 || image[0] !== 255 || image[1] !== 216) throw new Error('Invalid masterplan image.');
html = html.replace(match[0], "const IMG='./masterplan.jpg';");
html = html.replace('<img id="masterplan"', '<img src="./masterplan.jpg" fetchpriority="high" width="900" height="756" id="masterplan"');
html = html.replace('</head>', '<meta name="solaris-build" content="2026-09-22-web-1"><link rel="manifest" href="./manifest.webmanifest"><style>.world{transform:translate(-50%,-50%)}.world img{color:#173a2f}.load-note{position:fixed;bottom:72px;left:12px;right:12px;padding:12px;background:#071a16;color:white;z-index:100}</style></head>');
html = html.replace('</body>', '<noscript><div class="load-note">Abra este site no Safari para usar os controles de navegação.</div></noscript></body>');
for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, 'masterplan.jpg'), image);
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({name:'Solaris Residencial Resort',short_name:'Solaris',start_url:'./',scope:'./',display:'standalone',background_color:'#071a16',theme_color:'#071a16',lang:'pt-BR'}));
fs.writeFileSync(path.join(out, 'sw.js'), "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));");
console.log(`Solaris build validated: HTML ${Buffer.byteLength(html)} bytes; masterplan ${image.length} bytes; no external libraries.`);
