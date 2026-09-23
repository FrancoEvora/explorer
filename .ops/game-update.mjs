import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
export const GAME_VERSION = 'solaris-day-v1';
export function installGame(outDirectory = 'solaris-dist') {
  const source=path.resolve('site/game'),out=path.resolve(outDirectory);
  const page=fs.readFileSync(path.join(source,'index.html'),'utf8');
  const js=fs.readFileSync(path.join(source,'game.js'),'utf8');
  const css=fs.readFileSync(path.join(source,'game.css'),'utf8');
  if(!page.includes(GAME_VERSION)||!js.includes(GAME_VERSION))throw new Error('Incomplete game source.');
  new vm.Script(js);
  if(/WebGLRenderer|three\.module|DeviceOrientationEvent|getUserMedia/.test(js))throw new Error('Only the reviewed 2D game may be published.');
  const dest=path.join(out,'jogo');fs.mkdirSync(dest,{recursive:true});
  for(const [file,text] of Object.entries({'index.html':page,'game.js':js,'game.css':css}))fs.writeFileSync(path.join(dest,file),text);
  let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
  const anchor='<nav class="top-actions" aria-label="Exploração">';
  if(!html.includes(anchor))throw new Error('Map navigation changed; do not overwrite it.');
  html=html.replace(anchor,anchor+'<a id="playGame" class="pill accent game-link" href="./jogo/" aria-label="Jogar Um dia no Solaris"><svg aria-hidden="true"><use href="#i-play"/></svg>Jogar</a>');
  html=html.replace('</head>',`<style id="game-entry-style">.game-link{text-decoration:none;white-space:nowrap}.top-actions #tour{background:var(--glass);color:var(--ink);border-color:var(--line)}@media(max-width:600px){#tourLabel{display:none}.top-actions #tour{width:40px;padding:0}.top-actions .game-link{padding:9px 10px}}@media(max-width:360px){header{padding-left:14px;padding-right:14px}.brand strong{font-size:18px;letter-spacing:.22em}.top-actions{gap:4px}}</style></head>`);
  html=html.replace('id="tour" aria-pressed="false"','id="tour" aria-label="Percurso guiado" aria-pressed="false"');
  fs.writeFileSync(path.join(out,'index.html'),html);
  const info=JSON.parse(fs.readFileSync(path.join(out,'version.json'),'utf8'));
  info.game={version:GAME_VERSION,path:'/jogo/',missions:3,rendering:'2D image-based',storage:'local browser only',sourceSHA256:crypto.createHash('sha256').update(page+css+js).digest('hex')};
  fs.writeFileSync(path.join(out,'version.json'),JSON.stringify(info));
  fs.writeFileSync(path.join(dest,'version.json'),JSON.stringify(info.game));
  console.log('Solaris game installed; existing map, gate and all labels preserved.');
}
