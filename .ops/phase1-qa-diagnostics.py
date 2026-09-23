from pathlib import Path
p=Path('tests/solaris-touch-phase1.cjs');s=p.read_text()
a=" await rejectedGestures(p);"
b=""" await p.evaluate(()=>{window.__inputTrace=[];for(const type of ['pointerdown','pointerup','pointercancel','touchstart','touchend','touchcancel','click'])document.addEventListener(type,e=>{if(window.__inputTrace.length>100)window.__inputTrace.shift();window.__inputTrace.push({type,target:e.target.closest?.('button')?.outerHTML.slice(0,180),trusted:e.isTrusted,detail:e.detail,pointerType:e.pointerType,isPrimary:e.isPrimary,touches:e.touches?.length,defaultPrevented:e.defaultPrevented});},true);});
 await rejectedGestures(p);
 await p.locator('[data-route="leaf"]').evaluate(el=>{if(!('ontouchstart' in window))return;const r=el.getBoundingClientRect(),t={identifier:99,clientX:r.x+r.width/2,clientY:r.y+r.height/2};const fire=(type,point=t)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,{touches:type==='touchend'||type==='touchcancel'?[]:[point],changedTouches:[point]});el.dispatchEvent(e);};fire('touchstart');fire('touchcancel');fire('touchend');fire('touchstart');fire('touchmove',{...t,clientX:t.clientX+24});fire('touchend');});
 assert.equal(await p.locator('#missionBoard').getAttribute('data-route-progress'),'0','Cancelled/dragged touches cannot select');"""
assert s.count(a)==1;s=s.replace(a,b)
a="JSON.stringify({device:s.name,error:e.stack,errors},null,2)"
b="JSON.stringify({device:s.name,error:e.stack,errors,input:await p.evaluate(()=>SolarisInput.snapshot()),trace:await p.evaluate(()=>window.__inputTrace)},null,2)"
assert a in s;s=s.replace(a,b)
p.write_text(s)
