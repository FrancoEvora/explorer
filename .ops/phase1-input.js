/* Native touch activation for mission buttons. Click remains the keyboard/mouse path. */
(()=>{'use strict';
const dialog=document.getElementById('missionDialog');
if(!dialog)return;
const nativeTouch='ontouchstart' in window;
let press=null,blocked=null,forwarding=false,touchActivations=0,suppressedClicks=0;
const buttonAt=target=>target instanceof Element?target.closest('button'):null;
const usable=b=>b&&dialog.contains(b)&&!b.disabled&&dialog.open&&!b.closest('[inert]');
function begin(e){
 if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
 if(e.isPrimary===false){press=null;return;}
 const b=buttonAt(e.target);
 press=usable(b)?{b,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}:null;
 blocked=null;
}
function move(e){if(press&&e.pointerId===press.id&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>12)press.moved=true;}
function end(e){
 if(!press||e.pointerId!==press.id)return;
 const p=press;press=null;
 if(p.moved||!usable(p.b)||buttonAt(document.elementFromPoint(e.clientX,e.clientY))!==p.b)return;
 // Handle the release directly. Some mobile paths never deliver a compatibility click.
 if(e.cancelable)e.preventDefault();
 blocked={b:p.b,at:performance.now(),x:e.clientX,y:e.clientY};
 forwarding=true;
 try{touchActivations++;p.b.click();}finally{forwarding=false;}
}
function cancel(e){if(press&&e.pointerId===press.id)press=null;}
// Use one touch path, never parallel touch + pointer handlers for the same finger.
for(const [name,fn]of [['pointerdown',begin],['pointermove',move],['pointerup',end],['pointercancel',cancel]])dialog.addEventListener(name,e=>{if(!(nativeTouch&&e.pointerType==='touch'))fn(e);},true);
if(nativeTouch){
 const normalized=(e,t)=>({target:e.target,pointerType:'touch',pointerId:t.identifier,isPrimary:true,clientX:t.clientX,clientY:t.clientY,cancelable:e.cancelable,preventDefault:()=>e.preventDefault()});
 dialog.addEventListener('touchstart',e=>{if(e.touches.length!==1){press=null;return;}begin(normalized(e,e.touches[0]));},{capture:true,passive:true});
 dialog.addEventListener('touchmove',e=>{for(const t of e.changedTouches)move(normalized(e,t));},{capture:true,passive:true});
 dialog.addEventListener('touchend',e=>{for(const t of e.changedTouches)end(normalized(e,t));},{capture:true,passive:false});
 dialog.addEventListener('touchcancel',e=>{for(const t of e.changedTouches)cancel(normalized(e,t));},{capture:true,passive:true});
}
document.addEventListener('pointerdown',()=>{blocked=null;},true);
document.addEventListener('click',e=>{
 const b=buttonAt(e.target);
 // Keep assistive-technology/keyboard clicks (detail=0). Suppress only the native duplicate.
 if(!forwarding&&e.detail>0&&blocked&&performance.now()-blocked.at<900&&(blocked.b===b||Math.hypot(e.clientX-blocked.x,e.clientY-blocked.y)<20)){
  e.preventDefault();e.stopImmediatePropagation();suppressedClicks++;
 }
},true);
// Keep click suppression through a modal transition until the next deliberate press.
dialog.addEventListener('close',()=>{press=null;});
window.addEventListener('blur',()=>{press=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)press=null;});
window.SolarisInput=Object.freeze({snapshot:()=>({touchActivations,suppressedClicks,path:nativeTouch?'touchend':'pointerup'})});
})();
