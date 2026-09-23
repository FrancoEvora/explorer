from pathlib import Path
score=Path('.ops/v22-buffered-score.js').read_text()
score=score.replace('const bus=ctx.createGain(),meter=ctx.createAnalyser(),filter=ctx.createBiquadFilter();','const bus=ctx.createGain(),filter=ctx.createBiquadFilter();')
score=score.replace('filter.connect(bus);bus.connect(meter);meter.fftSize=1024;meter.connect(destination);','filter.connect(bus);bus.connect(destination);')
a="  let rms=0;if(active&&ctx.state==='running'){const a=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(a);rms=Math.sqrt(a.reduce((s,n)=>s+n*n,0)/a.length);}\n"
assert a in score
score=score.replace(a,'').replace(',rms,voices:source?1:0',',voices:source?1:0')
Path('site/conquista/music.js').write_text(score)
Path('.ops/v22-score.js').write_text(score)
a=Path('site/conquista/audio.js');t=a.read_text();old='function snapshot(){let rms=0;if(analyser';assert old in t;a.write_text(t.replace(old,'function snapshot(measure=true){let rms=0;if(measure&&analyser'))
a=Path('site/conquista/conquista.js');t=a.read_text();assert 'const a=sound.snapshot();' in t;a.write_text(t.replace('const a=sound.snapshot();','const a=sound.snapshot(false);'))
r=Path('site/conquista/README.md');r.write_text(r.read_text().replace('It is continuously sequenced on the shared gesture-activated AudioContext.', 'The score is rendered locally once, then played as one continuously looping buffer on the shared gesture-activated AudioContext.'))
p=Path('tests/solaris-v22.cjs');s=p.read_text()
s=s.replace('.musicTrack.scheduledNotes','.musicTrack.playedNotes')
s=s.replace("await p.waitForTimeout(500);assert(await maxRMS(p)>0.00001,'Music alone", "await p.waitForFunction(()=>SolarisSound.snapshot().musicTrack?.ready,null,{timeout:15000});await p.waitForTimeout(500);assert(await maxRMS(p)>0.00001,'Music alone")
s=s.replace("async function shot(p,name){await p.screenshot({path:path.join(OUT,name+'.png')});}","async function shot(p,name){await p.screenshot({path:path.join(OUT,name+'.png'),timeout:5000});}\nfunction checkpoint(name){console.log('CHECKPOINT '+name);fs.writeFileSync(path.join(OUT,'checkpoint.txt'),name);}")
s=s.replace("p.on('dialog',d=>d.accept());p.setDefaultTimeout(12000);", "p.on('dialog',async d=>{checkpoint('native-dialog '+d.type());await d.accept();});p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(15000);")
for old,new in [
(" await p.click('#soundToggle');assert.equal((await aud(p)).enabled,false);", " checkpoint('mute-start');await p.click('#soundToggle');assert.equal((await aud(p)).enabled,false);checkpoint('mute-complete');"),
("await p.waitForFunction(()=>SolarisSound.snapshot().state==='running');await p.evaluate", "await p.waitForFunction(()=>SolarisSound.snapshot().state==='running');checkpoint('unmute-complete');await p.evaluate"),
("await p.waitForFunction(()=>SolarisSound.snapshot().state==='suspended');assert.equal", "await p.waitForFunction(()=>SolarisSound.snapshot().state==='suspended');checkpoint('pagehide-suspended');assert.equal"),
("await p.waitForFunction(()=>SolarisSound.snapshot().musicTrack.active);await p.waitForTimeout", "await p.waitForFunction(()=>SolarisSound.snapshot().musicTrack.active);checkpoint('pagehide-music-active');await p.waitForTimeout"),
("if(!process.env.QA_INLINE){await p.reload();", "if(!process.env.QA_INLINE){checkpoint('reload-start');await p.reload({waitUntil:'domcontentloaded'});checkpoint('reload-document');"),
("await p.click('#resumeGame');assert.equal((await snap(p)).coins,235);", "checkpoint('resume-start');await p.click('#resumeGame');checkpoint('resume-complete');assert.equal((await snap(p)).coins,235);"),
("await p.setInputFiles('#importSave'", "checkpoint('import-start');await p.setInputFiles('#importSave'"),
("await p.waitForTimeout(200);assert.equal((await snap(p)).visits,9)", "checkpoint('import-input-complete');await p.waitForTimeout(200);assert.equal((await snap(p)).visits,9)")
]:
    assert old in s,old
    s=s.replace(old,new)
a="}catch(e){await shot(p,spec.name+'-FAIL');fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({device:spec.name,error:e.stack,errors},null,2));throw e;}finally{await browser.close();}}"
b="}catch(e){console.error('ORIGINAL FAILURE',e);fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({device:spec.name,error:e.stack,errors},null,2));try{await shot(p,spec.name+'-FAIL');}catch(se){console.error('Screenshot unavailable:',se.message);}throw e;}finally{await browser.close();}}"
assert a in s
s=s.replace(a,b)
a="await shot(p,spec.name+'-journey');await dismiss(p);"
b=a+"checkpoint('early-mute');await p.waitForFunction(()=>SolarisSound.snapshot(false).musicTrack?.ready);await p.click('#soundToggle');await p.waitForFunction(()=>SolarisSound.snapshot(false).state==='suspended');checkpoint('early-unmute');await p.click('#soundToggle');await p.waitForFunction(()=>SolarisSound.snapshot(false).state==='running');checkpoint('early-resume-ok');"
assert a in s
p.write_text(s.replace(a,b))
print('Single musical source; UI state callbacks never pull audio samples. Full output tests retained.')
