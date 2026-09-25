'use strict';
// Public Enterprise projection and opt-in audio. No commercial data is persisted in the browser.
(() => {
 const API='/api/solaris';
 const PUBLIC_KEY='sb_publishable_nMCXNDXMvU0EbMSSmnEfQg_0uE_lVOW';
 const labels={disponivel:'Disponível',reservado:'Reservado',vendido:'Vendido',bloqueado:'Indisponível',indisponivel:'Indisponível',institucional:'Institucional',unknown:'A confirmar'};
 const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
 const decimal=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
 let units=new Map(),asOf=null,loaded=0,request=null,failed=false,selection=null;
 let voiceEnabled=false,musicEnabled=false,speaking=false,voiceRequest=null,voiceToken=0,ctx=null,musicGain=null,voiceGain=null;
 let voiceState='idle',currentSpeech=null,tourWaitStarted=0;
 const music=$('#ambient-audio'),voice=$('#bia-audio');
 const soundButton=$('#sound-btn'),soundPanel=$('#sound-panel');

 async function api(body,signal){
  const response=await fetch(API,{method:'POST',headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal});
  const data=await response.json();
  if(!response.ok){const error=new Error('SERVICE_UNAVAILABLE');error.code=data.error;throw error;}
  return data;
 }
 const unitFor=id=>units.get(id);
 const isFresh=()=>loaded&&Date.now()-loaded<90000&&!failed;
 function statusFor(id){return isFresh()?(unitFor(id)?.status||'unknown'):'unknown';}
 function paint(){
  $$('.lot-choice,.lot-polygon').forEach(el=>{
   const p=lots.find(p=>p.id===el.dataset.lot);if(!p)return;
   const status=statusFor(p.id),label=`Quadra ${p.block}, lote ${String(p.n).padStart(2,'0')}. ${labels[status]}`;
   el.dataset.status=status;el.setAttribute('aria-label',label);
   if(el.matches('polygon'))el.setAttribute('tabindex',tab!=='places'&&pointsVisible?'0':'-1');
   const title=el.querySelector('title');if(title)title.textContent=label;
  });
  const available=isFresh()?[...units.values()].filter(u=>u.status==='disponivel').length:null;
  $('#inventory-summary').textContent=available===null?(failed?'Consulta indisponível. Tente novamente.':'Consultando Évora Enterprise…'):`${available} lotes disponíveis · Évora Enterprise`;
  $('#inventory-refresh').hidden=!failed;
  $('#inventory-legend').hidden=tab==='places'||!pointsVisible;
  $('#inventory-legend').dataset.loading=!isFresh();
 }
 function renderCommerce(){
  const box=$('#commercial-info');box.replaceChildren();box.hidden=!selection||selection.kind==='places';
  $('#parcel-info').hidden=true;
  const reserve=$('#reserve-lot');reserve.hidden=!selection||selection.kind!=='lots'||selection.p.institutional;
  if(box.hidden)return;
  const {p,kind}=selection;
  const line=(tag,text,cls,parent=box)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;parent.append(el);return el;};
  if(kind==='blocks'){
   const group=[...units.values()].filter(u=>u.block===p.n),available=group.filter(u=>u.status==='disponivel').length;
   line('p',isFresh()?`${available} ${available===1?'lote disponível':'lotes disponíveis'} de ${lots.filter(l=>l.block===p.n).length}`:`${lots.filter(l=>l.block===p.n).length} lotes · selecione para explorar`,'block-availability');
   return;
  }
  const u=isFresh()?unitFor(p.id):null,area=u?.area||lotAreas[p.id],status=p.institutional?'institucional':statusFor(p.id);
  reserve.disabled=isFresh()&&status!=='disponivel';
  reserve.setAttribute('aria-label',`Reservar ${lotLabel(p)}, quadra ${p.block}`);
  const row=line('div','','commercial-row');
  if(area)line('strong',`${decimal.format(area)} m²`,'lot-size',row);
  const badge=line('span',labels[status],'availability-badge',row);badge.dataset.status=status;
  line('p',p.institutional?'Área institucional':`Lote residencial · Quadra ${p.block}`,'lot-characteristics');
  $('#detail-text').hidden=true;
 }
 async function loadInventory(force=false){
  if(request)return request;
  if(!force&&isFresh()&&Date.now()-loaded<15000)return;
  const panelHeight=$('#detail-panel').offsetHeight;
  request=(async()=>{
   try{
    let data;
    try{data=await api({action:'inventory'},AbortSignal.timeout(25000));}
    catch(error){if(!navigator.onLine)throw error;data=await api({action:'inventory'},AbortSignal.timeout(25000));}
    if(!Array.isArray(data.units)||!data.units.length||!Number.isFinite(Date.parse(data.asOf)))throw new Error('INVALID_INVENTORY');
    const known=new Set(lots.map(p=>p.id)),fresh=new Map();
    for(const u of data.units){
     if(!known.has(u.id))continue;
     if(fresh.has(u.id)||!Object.hasOwn(labels,u.status)||u.status==='unknown'||![u.area,u.price,u.pricePerSqm].every(n=>n===null||(typeof n==='number'&&Number.isFinite(n)&&n>0)))throw new Error('INVALID_INVENTORY');
     if(u.status!=='disponivel'){u.price=null;u.pricePerSqm=null;}
     fresh.set(u.id,u);
    }
    if(!fresh.size)throw new Error('INVALID_INVENTORY');
    const changed=selection?.kind==='lots'&&JSON.stringify(units.get(selection.p.id))!==JSON.stringify(fresh.get(selection.p.id));
    if(loaded&&changed&&speaking)stopVoice();
    units=fresh;asOf=data.asOf;loaded=Date.now();failed=false;
   }catch{
    failed=true;units=new Map();loaded=0;
    if(selection?.kind!=='places')stopVoice();
   }finally{
    request=null;renderLotList();paint();renderCommerce();
    if(selection&&selection.kind!=='places'&&Math.abs($('#detail-panel').offsetHeight-panelHeight)>1)requestAnimationFrame(()=>{if(selection)focus(selection.p);});
   }
  })();return request;
 }

 // Two media elements and gain controls also allow independent volume on mobile Safari.
 function unlockAudio(){
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!ctx&&AudioContext){try{
   ctx=new AudioContext();musicGain=ctx.createGain();voiceGain=ctx.createGain();
   ctx.createMediaElementSource(music).connect(musicGain).connect(ctx.destination);
   ctx.createMediaElementSource(voice).connect(voiceGain).connect(ctx.destination);
  }catch{ctx=null;musicGain=null;voiceGain=null;}}
  if(ctx?.state==='suspended')ctx.resume().catch(()=>{});
  if(!voice.src){
   voice.src='data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==';
   voice.play().catch(()=>{});
  }
  setVolumes();
 }
 function setVolumes(){
  const musicLevel=Number($('#music-volume').value)/100*(speaking?.22:1),voiceLevel=Number($('#voice-volume').value)/100;
  if(ctx&&musicGain&&voiceGain){musicGain.gain.setTargetAtTime(musicLevel,ctx.currentTime,.25);voiceGain.gain.setTargetAtTime(voiceLevel,ctx.currentTime,.1);}
  else{music.volume=musicLevel;voice.volume=voiceLevel;}
  $('#music-level').textContent=$('#music-volume').value+'%';$('#voice-level').textContent=$('#voice-volume').value+'%';
 }
 function audioStatus(text){$('#audio-status').textContent=text;}
 function audioUI(){
  $('#voice-enabled').checked=voiceEnabled;$('#music-enabled').checked=musicEnabled;
  soundButton.dataset.active=voiceEnabled||musicEnabled;
  const button=$('#read-selection');button.hidden=!selection;
  button.innerHTML=icon(speaking?'pause':'play')+(speaking?'Parar leitura':'Ouvir Bia');
  button.setAttribute('aria-label',speaking?'Parar leitura da Bia':'Ouvir Bia sobre este local');
  $('#sound-start').textContent=voiceEnabled||musicEnabled?'Desligar todo o som':'Ativar voz e música';
 }
 function stopVoice(){
  voiceToken++;voiceRequest?.abort();voiceRequest=null;voice.pause();
  window.speechSynthesis?.cancel();speaking=false;voiceState='idle';currentSpeech=null;setVolumes();audioUI();
 }
 function finished(){speaking=false;voiceState='idle';setVolumes();audioUI();audioStatus(voiceEnabled?'Bia ativada. Selecione outro lote ou área.':'Som sob seu controle.');}
 voice.addEventListener('ended',()=>{if(voiceState==='playing')finished();});
 voice.addEventListener('error',()=>{if(voiceState==='playing'){finished();audioStatus('Não foi possível reproduzir. Toque em Ouvir Bia para tentar novamente.');}});
 function fallbackText(){
  if(!selection)return '';
  const {p,kind}=selection;
  if(kind==='places')return `${p.title}. ${p.description} ${p.note}`;
  if(kind==='blocks'){const n=[...units.values()].filter(u=>u.block===p.n&&u.status==='disponivel').length;return `Quadra ${p.n}. ${isFresh()?`${n} lotes disponíveis`: `${lots.filter(l=>l.block===p.n).length} lotes identificados`}. Selecione um lote para conhecer seus detalhes.`;}
  const u=isFresh()?unitFor(p.id):null,area=u?.area||lotAreas[p.id];
  return `Lote ${p.n}, quadra ${p.block}. ${p.institutional?'Área institucional.':'Lote residencial.'} ${area?`Área de ${decimal.format(area)} metros quadrados. `:''}`;
 }
 function deviceVoice(text,token){
  if(!('speechSynthesis' in window)){finished();audioStatus('A voz está indisponível neste momento. Tente novamente.');return;}
  const utterance=new SpeechSynthesisUtterance(text),voices=window.speechSynthesis.getVoices();
  utterance.lang='pt-BR';utterance.rate=.98;utterance.volume=Number($('#voice-volume').value)/100;
  utterance.voice=voices.find(v=>v.lang==='pt-BR'&&/Luciana|Francisca|female/i.test(v.name))||voices.find(v=>v.lang==='pt-BR')||null;
  utterance.onend=()=>{if(token===voiceToken)finished();};utterance.onerror=()=>{if(token===voiceToken)finished();};
  voiceState='playing';window.speechSynthesis.speak(utterance);audioStatus('Voz da Bia indisponível. Usando a voz do dispositivo.');
 }
 async function readSelection(){
  stopVoice();if(!selection||document.hidden)return;
  const token=voiceToken,id=selection.p.id;voiceRequest=new AbortController();speaking=true;voiceState='loading';setVolumes();audioUI();audioStatus('Preparando a leitura da Bia…');
  try{
   const data=await api({action:'speech',id},AbortSignal.any([voiceRequest.signal,AbortSignal.timeout(55000)]));
   if(token!==voiceToken||selection?.p.id!==id||document.hidden)return;
   const url=new URL(data.url);
   if(url.origin!=='https://qsdffayasuzsmngteika.supabase.co'||!url.pathname.startsWith('/storage/v1/object/sign/solaris-narration/'))throw new Error('INVALID_AUDIO');
   currentSpeech={url:url.href,id};voice.src=url.href;voiceState='playing';
   await voice.play();
   if(token!==voiceToken){voice.pause();return;}
   audioStatus('Bia está lendo as informações selecionadas.');
  }catch(error){
   if(token!==voiceToken)return;
   if(error.name==='NotAllowedError'){
    speaking=false;voiceState='ready';setVolumes();audioUI();audioStatus('Áudio pronto. Toque em Ouvir Bia para reproduzir.');
   }else{
    if(selection?.kind!=='places')await loadInventory();
    if(token===voiceToken)deviceVoice(fallbackText(),token);
   }
  }
 }
 async function setMusic(enabled){
  musicEnabled=enabled;audioUI();
  if(!enabled){music.pause();return;}
  unlockAudio();
  try{await music.play();}catch{musicEnabled=false;audioUI();audioStatus('Toque em Música ambiente para iniciar o som.');}
 }
 $('#sound-btn').onclick=()=>{soundPanel.hidden=!soundPanel.hidden;soundButton.setAttribute('aria-expanded',String(!soundPanel.hidden));};
 $('#sound-close').onclick=()=>{soundPanel.hidden=true;soundButton.setAttribute('aria-expanded','false');soundButton.focus();};
 document.addEventListener('click',e=>{if(!e.target.closest('#sound-panel,#sound-btn')){soundPanel.hidden=true;soundButton.setAttribute('aria-expanded','false');}});
 soundPanel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();$('#sound-close').click();}});
 $('#sound-start').onclick=()=>{
  if(voiceEnabled||musicEnabled){voiceEnabled=false;stopVoice();setMusic(false);audioStatus('Som desligado.');}
  else{unlockAudio();voiceEnabled=true;setMusic(true);if(selection)readSelection();else audioStatus('Bia ativada. Selecione um lote ou área para ouvir.');}
  audioUI();
 };
 $('#voice-enabled').onchange=e=>{voiceEnabled=e.target.checked;unlockAudio();if(voiceEnabled&&selection)readSelection();else{stopVoice();audioStatus(voiceEnabled?'Selecione um lote ou área para ouvir a Bia.':'Leitura automática desligada.');}audioUI();};
 $('#music-enabled').onchange=e=>setMusic(e.target.checked);
 $('#music-volume').oninput=setVolumes;$('#voice-volume').oninput=setVolumes;
 $('#read-selection').onclick=()=>{
  unlockAudio();
  if(speaking){stopVoice();audioStatus('Leitura interrompida.');return;}
  voiceEnabled=true;audioUI();
  if(voiceState==='ready'&&currentSpeech?.id===selection?.p.id){voiceState='playing';speaking=true;setVolumes();audioUI();voice.play().then(()=>audioStatus('Bia está lendo.')).catch(()=>{finished();audioStatus('Toque novamente para ouvir.');});}
  else readSelection();
 };
 $('#inventory-refresh').onclick=()=>loadInventory(true);
 $('#lot-status').onchange=renderLotList;
 const reservationDialog=$('#reservation-dialog'),reservationForm=$('#reservation-form');
 let reservationLot=null,reservationId=null,reservationPayload=null,reservationBusy=false,reservationTrigger=null;
 function closeReservation(){if(!reservationBusy){reservationDialog.close();reservationTrigger?.focus();}}
 $('#reserve-lot').onclick=()=>{
  if(!selection||selection.kind!=='lots'||selection.p.institutional)return;
  stopVoice();stopTour();reservationLot=selection.p;reservationTrigger=document.activeElement;
  reservationId=crypto.randomUUID();reservationPayload=null;reservationForm.reset();reservationForm.hidden=false;
  $('#reservation-success').hidden=true;$('#reservation-error').hidden=true;
  const area=unitFor(reservationLot.id)?.area||lotAreas[reservationLot.id];
  $('#reservation-lot').textContent=`${lotLabel(reservationLot)} · Quadra ${reservationLot.block}${area?' · '+decimal.format(area)+' m²':''}`;
  reservationDialog.showModal();$('#reservation-name').focus();
 };
 $('#reservation-close').onclick=closeReservation;$('#reservation-done').onclick=closeReservation;
 reservationDialog.addEventListener('cancel',e=>{if(reservationBusy)e.preventDefault();});
 reservationDialog.addEventListener('click',e=>{if(e.target===reservationDialog){const r=reservationDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeReservation();}});
 $('#reservation-phone').addEventListener('input',()=>$('#reservation-phone').setCustomValidity(''));
 reservationForm.addEventListener('submit',async e=>{
  e.preventDefault();if(reservationBusy||!reservationLot)return;
  let phone=$('#reservation-phone').value.replace(/\D/g,'');if(phone.length===13&&phone.startsWith('55'))phone=phone.slice(2);
  if(!/^[1-9][0-9]9\d{8}$/.test(phone)||/^(\d)\1+$/.test(phone.slice(2))){$('#reservation-phone').setCustomValidity('Informe um celular com DDD, como (34) 99999-9999.');$('#reservation-phone').reportValidity();return;}
  const name=$('#reservation-name').value.trim().replace(/\s+/g,' ');
  const key=JSON.stringify([reservationLot.id,name,phone]);
  if(reservationPayload&&reservationPayload!==key)reservationId=crypto.randomUUID();reservationPayload=key;
  reservationBusy=true;$('#reservation-submit').disabled=true;$('#reservation-submit').textContent='Enviando solicitação…';$('#reservation-close').disabled=true;$('#reservation-error').hidden=true;
  try{
   const result=await api({action:'reservation',id:reservationLot.id,name,phone,requestId:reservationId,consent:true,website:$('#reservation-website').value},AbortSignal.timeout(30000));
   if(result.status!=='requested'||!/^SOL-[A-F0-9]{10}$/.test(result.protocol))throw new Error('INVALID_RECEIPT');
   reservationForm.hidden=true;$('#reservation-success').hidden=false;$('#reservation-protocol').textContent='Protocolo '+result.protocol;$('#reservation-done').focus();
  }catch(error){
   const messages={RESERVE_LOT_UNAVAILABLE:'Este lote não está disponível para uma nova solicitação. Escolha outro lote.',RESERVE_INVALID:'Confira seu nome e o WhatsApp com DDD.',RESERVE_RATE_LIMIT:'Muitas tentativas. Aguarde um pouco antes de tentar novamente.',RESERVE_ID_CONFLICT:'Os dados deste envio foram alterados. Tente novamente.'};
   $('#reservation-error').textContent=messages[error.code]||'Não foi possível enviar agora. Seus dados foram mantidos; tente novamente.';$('#reservation-error').hidden=false;
   if(error.code==='RESERVE_ID_CONFLICT')reservationId=crypto.randomUUID();
   if(error.code==='RESERVE_LOT_UNAVAILABLE')loadInventory(true);
  }finally{reservationBusy=false;$('#reservation-submit').disabled=false;$('#reservation-submit').innerHTML='Solicitar reserva '+icon('arrow');$('#reservation-close').disabled=false;}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopVoice();music.pause();}else{loadInventory(true);if(musicEnabled)setMusic(true);}});
 window.addEventListener('online',()=>loadInventory(true));
 window.addEventListener('offline',()=>{failed=true;units.clear();loaded=0;stopVoice();renderLotList();paint();renderCommerce();});
 window.SolarisExperience={
  paint,statusFor,
  show(p,kind){selection={p,kind};renderCommerce();paint();audioUI();},
  select(p,kind){stopVoice();tourWaitStarted=0;selection={p,kind};renderCommerce();paint();audioUI();loadInventory().then(()=>{if(voiceEnabled&&selection?.p.id===p.id)readSelection();});},
  close(){selection=null;stopVoice();audioUI();},
  pause(){stopVoice();},
  // Give the spoken description time to finish before the guided tour advances.
  holdTour(){if(!speaking){tourWaitStarted=0;return false;}if(!tourWaitStarted)tourWaitStarted=performance.now();return performance.now()-tourWaitStarted<70000;}
 };
 setVolumes();audioUI();paint();
 if(active){const p=lots.find(p=>p.id===active)||blocks.find(p=>p.id===active)||places.find(p=>p.id===active);if(p)window.SolarisExperience.show(p,tab);}
 loadInventory(true);setInterval(()=>{if(!document.hidden)loadInventory(true);},60000);
})();
