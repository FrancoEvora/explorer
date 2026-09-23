from pathlib import Path
p=Path('site/conquista/audio.js');s=p.read_text()
a="ctx.suspend().catch(()=>{});";assert s.count(a)==2
s=s.replace(a,"ctx.close().catch(()=>{});")
a="if(ctx&&ctx.state!=='closed')return true;const C="
b="if(ctx&&ctx.state==='running')return true;if(ctx&&ctx.state!=='closed'){try{ctx.close().catch(()=>{});}catch{}}const C="
assert a in s
s=s.replace(a,b)
a='try{ctx=new C({latencyHint:';b='try{voices.clear();ctx=new C({latencyHint:'
assert a in s
p.write_text(s.replace(a,b))
r=Path('site/conquista/README.md');s=r.read_text();s+='\nFor reliable mobile reactivation, mute and background release the audio context. The next deliberate user gesture recreates it and restarts the score with the same volume preferences. Existing game progress is independent of audio lifecycle. Achievement notices do not block travel or phase controls and close when the player starts a new action.\n';r.write_text(s)
p=Path('tests/solaris-v22.cjs');s=p.read_text().replace("state==='suspended'","state==='closed'").replace(".state,'suspended'",".state,'closed'")
s=s.replace("musicTrack.active);checkpoint('pagehide-music-active')", "musicTrack?.active&&SolarisSound.snapshot(false).musicTrack?.ready);checkpoint('pagehide-music-active')")
a="if(await p.evaluate(()=>navigator.maxTouchPoints>0))await p.touchscreen.tap(point.x,point.y);else await p.mouse.click(point.x,point.y);"
b="const action=(await p.evaluate(()=>navigator.maxTouchPoints>0))?p.touchscreen.tap(point.x,point.y):p.mouse.click(point.x,point.y);let timeout;try{await Promise.race([action,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Native audio input did not return')),6000);})]);}finally{clearTimeout(timeout);}"
assert a in s
p.write_text(s.replace(a,b))
p=Path('tests/solaris-map-audio.cjs');s=p.read_text().replace("state==='suspended'","state==='closed'").replace(".state,'suspended'",".state,'closed'")
p.write_text(s)
p=Path('site/conquista/conquista.js');s=p.read_text()
for old,new in [
    ("function showDialog(id){sound?.setWalking(false);", "function showDialog(id){$('visitToast').hidden=true;sound?.setWalking(false);"),
    ("return;currentView=view;sound?.setWalking", "return;$('visitToast').hidden=true;currentView=view;sound?.setWalking"),
    ("function goTo(area,lid=null){if(!ready||!regions[area])return;", "function goTo(area,lid=null){if(!ready||!regions[area])return;$('visitToast').hidden=true;")
]:
    assert s.count(old)==1,old
    s=s.replace(old,new)
p.write_text(s)
p=Path('site/conquista/conquista.css');s=p.read_text();s+='\n/* Arrival cards must never intercept the travel/phase action underneath. */\n.visit-toast{top:calc(112px + env(safe-area-inset-top,0px));bottom:auto;pointer-events:none}.visit-toast button{pointer-events:auto}\n@media(max-height:500px){.visit-toast{top:calc(105px + env(safe-area-inset-top,0px));padding:10px 42px 8px 14px}.visit-toast h3{font-size:16px;margin:3px 0}.visit-toast p{font-size:11px}.visit-toast .textbutton{font-size:11px}}\n';p.write_text(s)
print('Audio lifecycle retained. Achievement notices no longer obstruct map actions, dialogs or stage changes.')
