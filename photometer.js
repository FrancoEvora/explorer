(function exposureMeterModule(){
 'use strict';
 if(window.ExplorerPhotometer)return;
 const state={stream:null,timer:null,ev:13,iso:400,aperture:5.6,shutter:'1/1000',mode:'spot',spotX:.5,spotY:.5,lum:null,calibration:null,locked:false,lockValue:null,frame:0,message:'Use o EV de referência ou ative a câmera para acompanhar variações de luz.'};
 const $=id=>document.getElementById(id);
 const log2=v=>Math.log(v)/Math.LN2;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const fmt=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1,minimumFractionDigits:1});
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function shutterToSeconds(str){
  const s=String(str).split('/');if(s.length===2)return Number(s[0])/Number(s[1]);return Number(str);
 }
 function readableShutter(sec){
  if(!Number.isFinite(sec)||sec<=0)return'—';
  const cameraSpeeds=[1/32000,1/16000,1/8000,1/6400,1/5000,1/4000,1/3200,1/2500,1/2000,1/1600,1/1250,1/1000,1/800,1/640,1/500,1/400,1/320,1/250,1/200,1/160,1/125,1/100,1/80,1/60,1/50,1/40,1/30,1/25,1/20,1/15,1/13,1/10,1/8,1/6,1/5,1/4,1/3,1/2,1,1.3,1.6,2,2.5,3.2,4,5,6,8,10,13,15,20,25,30];
  const best=cameraSpeeds.reduce((a,b)=>Math.abs(log2(b/sec))<Math.abs(log2(a/sec))?b:a,cameraSpeeds[0]);
  return best>=1?(String(best).replace('.',',')+' s'):'1/'+Math.round(1/best)+' s';
 }
 function exposureEV(aperture,shutterSeconds,iso){return log2(aperture*aperture/shutterSeconds*100/iso)}
 function exposureTime(ev,aperture,iso){return aperture*aperture*100/(iso*Math.pow(2,ev))}
 function currentEV(){
  if(state.locked&&Number.isFinite(state.lockValue))return state.lockValue;
  if(state.calibration&&Number.isFinite(state.lum)){
   const ratio=(Math.max(state.lum,.001)/Math.max(state.calibration.lum,.001));
   return clamp(state.calibration.ev+log2(ratio),0,22);
  }
  return state.ev;
 }
 function metricKind(){
  if(state.locked&&state.lockValue!==null)return 'LEITURA TRAVADA';
  return state.calibration&&state.lum!==null?'EV ESTIMADO · CÂMERA CALIBRADA':'EV DE REFERÊNCIA · MANUAL';
 }
 function exposures(){
  const ev=currentEV(),secs=exposureTime(ev,state.aperture,state.iso);
  const chosenEV=exposureEV(state.aperture,shutterToSeconds(state.shutter),state.iso);
  const stops=chosenEV-ev;
  let comparison=Math.abs(stops)<.2?'Sua configuração está próxima da referência.':stops>0?'Sua velocidade selecionada deixa a imagem cerca de '+fmt(stops)+' stop(s) mais escura que a referência.':'Sua velocidade selecionada deixa a imagem cerca de '+fmt(-stops)+' stop(s) mais clara que a referência.';
  const result=$('pm-result');
  if(result)result.innerHTML=`<div class="pm-results"><div><span class="pm-overline">${metricKind()}</span><strong>${fmt(ev)} <small>EV100</small></strong></div><div><span class="pm-overline">TEMPO RECOMENDADO</span><strong>≈ ${readableShutter(secs)}</strong></div></div><div class="pm-rail"><span class="pm-needle" style="left:${clamp(ev/20*100,0,100)}%"></span></div><div class="pm-scale"><span>0 EV</span><span>10 EV</span><span>20 EV</span></div><p class="ps-small">${esc(comparison)}</p><p class="ps-small">f/${state.aperture} · ISO ${state.iso} · velocidade escolhida ${esc(state.shutter)} s</p>`;
  const photolevel=$('pm-light-label');if(photolevel)photolevel.textContent=state.lum!==null?'Brilho relativo da cena: '+Math.round(state.lum*100)+'%':'Brilho relativo: câmera desligada';
  const status=$('pm-status');if(status)status.textContent=state.message;
  const buttons=$('pm-calibrate');if(buttons)buttons.disabled=!(state.stream&&state.lum!==null);
  const lock=$('pm-lock');if(lock){lock.disabled=!state.calibration;lock.textContent=state.locked?'Destravar leitura':'Travar leitura'}
  const evLabel=$('pm-ev-label');if(evLabel)evLabel.textContent=fmt(state.ev)+' EV';
  const start=$('pm-start');if(start)start.textContent=state.stream?'Parar câmera':'Iniciar câmera';
 }
 function render(){
  return `<section class="ps-card pm-card">
    <div class="pm-title"><div><span class="ps-eyebrow">EXPLORER / FOTOMETRIA</span><h2>Fotômetro de campo</h2><p class="ps-muted">Leitura pontual ou matricial na câmera e exposição calculada para sua lente.</p></div><span class="pm-chip">EV100</span></div>
    <div class="pm-layout">
      <div class="pm-camera">
        <video id="pm-video" autoplay muted playsinline aria-label="Visualização da câmera para leitura de luminosidade"></video>
        <div class="pm-reticle" id="pm-reticle" style="left:${state.spotX*100}%;top:${state.spotY*100}%"><span></span></div>
        <div class="pm-video-label">PRÉVIA LOCAL · TOQUE PARA MEDIÇÃO PONTUAL</div>
        <div class="pm-placeholder" id="pm-placeholder"><span>◉</span><strong>Câmera desligada</strong><small>O Explorer não grava nem envia imagens deste fotômetro.</small></div>
      </div>
      <div class="pm-settings">
        <label class="ps-field">Modo de leitura<select id="pm-mode"><option value="spot" ${state.mode==='spot'?'selected':''}>Pontual · região escolhida</option><option value="matrix" ${state.mode==='matrix'?'selected':''}>Matricial · quadro inteiro</option></select></label>
        <label class="ps-field">Condição luminosa de referência<select id="pm-preset">
          <option value="15" ${state.ev===15?'selected':''}>Sol pleno · EV 15</option>
          <option value="13" ${state.ev===13?'selected':''}>Sol suave / sombra aberta · EV 13</option>
          <option value="11" ${state.ev===11?'selected':''}>Nublado · EV 11</option>
          <option value="9" ${state.ev===9?'selected':''}>Fim de tarde · EV 9</option>
          <option value="7" ${state.ev===7?'selected':''}>Mata fechada · EV 7</option>
          <option value="manual">Ajuste manual</option>
        </select></label>
        <label class="ps-field">EV de referência <span class="pm-inline-value" id="pm-ev-label">${fmt(state.ev)} EV</span><input id="pm-ev" type="range" min="0" max="20" value="${state.ev}" step=".5"></label>
        <div class="pm-actions"><button type="button" class="ps-btn primary" id="pm-start" data-meter="start">Iniciar câmera</button><button type="button" class="ps-btn" id="pm-calibrate" data-meter="calibrate" disabled>Calibrar</button><button type="button" class="ps-btn" id="pm-lock" data-meter="lock" disabled>Travar leitura</button></div>
        <div class="pm-hint" id="pm-light-label">Brilho relativo: câmera desligada</div>
      </div>
    </div>
    <div class="pm-result" id="pm-result" aria-live="polite"></div>
    <p class="pm-status" id="pm-status" role="status">${esc(state.message)}</p>
  </section>
  <div class="ps-grid">
    <section class="ps-card"><h2>Triângulo de exposição</h2><div class="ps-fields">
      <label class="ps-field">Abertura<select id="pm-aperture">${[1.2,1.4,1.8,2,2.8,4,5.6,8,11,16,22].map(x=>`<option value="${x}" ${x===state.aperture?'selected':''}>f/${x}</option>`).join('')}</select></label>
      <label class="ps-field">ISO<select id="pm-iso">${[50,100,200,400,800,1600,3200,6400,12800].map(x=>`<option value="${x}" ${x===state.iso?'selected':''}>ISO ${x}</option>`).join('')}</select></label>
      <label class="ps-field">Sua velocidade<select id="pm-shutter">${['1/8000','1/4000','1/3200','1/2500','1/2000','1/1600','1/1250','1/1000','1/800','1/640','1/500','1/400','1/250','1/160','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1','2','4','8','15','30'].map(x=>`<option value="${x}" ${x===state.shutter?'selected':''}>${x} s</option>`).join('')}</select></label>
    </div><div class="pm-actions" style="margin-top:15px"><button type="button" class="ps-btn" data-meter="copy">Copiar configuração</button><button type="button" class="ps-btn" data-meter="reset">Limpar calibração</button></div></section>
    <section class="ps-card"><h2>Como usar no campo</h2><p class="ps-muted">1. Escolha a condição de luz ou informe um EV de referência, medido com um fotômetro confiável.</p><p class="ps-muted">2. Inicie a câmera e enquadre uma superfície ou cena. Toque no ponto que deseja acompanhar.</p><p class="ps-muted">3. Toque em <b>Calibrar</b>. O Explorer acompanhará variações relativas de brilho e calculará a velocidade para abertura e ISO escolhidos.</p><div class="ps-info"><b>Atenção à precisão:</b> navegadores normalmente não disponibilizam os dados completos de exposição da câmera; o ajuste automático de exposição pode alterar a leitura. Este é um fotômetro assistido para referência, não um medidor calibrado de lux ou luz incidente. No iPhone, a câmera exige permissão.</div></section>
  </div>`;
 }
 function mount(){
  const container=$('explorer-photo-body');if(!container)return;
  if(!container.dataset.meterDelegated){
   container.dataset.meterDelegated='true';
   container.addEventListener('click',async e=>{
    const control=e.target.closest('button[data-meter]');if(control){const action=control.dataset.meter;
     if(action==='start'){if(state.stream)stop();else await start();return}
     if(action==='calibrate'){if(state.lum===null)return;state.calibration={ev:state.ev,lum:state.lum};state.locked=false;state.lockValue=null;state.message='Leitura calibrada na cena atual. Variações são relativas e sujeitas ao ajuste automático da câmera.';exposures();return}
     if(action==='lock'){if(!state.calibration)return;state.locked=!state.locked;state.lockValue=state.locked?currentEV():null;state.message=state.locked?'Exposição travada: a leitura não muda enquanto a câmera aponta para outra região.':'Leitura destravada.';exposures();return}
     if(action==='reset'){state.calibration=null;state.locked=false;state.lockValue=null;state.message='Calibração apagada. O EV é apenas o valor manual de referência.';exposures();return}
     if(action==='copy'){const exposure=readableShutter(exposureTime(currentEV(),state.aperture,state.iso)),value='Explorer · '+fmt(currentEV())+' EV100 · f/'+state.aperture+' · ISO '+state.iso+' · aproximadamente '+exposure;
      try{await navigator.clipboard.writeText(value);state.message='Configurações copiadas.'}catch{state.message=value}exposures();return}
    }
    const video=e.target.closest('#pm-video');if(video&&state.mode==='spot'){
      const rect=video.getBoundingClientRect();if(!rect.width||!rect.height)return;
      state.spotX=clamp((e.clientX-rect.left)/rect.width,0,1);state.spotY=clamp((e.clientY-rect.top)/rect.height,0,1);
      const cursor=$('pm-reticle');if(cursor){cursor.style.left=(state.spotX*100)+'%';cursor.style.top=(state.spotY*100)+'%'}
      state.message='Ponto de leitura alterado. Recalibre se quiser usar uma nova referência.';exposures();
    }
   });
   container.addEventListener('input',e=>{
     if(e.target.id==='pm-ev'){state.ev=Number(e.target.value);state.calibration=null;state.locked=false;state.lockValue=null;const preset=$('pm-preset');if(preset)preset.value='manual';state.message='EV manual alterado; calibre novamente para medições relativas.';exposures()}
   });
   container.addEventListener('change',e=>{
     const id=e.target.id,val=e.target.value;
     if(id==='pm-mode'){state.mode=val;state.calibration=null;state.locked=false;state.lockValue=null;state.message='Modo de medição alterado. Calibre novamente.'}
     if(id==='pm-preset'&&val!=='manual'){state.ev=Number(val);const s=$('pm-ev');if(s)s.value=val;state.calibration=null;state.locked=false;state.lockValue=null;state.message='Referência atualizada. Calibre a câmera novamente.'}
     if(id==='pm-aperture')state.aperture=Number(val);
     if(id==='pm-iso')state.iso=Number(val);
     if(id==='pm-shutter')state.shutter=val;
     exposures();
   });
   document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
   window.addEventListener('pagehide',stop);
  }
  exposures();
 }
 async function start(){
  if(state.stream)return;
  if(!navigator.mediaDevices?.getUserMedia){state.message='Câmera não disponível neste navegador ou conexão insegura.';exposures();return}
  state.message='Solicitando permissão de acesso à câmera…';exposures();
  try{
   const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:640},height:{ideal:480}},audio:false});
   const v=$('pm-video');if(!v){stream.getTracks().forEach(t=>t.stop());return}
   state.stream=stream;v.srcObject=stream;v.setAttribute('playsinline','');v.muted=true;await v.play();
   const placeholder=$('pm-placeholder');if(placeholder)placeholder.hidden=true;
   state.message='Câmera ativa · nenhum quadro é gravado nem enviado. Selecione um EV de referência e calibre para acompanhar variações.';
   state.lum=null;state.calibration=null;state.locked=false;state.lockValue=null;
   state.timer=setInterval(sample,600);
   sample();exposures();
  }catch(error){stop();state.message=error?.name==='NotAllowedError'?'Permissão negada. Autorize a câmera no navegador.':'Não foi possível iniciar a câmera: '+String(error?.message||error);exposures()}
 }
 function sample(){
  const video=$('pm-video');
  if(!state.stream||!video||video.readyState<2)return;
  try{
   const canvas=document.createElement('canvas');canvas.width=88;canvas.height=66;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0,88,66);
   const data=ctx.getImageData(0,0,88,66).data;
   let sum=0,count=0;
   const xx=state.spotX*88,yy=state.spotY*66;
   for(let y=0;y<66;y++)for(let x=0;x<88;x++){
    if(state.mode==='spot'&&Math.hypot(x-xx,y-yy)>10)continue;
    const i=(y*88+x)*4;
    // sRGB weighted luminance, 0..1. Relative indication, not calibrated lux.
    sum+=(0.2126*data[i]+0.7152*data[i+1]+0.0722*data[i+2])/255;
    count++;
   }
   state.lum=count?sum/count:0;
   if(!state.locked)exposures();
   else{const l=$('pm-light-label');if(l)l.textContent='Brilho relativo: '+Math.round(state.lum*100)+'% · EV travado'}
   state.frame++;
  }catch{state.message='Falha ao ler a imagem da câmera. Desative bloqueadores de câmera.';exposures()}
 }
 function stop(){
  if(state.timer){clearInterval(state.timer);state.timer=null}
  if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null}
  const v=$('pm-video');if(v){v.pause();v.srcObject=null}
  const ph=$('pm-placeholder');if(ph)ph.hidden=false;
  state.lum=null;state.calibration=null;state.locked=false;state.lockValue=null;
  state.message='Câmera desligada. O cálculo de exposição continua disponível usando EV manual.';
  exposures();
 }
 window.ExplorerPhotometer={render,mount,stop,math:{exposureEV,exposureTime,shutterToSeconds,readableShutter}};
})();