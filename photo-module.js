(function photoModule(){
'use strict';
if(window.__EXPLORER_PHOTO__)return;window.__EXPLORER_PHOTO__=true;
const GEAR_KEY='explorer-photo-gear-v1',GEO_KEY='explorer-photo-position-v1',DB='explorer-photo-v1';
const defaults=[
 {id:'cam-r5',type:'camera',name:'Canon EOS R5',note:'Mirrorless full frame · detecção de animais'},
 {id:'lens-150600',type:'lens',name:'Sigma 150–600mm C',note:'Vida selvagem · alcance longo'},
 {id:'lens-70200',type:'lens',name:'Canon EF 70–200mm f/2.8 II',note:'Telefoto · retratos e natureza'},
 {id:'lens-helios',type:'lens',name:'Helios 44 · 58mm f/2',note:'Lente vintage · foco manual'},
 {id:'acc-extender',type:'accessory',name:'Canon Extender 2×',note:'Dois stops de perda de luz'}
];
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let gear=read(GEAR_KEY,defaults),geo=read(GEO_KEY,null),activeTab='light',file=null,exif=null,dbPromise=null,previousFocus=null,toastTimer;
if(!Array.isArray(gear))gear=defaults;
function read(key,def){try{let v=localStorage.getItem(key);return v?JSON.parse(v):def}catch{return def}}
function save(key,val){try{localStorage.setItem(key,JSON.stringify(val));return true}catch{toast('Armazenamento indisponível neste navegador.');return false}}
function toast(message){let n=$('explorer-photo-toast');if(!n)return;n.textContent=message;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),3900)}
function card(title,html){return '<section class="ps-card"><h2>'+title+'</h2>'+html+'</section>'}
function shortDate(d){return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}
function clock(d){return d&&Number.isFinite(d.getTime())?d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—'}
function solar(lat,lng,date=new Date()){
 const rad=Math.PI/180,n=Math.floor((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(date.getFullYear(),0,0))/86400000),lngHour=lng/15;
 function calc(rise){
  const t=n+((rise?6:18)-lngHour)/24,M=.9856*t-3.289;
  const L=((M+1.916*Math.sin(M*rad)+.02*Math.sin(2*M*rad)+282.634)%360+360)%360;
  let RA=((Math.atan(.91764*Math.tan(L*rad))/rad)%360+360)%360;
  RA+=(Math.floor(L/90)*90-Math.floor(RA/90)*90);RA/=15;
  const sinDec=.39782*Math.sin(L*rad),cosDec=Math.cos(Math.asin(sinDec)),cosH=(Math.cos(90.833*rad)-sinDec*Math.sin(lat*rad))/(cosDec*Math.cos(lat*rad));
  if(Math.abs(cosH)>1)return null;
  const H=(rise?360-Math.acos(cosH)/rad:Math.acos(cosH)/rad)/15;
  const ut=((H+RA-.06571*t-6.622-lngHour)%24+24)%24;
  return new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())+ut*3600000);
 }
 return {rise:calc(true),set:calc(false)};
}
function moon(){
 const phase=((Date.now()-Date.UTC(2000,0,6,18,14))/(86400000*29.530588853)%1+1)%1;
 return phase<.03||phase>.97?'Nova':phase<.22?'Crescente':phase<.28?'Quarto crescente':phase<.47?'Gibosa crescente':phase<.53?'Cheia':phase<.72?'Gibosa minguante':phase<.78?'Quarto minguante':'Minguante';
}
function deviceStatus(){
 const app=$('appShell')||$('app'),gate=$('authGate')||$('auth'),btn=$('explorer-photo-launch');
 if(!btn)return;
 const hidden=(app&&app.classList.contains('hidden'))||(gate&&!gate.classList.contains('hidden'));
 btn.hidden=Boolean(hidden);if(hidden&&!$('explorer-photo-studio').hidden)closeStudio();
}
function mount(){
 if($('explorer-photo-studio'))return;
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/photo-module.css?v=2';document.head.appendChild(sheet);
 const btn=document.createElement('button');btn.type='button';btn.id='explorer-photo-launch';btn.textContent='📷  Fotografia';btn.setAttribute('aria-label','Abrir fotografia de campo no Explorer');btn.onclick=openStudio;document.body.appendChild(btn);
 const dlg=document.createElement('div');dlg.id='explorer-photo-studio';dlg.hidden=true;dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');dlg.setAttribute('aria-label','Fotografia de campo');
 dlg.innerHTML=`<div class="ps-wrap">
 <div class="ps-head"><div class="ps-brand"><span class="ps-logo"><img src="/explorer-mark.svg?v=2.0.0" alt="Símbolo Explorer"></span><span>EXPLORER <b>/ FOTO</b><small style="display:block;color:#a8c2ce;font-size:10px;letter-spacing:.1em">FOTOGRAFIA DE NATUREZA</small></span></div><button class="ps-close" type="button" data-act="close" aria-label="Fechar">×</button></div>
 <section class="ps-hero"><span class="ps-eyebrow">WILDLIFE · TRILHAS · FOTOGRAFIA</span><h1>A luz certa.<br>A lente certa. O instante certo.</h1><p class="ps-muted">Seu estúdio de campo, integrado ao Explorer.</p></section>
 <nav class="ps-tabs" aria-label="Ferramentas fotográficas">
 <button type="button" class="ps-tab" data-tab="light">☀ Luz & local</button><button type="button" class="ps-tab" data-tab="assist">◎ Assistente</button><button type="button" class="ps-tab" data-tab="meter">◉ Fotômetro</button><button type="button" class="ps-tab" data-tab="gear">▤ Mochila</button><button type="button" class="ps-tab" data-tab="diary">▧ Diário</button></nav>
 <div class="ps-body" id="explorer-photo-body"></div><p class="ps-foot">Dados deste módulo são privados e ficam neste dispositivo. Nenhum local de avistamento é publicado automaticamente.</p></div>`;
 document.body.appendChild(dlg);
 const status=document.createElement('div');status.id='explorer-photo-toast';status.setAttribute('role','status');document.body.appendChild(status);
 dlg.addEventListener('click',click);dlg.addEventListener('submit',submit);dlg.addEventListener('change',change);
 document.addEventListener('keydown',e=>{if(!dlg.hidden&&e.key==='Escape'){e.preventDefault();closeStudio()}});
 const app=$('appShell')||$('app'),gate=$('authGate')||$('auth');deviceStatus();
 for(const el of [app,gate])if(el)new MutationObserver(deviceStatus).observe(el,{attributes:true,attributeFilter:['class']});
}
function openStudio(){
 const dlg=$('explorer-photo-studio');if(!dlg)return;previousFocus=document.activeElement;dlg.hidden=false;render();dlg.querySelector('[data-act=close]')?.focus();
}
function closeStudio(){window.ExplorerPhotometer?.stop?.();$('explorer-photo-studio').hidden=true;(previousFocus||$('explorer-photo-launch'))?.focus?.()}
function render(){
 document.querySelectorAll('#explorer-photo-studio [data-tab]').forEach(el=>{const on=el.dataset.tab===activeTab;el.classList.toggle('active',on);el.setAttribute('aria-selected',String(on))});
 const body=$('explorer-photo-body');if(!body)return;
 if(activeTab==='light')body.innerHTML=viewLight();
 if(activeTab==='assist')body.innerHTML=viewAssist();
 if(activeTab==='meter'){body.innerHTML=window.ExplorerPhotometer?.render?.()||'<div class="ps-card">Fotômetro indisponível.</div>';window.ExplorerPhotometer?.mount?.()}
 if(activeTab==='gear')body.innerHTML=viewGear();
 if(activeTab==='diary'){body.innerHTML=viewDiary();showEntries()}
}
function viewLight(){
 const s=geo&&solar(geo.lat,geo.lng),can=Boolean(s?.rise&&s?.set);
 const morning=can?clock(s.rise)+'–'+clock(new Date(s.rise.getTime()+3600000)):'—';
 const evening=can?clock(new Date(s.set.getTime()-3600000))+'–'+clock(s.set):'—';
 const position=geo?geo.lat.toFixed(5)+', '+geo.lng.toFixed(5):'Ponto ainda não definido';
 return `<div class="ps-grid">
 ${card('📍 Local de observação',`<p class="ps-muted">${esc(position)}</p><div class="ps-row"><button type="button" class="ps-btn primary" data-act="gps">Usar GPS</button><button type="button" class="ps-btn" data-act="coordinates">Inserir coordenadas</button></div><div class="ps-fields" id="xp-coords" style="display:none;margin-top:13px"><label class="ps-field">Latitude<input id="xp-lat" type="number" step="any" min="-90" max="90" value="${geo?geo.lat:''}" placeholder="-18.92"></label><label class="ps-field">Longitude<input id="xp-lng" type="number" step="any" min="-180" max="180" value="${geo?geo.lng:''}" placeholder="-48.28"></label><button type="button" class="ps-btn primary" data-act="applycoords">Aplicar</button></div><p class="ps-info">Localização para planejamento pessoal. Evite compartilhar coordenadas de ninhos e espécies sensíveis.</p>`)}
 ${card('🌅 Janelas de luz',can?`<div class="ps-row"><div class="ps-big">${clock(s.rise)}<small>Nascer do sol</small></div><div class="ps-big">${clock(s.set)}<small>Pôr do sol</small></div></div><p class="ps-label">Luz dourada · manhã ${morning}</p><p class="ps-label">Luz dourada · tarde ${evening}</p><p class="ps-muted">Janelas estimadas de uma hora após o nascer e antes do pôr do sol.</p>`:'<p class="ps-muted">Defina o ponto para calcular o nascer e o pôr do sol e as janelas de luz dourada.</p>')}
 </div><div class="ps-grid">
 ${card('☾ Observação noturna',`<div class="ps-big">${moon()}<small>Fase lunar aproximada</small></div><p class="ps-muted">Relevo, vegetação e nebulosidade alteram a luz real. Não substitui observação em campo.</p>`)}
 ${card('☁ Clima para fotografia',`<p class="ps-muted" id="xp-weather">Nuvens difusas podem suavizar sombras; vento intenso dificulta macro e uso de teleobjetivas.</p><button type="button" class="ps-btn" data-act="weather" ${geo?'':'disabled'}>Consultar temperatura, vento e nuvens</button><p class="ps-small">Fonte: Open-Meteo · conexão necessária</p>`)}
 </div>`;
}
function choices(type){return gear.filter(x=>x.type===type).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}
function viewAssist(){
 return card('◎ Guia técnico de captura',`<p class="ps-muted">Ajuste seu equipamento para a cena. As configurações são referências iniciais, não substituem a leitura de luz.</p><div class="ps-fields">
 <label class="ps-field">Cena<select id="xp-scene"><option value="flight">Ave em voo</option><option value="perched">Ave ou animal pousado</option><option value="macro">Macro</option><option value="landscape">Paisagem</option><option value="vintage">Bokeh artístico</option><option value="night">Fauna em pouca luz</option></select></label>
 <label class="ps-field">Iluminação<select id="xp-light"><option value="sun">Sol pleno</option><option value="cloud">Nublado</option><option value="shade">Sombra / mata</option><option value="golden">Hora dourada</option><option value="dark">Luz muito baixa</option></select></label>
 <label class="ps-field">Câmera<select id="xp-camera"><option value="">Não especificar</option>${choices('camera')}</select></label>
 <label class="ps-field">Lente<select id="xp-lens"><option value="">Não especificar</option>${choices('lens')}</select></label>
 </div><p><button type="button" class="ps-btn primary" data-act="recommend">Gerar configurações</button></p><div id="xp-advice" aria-live="polite"></div>`)
 +card('Notas de campo','<p class="ps-muted">Extensor 2× reduz a abertura máxima em dois stops. A estabilização ajuda contra a tremulação da câmera, não contra o movimento do animal. Para desfoques artísticos, considere distância do fundo e qualidade da luz.</p><p class="ps-info">O assistente usa regras fotográficas. Não é uma análise automática por IA da imagem.</p>');
}
function recommendation(){
 const scene=$('xp-scene').value,light=$('xp-light').value,ln=gear.find(x=>x.id===$('xp-lens').value);
 const preset={
 flight:['1/1600–1/3200 s','f/5.6–f/8','AF contínuo + detecção de animais; rajadas','Acompanhe o voo antes do disparo.'],
 perched:['1/640–1/1250 s','f/4–f/8','AF no olho; atenção aos galhos entre a lente e o assunto','Aproxime-se com cuidado e mantenha fundo distante.'],
 macro:['1/250–1/800 s','f/8–f/16','Foco no olho ou plano crítico; flash difuso opcional','Poucos milímetros alteram drasticamente o plano de foco.'],
 landscape:['1/125–1/500 s','f/8–f/11','Histograma e realces; tripé quando necessário','ISO baixo com cena parada.'],
 vintage:['1/200–1/640 s','f/2–f/4','Foco manual, ampliação de foco ou peaking','Procure pontos luminosos no fundo para um bokeh expressivo.'],
 night:['1/500–1/1600 s','Abertura máxima','AF em alvos contrastados ou foco manual','Evite subexpor demais para depois recuperar ruído.']
 }[scene];
 const iso={sun:'100–800',cloud:'400–1600',shade:'800–3200',golden:'400–3200',dark:'1600–6400+'}[light];
 let note='';
 if(ln&&/helios/i.test(ln.name))note='Helios: aproveite o caráter óptico vintage e confirme foco ampliado.';
 else if(ln&&/150.?600/i.test(ln.name))note='Em 600 mm, estabilize bem o conjunto, especialmente em velocidades baixas.';
 else if(ln&&/70.?200/i.test(ln.name))note='Na 70–200 f/2.8, use a abertura ampla para separar o sujeito do fundo.';
 return `<div class="ps-result"><div class="ps-row"><div class="ps-big">${esc(preset[0])}<small>Velocidade sugerida</small></div><div class="ps-big">${esc(preset[1])}<small>Abertura sugerida</small></div></div><hr style="border:0;border-top:1px solid #ffffff20"><p><strong>ISO:</strong> ${esc(iso)} (Auto ISO é uma opção).</p><p><strong>Foco:</strong> ${esc(preset[2])}</p><p>${esc(preset[3])}</p>${note?`<p class="ps-info">${esc(note)}</p>`:''}<p class="ps-small">Revise a exposição no visor/histograma e ajuste conforme a cena.</p></div>`;
}
function viewGear(){
 return card('▤ Minha mochila',`<p class="ps-muted">Seus equipamentos ficam salvos neste aparelho e alimentam o assistente técnico.</p>${gear.map(x=>`<div class="ps-line"><div><b>${esc(x.name)}</b><p class="ps-small">${esc(x.note||'')} · ${x.type==='camera'?'câmera':x.type==='lens'?'lente':'acessório'}</p></div><button type="button" class="ps-btn" data-act="removegear" data-id="${esc(x.id)}">Remover</button></div>`).join('')||'<p class="ps-muted">Mochila vazia.</p>'}`)
 +card('Adicionar equipamento',`<form id="xp-gear-form"><div class="ps-fields"><label class="ps-field">Tipo<select name="type"><option value="camera">Câmera</option><option value="lens">Lente</option><option value="accessory">Acessório</option></select></label><label class="ps-field">Marca e modelo<input name="name" required maxlength="90" placeholder="Canon RF 100–500mm"></label></div><label class="ps-field" style="margin:12px 0">Anotações<input name="note" maxlength="200" placeholder="Ex.: sem estabilização"></label><button type="submit" class="ps-btn primary">Salvar equipamento</button></form>`);
}
function viewDiary(){
 return card('▧ Novo registro fotográfico',`<p class="ps-muted">Guarde espécie, luz, equipamento e decisões de captura. A foto original permanece intacta; salvamos apenas uma miniatura local.</p>
 <form id="xp-diary-form"><div class="ps-fields"><label class="ps-field">Título<input name="title" required maxlength="90" placeholder="Coruja no capim dourado"></label><label class="ps-field">Espécie / assunto<input name="species" maxlength="90" placeholder="Coruja-buraqueira"></label>
 <label class="ps-field">Câmera<select name="camera"><option value="">Sem seleção</option>${choices('camera')}</select></label><label class="ps-field">Lente<select name="lens"><option value="">Sem seleção</option>${choices('lens')}</select></label></div>
 <label class="ps-field" style="margin-top:12px">Notas da cena<textarea name="notes" maxlength="2000" placeholder="Horário, luz, comportamento, detalhes da composição..."></textarea></label>
 <label class="ps-field" style="margin-top:12px">Foto opcional<input name="photo" type="file" id="xp-photo-file" accept="image/*"></label><p class="ps-small" id="xp-exif-info">JPEG: leitura local de EXIF (ISO, velocidade, abertura e distância focal).</p>
 <label style="display:flex;gap:8px;align-items:center;margin:12px 0;font-size:12px"><input name="withLocation" type="checkbox" ${geo?'':'disabled'}> Associar posição GPS do planejamento ${geo?'('+geo.lat.toFixed(3)+', '+geo.lng.toFixed(3)+')':'(defina em Luz & local)'}</label>
 <div class="ps-row"><button type="submit" class="ps-btn primary">Salvar captura</button><button type="button" class="ps-btn" data-act="export">Exportar diário</button></div></form>`)
 +card('Registros neste aparelho','<div id="xp-entries"><p class="ps-muted">Carregando registros...</p></div>');
}
function idb(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(Error('Indisponível'));const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{req.result.createObjectStore('entries',{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});return dbPromise}
async function rows(){
 const db=await idb();return new Promise((res,rej)=>{const q=db.transaction('entries','readonly').objectStore('entries').getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error)})}
