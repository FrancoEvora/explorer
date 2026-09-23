from pathlib import Path
p=Path('site/conquista/conquista.js')
s=p.read_text()
a='cooldown=true;timer=setTimeout(()=>{cooldown=false;shoot.disabled=false;},450);shoot.disabled=true;if(Math.abs(value-.5)<(slow?.18:.1))'
b='const aim=tapValue===null?value:tapValue;tapValue=null;cooldown=true;timer=setTimeout(()=>{cooldown=false;shoot.disabled=false;},450);shoot.disabled=true;if(Math.abs(aim-.5)<(slow?.18:.1))'
assert s.count(a)==1
s=s.replace(a,b)
a=",'primary','shoot');function tick(t)"
b=",'primary','shoot');let tapValue=null;shoot.addEventListener('pointerdown',()=>{tapValue=value;});shoot.addEventListener('pointercancel',()=>{tapValue=null;});function tick(t)"
assert s.count(a)==1
p.write_text(s.replace(a,b))
p=Path('tests/solaris-conquista.cjs');s=p.read_text()
a="else if(type==='precision'){for(let k=0;k<18;k++)"
b="else if(type==='precision'){const touch=await p.evaluate(()=>navigator.maxTouchPoints>0);const target=await p.locator('#shoot').boundingBox();assert(target&&target.width>0&&target.height>0,'Precision input must be visible');const point={x:target.x+target.width/2,y:target.y+target.height/2};assert(await p.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('#shoot')!=null,point),'Precision target is hit-testable');await p.mouse.move(point.x,point.y);for(let k=0;k<18;k++)"
assert s.count(a)==1;s=s.replace(a,b)
a="},null,{timeout:12000});await p.click('#shoot');await p.waitForTimeout(470);"
b="},null,{timeout:12000});if(touch)await p.touchscreen.tap(point.x,point.y);else await p.mouse.click(point.x,point.y);await p.waitForTimeout(470);"
assert s.count(a)==1
p.write_text(s.replace(a,b))
print('Precision samples on pointerdown; QA uses a real, hit-tested native tap without extra frame waits.')
p=Path('site/conquista/audio.js');s=p.read_text()
a="document.addEventListener('click',()=>{if(activated&&settings.enabled&&ctx&&ctx.state!=='running'&&!document.hidden)activate(true);},true);"
b="document.addEventListener('click',e=>{if(e.target.closest?.('#soundToggle,#testSound,#soundEnabled'))return;if(activated&&settings.enabled&&ctx&&ctx.state!=='running'&&!document.hidden)activate(true);},true);"
assert s.count(a)==1
p.write_text(s.replace(a,b))
print('Explicit sound controls own their gesture; automatic recovery cannot toggle them off in WebKit.')
