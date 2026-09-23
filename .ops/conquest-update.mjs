import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
export const CONQUEST_VERSION='solaris-conquista-v2';
export function installConquest(outDir='solaris-dist') {
  const out=path.resolve(outDir),source=path.resolve('site/conquista');
  const files=['index.html','conquista.css','paths.js','conquista.js'];
  const texts=Object.fromEntries(files.map(f=>[f,fs.readFileSync(path.join(source,f),'utf8')]));
  if(!texts['index.html'].includes(CONQUEST_VERSION)||!texts['conquista.js'].includes(CONQUEST_VERSION)) throw Error('Incomplete conquest source.');
  for(const f of ['paths.js','conquista.js'])new vm.Script(texts[f]);
  if(/WebGLRenderer|three\.module|getUserMedia|\beval\s*\(|document\.write/.test(texts['conquista.js']))throw Error('Unexpected unsafe renderer in the 2D release.');
  const original=path.join(out,'jogo'),legacy=path.join(out,'passeio');
  if(!fs.existsSync(path.join(original,'game.js')))throw Error('Original day-game missing; do not replace it.');
  fs.cpSync(original,legacy,{recursive:true});
  fs.rmSync(original,{recursive:true,force:true});fs.mkdirSync(original,{recursive:true});
  for(const f of files)fs.writeFileSync(path.join(original,f),texts[f]);
  let root=fs.readFileSync(path.join(out,'index.html'),'utf8');
  if(!root.includes('id="all-location-labels"')||!root.includes('id="playGame"'))throw Error('Reviewed map is missing.');
  root=root.replace('aria-label="Jogar Um dia no Solaris"','aria-label="Jogar Solaris Explore e Conquiste"');
  fs.writeFileSync(path.join(out,'index.html'),root);
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'version.json'),'utf8'));
  manifest.legacyGame=manifest.game;manifest.legacyGame.path='/passeio/';
  manifest.game={version:CONQUEST_VERSION,path:'/jogo/',levels:15,chapters:5,maxStars:45,rendering:'2D image-based',rewards:'virtual only',currency:'virtual suns; no cash value',storage:'local browser plus manual passport export/import',serverValidated:false,physicalPrizes:false,sourceSHA256:crypto.createHash('sha256').update(files.map(f=>texts[f]).join('')).digest('hex')};
  fs.writeFileSync(path.join(out,'version.json'),JSON.stringify(manifest));fs.writeFileSync(path.join(original,'version.json'),JSON.stringify(manifest.game));
  console.log('Solaris conquest: 15 stages, 45 stars, virtual rewards; map preserved; original day-game at /passeio/.');
}
