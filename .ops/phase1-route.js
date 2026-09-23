function buildRoute(l){
 const order=['leaf','flower','heart','water'],board=$('missionBoard');
 let cursor=0,errors=0,lastError=null;
 $('missionInstruction').textContent='Toque nos cartões de baixo na ordem indicada: Folha → Flor → Coração → Água.';
 board.innerHTML='<div class="route-guide"><span class="eyebrow">SIGA ESTA ORDEM</span><ol class="route-steps">'+order.map((g,i)=>`<li data-step="${g}"><span class="route-step-no">${i+1}</span>${svg(g)}<b>${NAMES[g]}</b><small class="route-step-state">${i===0?'AGORA':'A SEGUIR'}</small></li>`).join('')+'</ol></div><p id="routePrompt" class="route-prompt" aria-live="polite"></p><div class="route-options" role="group" aria-label="Toque nos cartões para montar a sequência">'+shuffle(['leaf','water','sun','flower','bird','heart'],l.id*21).map(g=>`<button type="button" data-route="${g}" aria-label="Selecionar ${NAMES[g]}" aria-pressed="false">${svg(g)}<span>${NAMES[g]}</span><small class="route-card-state" aria-hidden="true">TOCAR</small></button>`).join('')+'</div>';
 const buttons=[...board.querySelectorAll('[data-route]')];
 const done=action('Guardar meu roteiro',()=>{
  if(cursor!==order.length){refresh();return;}
  finishEngine(errors===0?3:errors<=2?2:1,`Roteiro completo com ${errors} ${errors===1?'erro':'erros'}.`);
 });
 done.type='button';
 done.setAttribute('aria-describedby','routePrompt');
 function refresh(){
  const complete=cursor===order.length;
  status(`${cursor}/4 destinos conectados · ${errors} ${errors===1?'erro':'erros'}`);
  board.querySelectorAll('[data-step]').forEach((el,i)=>{
   el.classList.toggle('done',i<cursor);el.classList.toggle('current',i===cursor);
   el.setAttribute('aria-current',i===cursor?'step':'false');
   el.querySelector('.route-step-state').textContent=i<cursor?'✓ FEITO':i===cursor?'AGORA':'A SEGUIR';
  });
  for(const b of buttons){
   const selected=order.slice(0,cursor).includes(b.dataset.route);
   b.classList.toggle('chosen',selected);b.classList.toggle('route-wrong',b.dataset.route===lastError);
   b.setAttribute('aria-pressed',String(selected));
   b.querySelector('.route-card-state').textContent=selected?'✓ ESCOLHIDO':'TOCAR';
   b.style.opacity=session.hints&&!complete&&!selected&&b.dataset.route!==order[cursor]?'.6':'1';
  }
  const prompt=$('routePrompt');
  prompt.textContent=complete?'Sequência completa! Toque em “Guardar meu roteiro” para conquistar suas estrelas.':(lastError?'Ainda não. ':'')+`Passo ${cursor+1} de 4: toque em ${NAMES[order[cursor]]}.`;
  prompt.classList.toggle('complete',complete);
  done.disabled=!complete;
  board.dataset.routeProgress=String(cursor);board.dataset.routeErrors=String(errors);
 }
 for(const b of buttons)b.onclick=()=>{
  if(cursor>=order.length||order.slice(0,cursor).includes(b.dataset.route))return;
  const correct=b.dataset.route===order[cursor];
  if(correct){cursor++;lastError=null;}else{errors++;lastError=b.dataset.route;}
  // Progress must be committed visually even if audio is interrupted/unavailable.
  refresh();playCue(correct?'correct':'error');
 };
 hintEngine=()=>{lastError=null;refresh();status('O próximo cartão está indicado no passo atual. Assistência: até 2 estrelas.');};
 cleanupEngine=()=>{for(const b of buttons)b.onclick=null;delete board.dataset.routeProgress;delete board.dataset.routeErrors;};
 refresh();
}
