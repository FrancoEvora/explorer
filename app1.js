
const BUCKET='explorer-media';
const $=id=>document.getElementById(id);
let sb;
let user=null,mode='in',active=null,watch=null,points=[],map=null,line=null,marker=null,feedType='all',feedCache=[],siren=null;
let sosActive=false,sosAudioCtx=null,sosOsc=null,sosGain=null,sosSpeechTimer=null,sosFlashTimer=null,sosTorchStream=null;
const logo=`<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="bg" x1="32" y1="20" x2="220" y2="236" gradientUnits="userSpaceOnUse"><stop stop-color="#c9ff2a"/><stop offset="0.35" stop-color="#15a5ff"/><stop offset="0.7" stop-color="#ff6b1a"/><stop offset="1" stop-color="#ff3e8a"/></linearGradient></defs><rect x="14" y="14" width="228" height="228" rx="68" fill="#071a25" stroke="#ffffff24"/><circle cx="128" cy="128" r="78" fill="none" stroke="url(#bg)" stroke-width="10"/><path d="M128 30l16 66-16 16-16-16 16-66Z" fill="#c9ff2a"/><path d="M226 128l-66 16-16-16 16-16 66 16Z" fill="#15a5ff"/><path d="M128 226l-16-66 16-16 16 16-16 66Z" fill="#ff3e8a"/><path d="M30 128l66-16 16 16-16 16-66-16Z" fill="#ff6b1a"/><circle cx="128" cy="128" r="26" fill="#f7fbff"/><path d="M104 150l18-30 14 18 13-23 27 35H81l23-0Z" fill="#071a25"/></svg>`;
$('authLogo').innerHTML=$('mainLogo').innerHTML=logo;
const msg=(t,c='')=>{const el=$('authMsg'); if(el){el.textContent=t;el.className='notice '+c;}};
const toast=t=>{const d=document.createElement('div');d.className='notice ok';d.style='position:fixed;z-index:99;left:50%;bottom:110px;transform:translateX(-50%);max-width:90%';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)};
const uid=p=>p+'-'+crypto.randomUUID();
const km=m=>(Number(m||0)/1000).toFixed(1)+' km';
const dt=x=>new Date(x).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function makeClient(){
  const t=await fetch('https://raw.githubusercontent.com/FrancoEvora/explorer/main/cloud.js?config=2',{cache:'no-store'}).then(r=>r.text());
  const u=t.match(/const SUPABASE_URL = '([^']+)'/)[1];
  const k=t.match(/const SUPABASE_PUBLISHABLE_KEY = '([^']+)'/)[1];
  sb=supabase.createClient(u,k);
  return sb;
}
function setMode(m){
  mode=m;
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
  const tab=$(m==='in'?'tabIn':m==='up'?'tabUp':'tabPublic');
  if(tab) tab.classList.add('active');
  const signup=document.querySelector('.signup');
  if(signup) signup.classList.toggle('hidden',m!=='up');
  $('authBtn').textContent=m==='up'?'Criar conta':'Entrar';
  if(m==='public'){showPublicApp();show('explore');loadFeed();}
}
async function boot(){
  $('tabIn').onclick=()=>setMode('in');
  $('tabUp').onclick=()=>setMode('up');
  $('tabPublic').onclick=()=>setMode('public');
  $('authForm').onsubmit=async e=>{e.preventDefault();const email=$('email').value.trim(),password=$('password').value,name=$('name').value.trim();$('authBtn').disabled=true;msg(mode==='up'?'Criando sua conta…':'Entrando…');try{if(mode==='up'){if(!name)throw Error('Informe seu nome.');const{data,error}=await sb.auth.signUp({email,password,options:{data:{full_name:name}}});if(error)throw error;msg(data.session?'Conta criada e conectada.':'Conta criada. Confirme o e-mail recebido e depois entre.','ok')}else{const{error}=await sb.auth.signInWithPassword({email,password});if(error)throw error}}catch(x){msg(x.message,'error')}finally{$('authBtn').disabled=false}};
  sb.auth.onAuthStateChange(async(_,s)=>{if(s?.user){user=s.user;await enter()}else if(!location.search){user=null;$('app').classList.add('hidden');$('auth').classList.remove('hidden')}});
  const {data}=await sb.auth.getSession();
  if(data.session){user=data.session.user;await enter();} else {$('auth').classList.remove('hidden');}
  bindStaticUI();
  const p=new URLSearchParams(location.search); if(p.get('type')&&p.get('id')) openPublic(p.get('type'),p.get('id'));
}
async function enter(){ $('auth').classList.add('hidden');$('app').classList.remove('hidden');$('status').textContent='online'; await Promise.all([loadProfile(),loadMine(),loadFeed()]); initMap(); }
function bindStaticUI(){
  document.querySelectorAll('[data-screen]').forEach(b=>b.onclick=()=>show(b.dataset.screen));
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
  $('locate').onclick=()=>navigator.geolocation.getCurrentPosition(p=>{initMap();map.setView([p.coords.latitude,p.coords.longitude],16);if(marker)marker.remove();marker=L.circleMarker([p.coords.latitude,p.coords.longitude],{radius:9,color:'#b8f500',fillOpacity:1}).addTo(map)});
  $('startTrail').onclick=async()=>{if(!user)return toast('Entre para registrar uma trilha.');const name=prompt('Nome da trilha:');if(!name)return;const place=prompt('Local ou cidade:')||'';const pub=confirm('Deseja publicar esta trilha na comunidade?');active={id:uid('trail'),name,place,start:new Date().toISOString(),public:pub,distance:0};points=[];$('startTrail').classList.add('hidden');$('stopTrail').classList.remove('hidden');$('activeInfo').textContent=name+' · GPS em gravação';watch=navigator.geolocation.watchPosition(track,e=>toast('GPS indisponível: '+e.message),{enableHighAccuracy:true,maximumAge:3000});};
  $('stopTrail').onclick=finishTrail;
  $('obsForm').onsubmit=saveObservation;
}
function showPublicApp(){$('auth').classList.add('hidden');$('app').classList.remove('hidden');$('home').classList.add('hidden');$('add').classList.add('hidden');$('profile').classList.add('hidden');document.querySelectorAll('.nav button').forEach(b=>{if(!['explore','mapScreen'].includes(b.dataset.screen))b.style.display='none'})}
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.screen===id));if(id==='mapScreen')setTimeout(()=>map?.invalidateSize(),100);if(id==='explore')loadFeed();}
function initMap(){if(map)return;map=L.map('map').setView([-18.92,-48.28],6);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map)}
function haversine(a,b){const R=6371000,r=x=>x*Math.PI/180,d1=r(b.lat-a.lat),d2=r(b.lng-a.lng),q=Math.sin(d1/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(d2/2)**2;return 2*R*Math.asin(Math.sqrt(q));}
function track(p){if(!active) return; const q={lat:p.coords.latitude,lng:p.coords.longitude,alt:p.coords.altitude,accuracy:p.coords.accuracy,time:new Date().toISOString()};if(points.length){const a=points.at(-1);active.distance+=haversine(a,q)}points.push(q);$('sDist').textContent=km(active.distance);$('sPts').textContent=points.length;initMap();if(line)line.remove();line=L.polyline(points.map(x=>[x.lat,x.lng]),{color:'#1687ff',weight:6}).addTo(map);map.fitBounds(line.getBounds(),{padding:[20,20]});}
async function finishTrail(){if(!active)return;if(watch)navigator.geolocation.clearWatch(watch);watch=null;const end=new Date().toISOString(),desc=prompt('Conte um pouco sobre a trilha:')||'';const row={id:active.id,user_id:user.id,name:active.name,place:active.place,start_time:active.start,end_time:end,distance_meters:active.distance,is_active:false,description:desc,is_public:active.public};const{error}=await sb.from('trails').insert(row);if(error)return toast(error.message);if(points.length){const rows=points.map((p,i)=>({user_id:user.id,trail_id:active.id,sequence_no:i,recorded_at:p.time,latitude:p.lat,longitude:p.lng,altitude:p.alt,accuracy:p.accuracy}));await sb.from('trail_points').insert(rows)}active=null;points=[];$('startTrail').classList.remove('hidden');$('stopTrail').classList.add('hidden');$('activeInfo').textContent='Trilha salva com sucesso.';toast('Trilha finalizada e publicada.');loadMine();loadFeed();}
async function saveObservation(e){e.preventDefault();if(!user)return toast('Entre para registrar uma observação.');const id=uid('obs');let loc=null;try{loc=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(p=>res(p.coords),rej,{enableHighAccuracy:true,timeout:8000}))}catch{}const row={id,user_id:user.id,trail_id:active?.id||null,type:$('otype').value,status:'Registrado',species:$('species').value.trim(),behavior:$('behavior').value.trim(),habitat:$('habitat').value.trim(),notes:$('notes').value.trim(),latitude:loc?.latitude||null,longitude:loc?.longitude||null,altitude:loc?.altitude||null,is_public:$('obsPublic').checked};const{error}=await sb.from('observations').insert(row);if(error)return toast(error.message);const file=$('photo').files[0];if(file){const mid=uid('media'),path=`${user.id}/${mid}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi,'-')}`;const up=await sb.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});if(!up.error)await sb.from('media').insert({id:mid,user_id:user.id,observation_id:id,kind:'photo',name:file.name,mime_type:file.type,size_bytes:file.size,storage_path:path,is_public:row.is_public})}$('obsForm').reset();$('obsPublic').checked=true;toast('Observação salva.');loadMine();loadFeed();show('home');}
async function profiles(ids){if(!ids.length)return{};const{data}=await sb.from('public_profiles').select('*').in('id',[...new Set(ids)]);return Object.fromEntries((data||[]).map(x=>[x.id,x]))}
async function mediaFor(obs){if(!obs.length)return{};const{data}=await sb.from('media').select('*').in('observation_id',obs).eq('is_public',true);const out={};for(const m of data||[]){if(!out[m.observation_id]){const{data:u}=await sb.storage.from(BUCKET).createSignedUrl(m.storage_path,3600);if(u?.signedUrl)out[m.observation_id]=u.signedUrl}}return out}
window.ExplorerState={get sb(){return sb},get user(){return user},set user(v){user=v},get feedType(){return feedType},set feedType(v){feedType=v},get feedCache(){return feedCache},set feedCache(v){feedCache=v},toast,show,initMap,profiles,mediaFor,km,dt,esc};
