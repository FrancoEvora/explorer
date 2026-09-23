from pathlib import Path
import shutil
ROOT=Path('.')
def edit(name,old,new,count=1):
    p=ROOT/name;s=p.read_text();assert s.count(old)==count,(name,old[:90],s.count(old));p.write_text(s.replace(old,new))
def append(name,s):
    p=ROOT/name;p.write_text(p.read_text()+s)
js='site/conquista/conquista.js';html='site/conquista/index.html';audio='site/conquista/audio.js';build='.ops/conquest-update.mjs'
for f in [js,html,build]:
    p=ROOT/f;p.write_text(p.read_text().replace('solaris-conquista-v2.1','solaris-conquista-v2.2'))
shutil.copyfile('.ops/v22-score.js','site/conquista/music.js')
# Continuous music uses the same gesture-activated AudioContext as the existing FX.
edit(audio,'ambience:40','ambience:12,music:65')
edit(audio,"let lastKind='',cueCounts={};","let lastKind='',cueCounts={},music=null;")
edit(audio,"['volume','effects','ambience']","['volume','effects','ambience','music']",2)
edit(audio,'gain(amb,settings.ambience/100*.45,.25);','gain(amb,settings.ambience/100*.45,.25);music?.setVolume(settings.music/100);')
edit(audio,'fx.connect(master);amb.connect(master);','fx.connect(master);amb.connect(master);music=window.SolarisMusic?.create(ctx,master);')
edit(audio,'mix();ambience();notify();return true;','mix();ambience();music?.start();notify();return true;')
edit(audio,'activated=false;mix();stopAmbient();','activated=false;mix();stopAmbient();music?.stop();')
edit(audio,'function suspend(){stopAmbient();','function suspend(){stopAmbient();music?.stop();')
edit(audio,'function setScene(area){scene=area;updateScene();}','function setScene(area){scene=area;updateScene();music?.setScene(area);}')
edit(audio,"case 'arrival':notes", "case 'visit':notes([523.25,659.25,783.99,1046.5],.15,.075);break;case 'arrival':notes")
edit(audio,'lastKind,cueCounts:{...cueCounts}};','lastKind,cueCounts:{...cueCounts},musicTrack:music?.snapshot()||null};')
# Explicit reward rules and an append-only visited-id collection, under the existing save key.
edit(js,"const CHAPTERS=[", """const VISITS={portaria:'Primeira Chegada',praca:'Coração do Solaris',bosque:'Passos na Natureza',lago:'Olhar para o Lago',clube:'Momento de Lazer',quadras:'Espírito em Movimento',hipica:'Vida Equestre',acesso:'Portas Abertas',parque:'Vizinho do Verde'};
const EXTRA=['explorador-frame','explorador-tree'];
const visitCoins=v=>v.length*15+(v.length===9?100:0),visitXP=v=>v.length*20+(v.length===9?100:0);
const CHAPTERS=[""")
edit(js,"const ITEMS=[", """const ITEMS=[
{id:'explorador-frame',name:'Moldura Explorador do Solaris',icon:'trophy',exploration:9,kind:'frame',desc:'Moldura exclusiva aplicada ao seu cartão ao visitar os nove locais. Conquista virtual, sem custo.'},
{id:'explorador-tree',name:'Árvore dourada do explorador',icon:'tree',exploration:9,kind:'decor',desc:'Uma árvore especial para seu refúgio, conquistada ao completar os nove selos de visita. Item virtual, sem custo.'},""")
edit(js,"slots:Array(6).fill(null),node:0", "slots:Array(6).fill(null),visited:[],node:0")
edit(js,"const s=fresh();s.started=", "const s=fresh();s.visited=[...new Set(Array.isArray(raw.visited)?raw.visited:[])].filter(id=>typeof id==='string'&&Object.hasOwn(VISITS,id));s.started=")
edit(js,"let budget=s.best.reduce((n,v)=>n+(v?60+20*v:0),0);", "let budget=s.best.reduce((n,v)=>n+(v?60+20*v:0),0)+visitCoins(s.visited);")
edit(js,"const owned=[...s.claimed,...s.purchases];", "const owned=[...s.claimed,...s.purchases,...(s.visited.length===9?EXTRA:[])];")
edit(js,'earned=()=>completed()*60+stars()*20','earned=()=>completed()*60+stars()*20+visitCoins(state.visited)')
edit(js,"xp=()=>completed()*75+stars()*25", "xp=()=>completed()*75+stars()*25+visitXP(state.visited)")
edit(js,"owned=id=>state.claimed.includes(id)||state.purchases.includes(id)","owned=id=>state.claimed.includes(id)||state.purchases.includes(id)||(state.visited.length===9&&EXTRA.includes(id))")
edit(js,"eligible=t=>t.chapter?", "eligible=t=>t.exploration?state.visited.length===9:t.chapter?")
# Visits can also unlock decorating: the collection prize must be usable without finishing levels.
edit(js,"completed()<3", "completed()<3&&state.visited.length<9",3)
edit(js,"case 'ipe':return", "case 'explorador-tree':case 'ipe':return")
edit(js,"$('rewardPrice').textContent=has?'Já está na sua coleção':!unlock?", "$('rewardPrice').textContent=t.exploration?(has?'Coleção completa · recompensa automática':'Visite os nove locais para conquistar'):has?'Já está na sua coleção':!unlock?")
edit(js,"['milestones','store','chapterPrize']", "['milestones','store','chapterPrize','explorationAwards']")
edit(js,"applyOutfit();}\nfunction switchView", "applyOutfit();renderExploration();}\nfunction switchView")
# Opening/previewing a place does NOT award a visit. Only reaching its entry does.
edit(js,"mapStatus();centerMap();startMapLoop();}","mapStatus();centerMap();if(!route.length)awardVisit(area);startMapLoop();}")
edit(js,"notice('Você chegou a '+regions[targetArea].name+'.');", "notice('Você chegou a '+regions[targetArea].name+'.');awardVisit(targetArea);")
edit(js,"centerMap();save();launchMission(targetLevel);", "centerMap();save();awardVisit(targetArea);launchMission(targetLevel);")
edit(js,"switchView('journey');save();}", "switchView('journey');save();const here=Object.keys(regions).find(id=>nearest(regions[id].entry||regions[id].point)===state.node);if(here)awardVisit(here);}")
# Preserve earned collection in exports and show it on the downloadable card.
edit(js,"if(owned('moldura')){g.strokeStyle", "g.fillStyle='#53704f';g.font='20px Arial';g.fillText('EXPLORAÇÃO · '+state.visited.length+'/9 SELOS'+(state.visited.length===9?' · EXPLORADOR DO SOLARIS':''),64,1186);if(owned('moldura')||owned('explorador-frame')){g.strokeStyle")
edit(js,"g.strokeStyle='#b6a161';", "g.strokeStyle=owned('explorador-frame')?'#44785f':'#b6a161';")
# Audio settings expose music as a separate instrument bus; preserve prior FX/mute preferences.
edit(js,"['ambientVolume','ambience']", "['ambientVolume','ambience'],['musicVolume','music']",2)
edit(js,"storage:persistent})),levels", "storage:persistent,visits:state.visited.length,explorationCoins:visitCoins(state.visited),explorationXP:visitXP(state.visited)})),levels")
edit(js,"{id,...r,node:nearest", "{id,...r,visited:state.visited.includes(id),achievement:VISITS[id],node:nearest")
edit(js,"$('placeName').textContent=r.name;", "$('placeName').textContent=r.name;$('placeAchievement').textContent=state.visited.includes(id)?'✓ '+VISITS[id]+' · selo já conquistado':'Primeira visita: '+VISITS[id]+' · +20 XP e +15 Sóis. Caminhe até o local para conquistar.';")
# New visual achievements are non-modal and never interrupt a phase or redirect automatically.
code=r'''
function renderExploration(){
 const count=state.visited.length,all=count===9;
 $('app').dataset.visits=String(count);
 $('visitCount').textContent=count+' / 9 lugares';$('visitProgress').style.width=(count/9*100)+'%';
 $('exploreMessage').textContent=all?'Explorador do Solaris · coleção completa':'Visite, conquiste um selo e ganhe +20 XP e +15 Sóis por local.';
 $('visitStamps').innerHTML=Object.entries(VISITS).map(([id,name])=>`<button class="visit-stamp ${state.visited.includes(id)?'earned':''}" data-visit-place="${id}" aria-label="${esc(name)}, ${state.visited.includes(id)?'conquistada':'a descobrir'}">${svg(regions[id].icon)}<b>${name}</b><span>${regions[id].name}</span><small>${state.visited.includes(id)?'✓ SELO CONQUISTADO':'+20 XP · +15 Sóis'}</small></button>`).join('');
 $('visitCollection').innerHTML=all?`${svg('trophy')}<div><b>Explorador do Solaris</b><p>9 selos completos · +100 XP, +100 Sóis, moldura exclusiva e árvore dourada já adicionados à sua coleção.</p></div>`:`${svg('lock')}<div><b>Explorador do Solaris</b><p>Complete os nove selos: +100 XP, +100 Sóis, moldura exclusiva e árvore dourada. Prêmios virtuais, uma única vez.</p></div>`;
 $('explorationAwards').innerHTML=EXTRA.map(id=>{const t=ITEMS.find(t=>t.id===id);return `<article class="milestone ${all?'claimed':''}"><div class="reward-emblem">${svg(t.icon)}</div><small>COLEÇÃO DOS 9 LOCAIS</small><h3>${t.name}</h3><p>${all?'Conquista adicionada automaticamente.':count+' de 9 selos. Visite os locais para conquistar.'}</p><button class="secondary" data-item="${id}">${all?'Usar conquista':'Conhecer prêmio'}</button></article>`;}).join('');
 for(const id of Object.keys(VISITS)){const yes=state.visited.includes(id),pin=$('dest-'+id),card=document.querySelector('[data-place="'+id+'"]');if(pin){pin.classList.toggle('visited',yes);pin.setAttribute('aria-label',regions[id].name+(yes?' · selo conquistado':' · selo a descobrir'));}if(card){card.classList.toggle('visited',yes);card.querySelector('small').textContent=yes?'✓ '+VISITS[id]:'Visite e conquiste · +15 Sóis';}}
}
function awardVisit(id){
 if(!ready||!state.started||!Object.hasOwn(VISITS,id)||state.visited.includes(id))return false;
 const n=nodes[nearest(regions[id].entry||regions[id].point)];
 if(route.length||Math.hypot(position.x-n.x,position.y-n.y)>4)return false;
 state.visited.push(id);save();update();const all=state.visited.length===9;
 $('visitToastTitle').textContent=all?'Explorador do Solaris':VISITS[id];
 $('visitToastText').textContent=all?'Último selo + coleção completa: +120 XP · +115 Sóis. Moldura e árvore dourada liberadas.':'+20 XP · +15 Sóis · selo adicionado ao passaporte';
 $('visitToast').hidden=false;clearTimeout(awardVisit.timer);awardVisit.timer=setTimeout(()=>$('visitToast').hidden=true,6500);sound?.play(all?'chapter':'visit');return true;
}
$('explorePlaces').onclick=()=>{$('locationsDialog').close();switchView('mapView');overviewMap();showDialog('locationsDialog');};
$('visitStamps').onclick=e=>{const b=e.target.closest('[data-visit-place]');if(b)inspectPlace(b.dataset.visitPlace);};
$('visitToastClose').onclick=()=>$('visitToast').hidden=true;
$('visitToastPassport').onclick=()=>{$('visitToast').hidden=true;switchView('passport');$('visitStamps').scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'});};
'''
edit(js,'refreshSoundUI();\nupdate();',code+'\nrefreshSoundUI();\nupdate();')
# DOM additions.
edit(html,'<script src="./audio.js?v=2.1" defer></script>','<script src="./music.js?v=22" defer></script><script src="./audio.js?v=22" defer></script>')
p=Path(html);p.write_text(p.read_text().replace('?v=2.1','?v=22'))
edit(html,'<div class="journey-layout">','''<div class="exploration-progress"><div><span class="eyebrow">CONQUISTAS DE EXPLORAÇÃO</span><h2 id="visitCount">0 / 9 lugares</h2><p id="exploreMessage"></p><div class="visit-track"><i id="visitProgress"></i></div></div><button id="explorePlaces" class="secondary">Descobrir lugares ↗</button></div><div class="journey-layout">''')
edit(html,'<h2 class="section-title">Conquistas de capítulo</h2>','<h2 class="section-title">Conquistas de exploração</h2><div id="explorationAwards" class="milestones"></div><h2 class="section-title">Conquistas de capítulo</h2>')
edit(html,'<div class="passport-actions">','<section class="visit-section"><span class="eyebrow">NOVE LUGARES. NOVE CONQUISTAS.</span><h2>Locais visitados</h2><p>Cada selo é conquistado na chegada. Rever o local não repete o prêmio.</p><div id="visitStamps" class="visit-stamps"></div><div id="visitCollection" class="visit-collection"></div></section><div class="passport-actions">')
edit(html,'<p id="placeDescription"></p>','<p id="placeDescription"></p><p id="placeAchievement" class="place-achievement"></p>')
edit(html,'Somente os desafios e os prêmios seguem as etapas da jornada.','Cada primeira visita rende um selo, 20 XP e 15 Sóis. Os desafios seguem as etapas da jornada.')
edit(html,'Natureza, passos e sons das conquistas. Volume ajustável.','Música instrumental contínua e efeitos das conquistas. Volumes independentes.')
edit(html,'Sons do Solaris.</h2>','Música do Solaris.</h2><p class="music-title">Caminhos de Sol <span>Trilha instrumental original · 76 BPM · em loop</span></p>')
edit(html,'<label for="effectsVolume">','<label for="musicVolume">Música instrumental <output id="musicVolumeValue">65%</output></label><input id="musicVolume" type="range" min="0" max="100" value="65"><label for="effectsVolume">')
edit(html,'Ativar e testar som</button>','Ativar música e testar som</button>')
edit(html,'<div id="toast" hidden role="status"></div>','<aside id="visitToast" class="visit-toast" hidden aria-live="polite"><button id="visitToastClose" aria-label="Fechar conquista">×</button><span class="eyebrow">CONQUISTA DESBLOQUEADA</span><h3 id="visitToastTitle"></h3><p id="visitToastText"></p><button class="textbutton" id="visitToastPassport">Ver meus selos ↗</button></aside><div id="toast" hidden role="status"></div>')
edit(html,'<p><b>15 fases, 5 capítulos.</b>','<p><b>9 lugares, 9 selos.</b> Cada primeira chegada rende 20 XP e 15 Sóis. Complete a coleção para receber +100 XP, +100 Sóis, moldura e árvore dourada. Recompensas virtuais, uma única vez; sem alterar suas estrelas das fases.</p><p><b>15 fases, 5 capítulos.</b>')
append('site/conquista/conquista.css',r'''
/* v2.2: exploration is a parallel, first-visit-only achievement track. */
.exploration-progress{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px;margin:20px 0;border:1px solid #d9cb9d55;border-radius:20px;background:linear-gradient(110deg,#204536,#13382c)}.exploration-progress h2{margin:6px 0;font-size:25px}.exploration-progress p{font-size:13px;color:#d9dfce;margin:6px 0 12px}.visit-track{height:5px;border-radius:5px;background:#ffffff20;max-width:420px;overflow:hidden}.visit-track i{display:block;height:100%;width:0;background:#e7d594;transition:width .5s}.visit-section{margin:26px 0}.visit-section>p{color:var(--muted);font-size:13px}.visit-stamps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.visit-stamp{display:flex;flex-direction:column;align-items:flex-start;gap:7px;padding:16px;border-radius:16px;border:1px solid #ffffff24;background:#ffffff05;text-align:left;color:inherit}.visit-stamp svg{width:30px;height:30px;color:#a0b09a}.visit-stamp b{font-size:14px}.visit-stamp span{font-size:12px;color:#bacabc}.visit-stamp small{font-size:10px;color:#dacfaa}.visit-stamp.earned{border-color:#dcc99c88;background:#294a34}.visit-stamp.earned svg{color:#e8d6a0}.visit-collection{display:flex;gap:16px;align-items:center;margin-top:16px;border:1px solid #dfcc9960;border-radius:16px;padding:20px;background:#29452f}.visit-collection>svg{width:38px;height:38px;flex-shrink:0;color:#eddca9}.visit-collection p{font-size:13px;margin:6px 0 0;color:#dbe0cd}.place-achievement{padding:12px 14px;border:1px solid #d7c49450;border-radius:12px;background:#e6d49412;color:#e8d9ad!important;font-size:13px!important}.map-pin.visited b{background:#e8d7a5;color:#1b3c2b}.location-card.visited small{color:#e8d7a5}.visit-toast{position:fixed;right:18px;bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:85;width:min(360px,calc(100vw - 28px));padding:20px 22px 14px;border:1px solid #e8d7a5a0;border-radius:20px;background:#143629f5;box-shadow:0 10px 50px #0007;animation:visit-in .3s ease}.visit-toast h3{margin:7px 20px 8px 0;font-size:22px;color:#f7e9bb}.visit-toast p{font-size:13px;color:#d8e0cd;line-height:1.5;margin:0}.visit-toast>#visitToastClose{position:absolute;right:7px;top:7px;width:34px;height:34px;border:0;background:none;color:inherit;font-size:24px}.visit-toast .textbutton{margin-top:4px}.music-title{margin:0 0 16px!important;font-size:20px!important}.music-title span{display:block;font-size:12px;color:#b5c7b9;margin-top:4px}#audioDialog .dialog-body{padding-top:40px}@keyframes visit-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@media(max-width:600px){.exploration-progress{padding:16px;gap:10px;align-items:stretch;flex-direction:column}.exploration-progress>.secondary{align-self:flex-start}.visit-stamps{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.visit-stamp{padding:12px}.visit-stamp b{font-size:13px}.visit-toast{bottom:calc(84px + env(safe-area-inset-bottom,0px));right:14px}.visit-section{scroll-margin-top:12px}}@media(prefers-reduced-motion:reduce){.visit-toast{animation:none}.visit-track i{transition:none}}
''')
# Build and metadata always include the reviewed local score; no network/media dependencies.
edit(build,"'paths.js','audio.js'","'paths.js','music.js','audio.js'",2)
edit(build,"audio:{engine:'Web Audio'", "exploration:{places:9,firstVisitXP:20,firstVisitSuns:15,collectionXP:100,collectionSuns:100,duplicateRewards:false},audio:{music:'Caminhos de Sol',musicLoop:true,engine:'Web Audio'")
append('site/conquista/README.md','''\n\n## v2.2 — music and visit achievements\nCaminhos de Sol is an original 16-bar instrumental composition at 76 BPM, with a written melody, warm keys, arpeggios, sustained harmony and bass. It is continuously sequenced on the shared gesture-activated AudioContext. Music, effects, ambient and master levels are independently controllable; backgrounding stops the score, and a deliberate interaction resumes it without stacking loops. No music files or outside requests are used.\n\nEach first arrival at one of the nine places awards its named passport seal, 20 XP and 15 virtual Suns. Opening a card or merely moving the camera does not count. The starting gate counts on entry. The existing skip-to-challenge action counts as arrival at that challenge's location. Repeated arrival has no additional reward. Visiting all nine adds 100 XP, 100 Suns, an exclusive passport frame and a gold tree decoration, automatically and once. Visit rewards do not add phase stars or bypass phase locks.\n\nThe existing v2 save key, 15-phase records, items and outfit choices are retained. Older saves begin with no retrospective visit record; a current location can receive its first seal on deliberate entry. Passport exports include visits. Imported IDs are allowlisted and deduplicated; totals are derived from visits and phase records rather than trusted input balances. Saves remain local and editable by their owner: no anti-fraud guarantee, official ranking or real prize is enabled.\n''')
print('v2.2 music and first-arrival achievements integrated.')
