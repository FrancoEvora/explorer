import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const out=path.resolve('solaris-dist');
const VERSION='2026-09-25-solaris-enterprise-audio-v1';
const solarisFiles=['index.html','styles.css','app.js','experience.js','lots-data.js','assets/solaris-ambient.mp3','assets/masterplan.webp','assets/lotes.webp','assets/portaria.webp','assets/clube.webp','assets/lago.webp'];
const metropolitanFiles=['index.html','styles.css','app.js','assets/implantacao.png','assets/portaria.webp','assets/convivencia.webp','assets/logistica.webp','assets/visao-aerea.jpg'];
const source=process.env.SOLARIS_SOURCE||'solaris';
const metroSource=process.env.METROPOLITAN_SOURCE||'metropolitan';
const lotsContext={};vm.createContext(lotsContext);
vm.runInContext(fs.readFileSync(path.join(source,'lots-data.js'),'utf8')+';this.data={lots,blocks};',lotsContext);
const {lots,blocks}=lotsContext.data;
if(lots.length!==249||blocks.length!==10||new Set(lots.map(l=>l.id)).size!==249)throw new Error('Parcel inventory mismatch');
for(const b of blocks){const ns=lots.filter(l=>l.block===b.n).map(l=>l.n).sort((a,b)=>a-b);if(ns.some((n,i)=>n!==i+1))throw new Error('Missing parcel in block '+b.n);}
if(lots.filter(l=>l.institutional).map(l=>l.id).join()!=='lote-c-18')throw new Error('Institutional parcel mismatch');
for(const file of ['app.js','experience.js','lots-data.js'])new vm.Script(fs.readFileSync(path.join(source,file),'utf8'));
new vm.Script(fs.readFileSync(path.join(metroSource,'app.js'),'utf8'));
const html=fs.readFileSync(path.join(source,'index.html'),'utf8');
for(const id of ['lot-search','lot-block','lot-layer','lots-tab','gallery-dialog','tour-player','portaria-implantacao'])if(!html.includes(`id="${id}"`))throw new Error('Required feature missing: '+id);
if(/installGame|SolarisQuest|AudioContext|missionDialog/.test(html+fs.readFileSync(path.join(source,'app.js'),'utf8')))throw new Error('Unrelated game runtime');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const file of solarisFiles){const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(source,file),dest);}
// Keep the Metropolitan source and its path-independent asset loading unchanged.
for(const file of metropolitanFiles){const dest=path.join(out,'metropolitan',file);fs.mkdirSync(path.dirname(dest),{recursive:true});if(file==='index.html')fs.writeFileSync(dest,fs.readFileSync(path.join(metroSource,file),'utf8').replace('<head>','<head>\n  <base href="/metropolitan/">'));else fs.copyFileSync(path.join(metroSource,file),dest);}
fs.writeFileSync(path.join(out,'sw.js'),"self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));");
fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify({name:'Solaris Residencial Resort',short_name:'Solaris',start_url:'/',scope:'/',display:'standalone',theme_color:'#10231e',background_color:'#10231e',lang:'pt-BR'}));
fs.writeFileSync(path.join(out,'version.json'),JSON.stringify({version:VERSION,blocks:10,lots:249,institutionalLot:'C18',perspectives:4,newRenders:3,gameEnabled:false,musicEnabled:true,voiceEnabled:true,inventorySource:'Evora Enterprise',lotSource:'Solaris_Home_Resort_Urbanistico_22-07-25',lotLayer:'schematic identification',metropolitanPreserved:true}));
const expected=[...solarisFiles,...metropolitanFiles.map(p=>'metropolitan/'+p),'sw.js','manifest.webmanifest','version.json'].sort();
const actual=fs.readdirSync(out,{recursive:true}).filter(p=>fs.statSync(path.join(out,p)).isFile()).sort();
if(JSON.stringify(expected)!==JSON.stringify(actual))throw new Error('Unexpected public file');
console.log(`${VERSION}: ${blocks.length} blocks, ${lots.length} unique parcels, 3 new renders. Metropolitan preserved; ${actual.length} public files.`);
