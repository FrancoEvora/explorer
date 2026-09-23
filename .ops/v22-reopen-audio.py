from pathlib import Path
p=Path('site/conquista/audio.js');s=p.read_text()
a="ctx.suspend().catch(()=>{});";assert s.count(a)==2
s=s.replace(a,"ctx.close().catch(()=>{});")
a="if(ctx&&ctx.state!=='closed')return true;const C="
b="if(ctx&&ctx.state==='running')return true;if(ctx&&ctx.state!=='closed'){try{ctx.close().catch(()=>{});}catch{}}const C="
assert a in s
p.write_text(s.replace(a,b))
r=Path('site/conquista/README.md');s=r.read_text();s+='\nFor reliable mobile reactivation, mute and background release the audio context. The next deliberate user gesture recreates it and restarts the score with the same volume preferences. Existing game progress is independent of audio lifecycle.\n';r.write_text(s)
p=Path('tests/solaris-v22.cjs');s=p.read_text().replace("state==='suspended'","state==='closed'").replace(".state,'suspended'",".state,'closed'")
s=s.replace("musicTrack.active);checkpoint('pagehide-music-active')", "musicTrack?.active&&SolarisSound.snapshot(false).musicTrack?.ready);checkpoint('pagehide-music-active')")
a="if(await p.evaluate(()=>navigator.maxTouchPoints>0))await p.touchscreen.tap(point.x,point.y);else await p.mouse.click(point.x,point.y);"
b="const action=(await p.evaluate(()=>navigator.maxTouchPoints>0))?p.touchscreen.tap(point.x,point.y):p.mouse.click(point.x,point.y);let timeout;try{await Promise.race([action,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Native audio input did not return')),6000);})]);}finally{clearTimeout(timeout);}"
assert a in s
p.write_text(s.replace(a,b))
p=Path('tests/solaris-map-audio.cjs');s=p.read_text().replace("state==='suspended'","state==='closed'").replace(".state,'suspended'",".state,'closed'")
p.write_text(s)
print('Mute/background now release the device; next user gesture creates a fresh context. Same mute, music and waveform checks retained.')