async function put(item){const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction('entries','readwrite');tx.objectStore('entries').put(item);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function del(id){const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction('entries','readwrite');tx.objectStore('entries').delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function showEntries(){
 const target=$('xp-entries');if(!target)return;
 try{const list=(await rows()).sort((a,b)=>b.date.localeCompare(a.date));target.innerHTML=list.length?list.map(x=>`<div class="ps-line">
 ${x.thumb?`<img src="${esc(x.thumb)}" class="ps-thumb" alt="Miniatura de captura">`:'<span class="ps-thumb" style="display:grid;place-items:center">📷</span>'}
 <div style="flex:1;min-width:0"><b>${esc(x.title)}</b><div class="ps-small">${shortDate(x.date)} ${x.species?'· '+esc(x.species):''}</div>${x.exif?.summary?`<div class="ps-small">${esc(x.exif.summary)}</div>`:''}${x.notes?`<p class="ps-muted" style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(x.notes)}</p>`:''}
 ${Number.isFinite(x.lat)&&Number.isFinite(x.lng)?`<div class="ps-small">📍 ${x.lat.toFixed(5)}, ${x.lng.toFixed(5)} · privado</div>`:''}</div><button class="ps-btn" type="button" data-act="delete" data-id="${esc(x.id)}">Excluir</button></div>`).join(''):'<p class="ps-muted">Nenhuma captura registrada.</p>'}
 catch{target.textContent='Seu navegador bloqueou o diário local. Verifique o armazenamento do dispositivo.'}
}
async function thumb(f){
 if(!f||!f.type.startsWith('image/'))return null;
 return new Promise(resolve=>{const url=URL.createObjectURL(f),img=new Image();let finished=false;
 const end=x=>{if(finished)return;finished=true;URL.revokeObjectURL(url);resolve(x)};
 img.onload=()=>{try{const factor=Math.min(1,750/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*factor);c.height=Math.round(img.height*factor);c.getContext('2d').drawImage(img,0,0,c.width,c.height);end(c.toDataURL('image/jpeg',.65))}catch{end(null)}};
 img.onerror=()=>end(null);img.src=url;setTimeout(()=>end(null),12000)});
}
async function exifRead(f){
 if(!f||!/jpe?g/i.test(f.type))return null;
 try{
  const buf=await f.slice(0,1500000).arrayBuffer(),d=new DataView(buf);if(d.getUint16(0)!==0xffd8)return null;
  let p=2,base=-1;while(p+12<d.byteLength){if(d.getUint8(p)!==255)break;const mark=d.getUint8(p+1),size=d.getUint16(p+2);
   if(mark===225&&String.fromCharCode(d.getUint8(p+4),d.getUint8(p+5),d.getUint8(p+6),d.getUint8(p+7))==='Exif'){base=p+10;break}
   if(!size||p+2+size>d.byteLength)break;p+=2+size}
  if(base<0)return null;const little=d.getUint16(base)===18761,u16=p=>d.getUint16(p,little),u32=p=>d.getUint32(p,little);
  function readTags(offset){
   const out={},s=base+offset;if(s<0||s+2>d.byteLength)return out;const n=Math.min(u16(s),150);
   for(let i=0;i<n;i++){const p=s+2+i*12;if(p+12>d.byteLength)break;const tag=u16(p),type=u16(p+2),count=u32(p+4),unit={2:1,3:2,4:4,5:8}[type];if(!unit||count>100000)continue;
    const off=unit*count<=4?p+8:base+u32(p+8);if(off<0||off+unit*count>d.byteLength)continue;
    if(type===3)out[tag]=u16(off);if(type===4)out[tag]=u32(off);
    if(type===5){const den=u32(off+4);out[tag]=den?u32(off)/den:0}
    if(type===2)out[tag]=Array.from(new Uint8Array(buf,off,Math.min(count,120))).map(c=>String.fromCharCode(c)).join('').replace(/\0+$/,'');
   }return out}
  const root=readTags(u32(base+4)),sub=root[0x8769]?readTags(root[0x8769]):{},sh=sub[0x829a],ap=sub[0x829d],iso=sub[0x8827],mm=sub[0x920a];
  const summary=[sh?'1/'+Math.round(1/sh)+'s':'',ap?'f/'+ap.toFixed(1):'',iso?'ISO '+iso:'',mm?Math.round(mm)+'mm':''].filter(Boolean).join(' · ');
  return {summary,shutter:sh||null,aperture:ap||null,iso:iso||null,focal:mm||null,camera:root[0x0110]||null,taken:sub[0x9003]||null};
 }catch{return null}
}
async function change(event){if(event.target?.id!=='xp-photo-file')return;file=event.target.files?.[0]||null;exif=await exifRead(file);const el=$('xp-exif-info');if(el)el.textContent=exif?.summary?'EXIF: '+exif.summary:file?'Foto: '+file.name+' · EXIF não detectado neste formato.':'JPEG: leitura de EXIF local.'}
async function submit(event){
 if(event.target.id==='xp-gear-form'){event.preventDefault();const fd=new FormData(event.target),name=String(fd.get('name')||'').trim().slice(0,90);
  if(!name)return toast('Informe o modelo.');gear.push({id:crypto.randomUUID(),type:fd.get('type'),name,note:String(fd.get('note')||'').trim().slice(0,200)});save(GEAR_KEY,gear);render();toast('Equipamento cadastrado.');return}
 if(event.target.id==='xp-diary-form'){event.preventDefault();const form=event.target,fd=new FormData(form),title=String(fd.get('title')||'').trim().slice(0,90);
  if(!title)return toast('Informe o título.');const b=form.querySelector('button[type=submit]');b.disabled=true;
  try{const camera=gear.find(x=>x.id===fd.get('camera'))?.name||'',lens=gear.find(x=>x.id===fd.get('lens'))?.name||'';
   const record={id:crypto.randomUUID(),title,date:new Date().toISOString(),species:String(fd.get('species')||'').trim().slice(0,90),notes:String(fd.get('notes')||'').trim().slice(0,2000),camera,lens,exif,thumb:await thumb(file),lat:fd.get('withLocation')&&geo?geo.lat:null,lng:fd.get('withLocation')&&geo?geo.lng:null};
   await put(record);form.reset();file=null;exif=null;await showEntries();toast('Captura salva neste aparelho.');
  }catch{toast('Não foi possível salvar. Verifique o espaço disponível.')}finally{b.disabled=false}}
}
async function click(event){
 const el=event.target.closest('button');if(!el)return;
 if(el.dataset.tab){if(activeTab==='meter'&&el.dataset.tab!=='meter')window.ExplorerPhotometer?.stop?.();activeTab=el.dataset.tab;render();return}
 const action=el.dataset.act;if(!action)return;
 if(action==='close')closeStudio();
 if(action==='coordinates'){$('xp-coords').style.display=$('xp-coords').style.display==='none'?'grid':'none'}
 if(action==='applycoords'){const a=$('xp-lat').value,b=$('xp-lng').value,lat=Number(a),lng=Number(b);if(!a||!b||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return toast('Coordenadas inválidas.');
  geo={lat,lng};save(GEO_KEY,geo);render();toast('Ponto atualizado.')}
 if(action==='gps'){if(!navigator.geolocation)return toast('GPS indisponível.');
  navigator.geolocation.getCurrentPosition(p=>{geo={lat:p.coords.latitude,lng:p.coords.longitude};save(GEO_KEY,geo);render();toast('Posição registrada.')},e=>toast('GPS: '+e.message),{enableHighAccuracy:true,timeout:15000,maximumAge:6000})}
 if(action==='weather'){if(!geo)return;const field=$('xp-weather');field.textContent='Consultando...';
  try{const url='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(geo.lat)+'&longitude='+encodeURIComponent(geo.lng)+'&current=temperature_2m,cloud_cover,wind_speed_10m&timezone=auto';
   const res=await fetch(url);if(!res.ok)throw Error();const dat=await res.json(),w=dat.current;
   field.textContent='Agora: '+w.temperature_2m+' °C · '+w.cloud_cover+'% de nuvens · vento '+w.wind_speed_10m+' km/h. Previsão meteorológica.';
  }catch{field.textContent='Previsão indisponível. Verifique sua conexão.'}}
 if(action==='recommend')$('xp-advice').innerHTML=recommendation();
 if(action==='removegear'){if(!confirm('Remover equipamento?'))return;gear=gear.filter(x=>x.id!==el.dataset.id);save(GEAR_KEY,gear);render()}
 if(action==='delete'){if(!confirm('Excluir este registro deste dispositivo?'))return;try{await del(el.dataset.id);await showEntries();toast('Registro excluído.')}catch{toast('Falha ao excluir.')}}
 if(action==='export'){try{const arr=await rows();if(!arr.length)return toast('Nenhum registro para exportar.');
  const payload={app:'Explorer Foto',version:1,exportedAt:new Date().toISOString(),entries:arr},blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='explorer-fotografia-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Diário exportado.')}catch{toast('Falha ao exportar o diário.')}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();