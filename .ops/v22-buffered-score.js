/* Caminhos de Sol — original instrumental score composed for Solaris.
   76 BPM, 16 bars, C major. Melody, warm keys, arpeggios and bass.
   No external audio, recording, microphone, or third-party dependencies. */
(()=>{'use strict';
const BPM=76,BEAT=60/BPM;
const chords=[[48,55,59,64],[45,52,55,60],[41,48,52,57],[43,50,55,60],[48,55,59,64],[45,52,55,60],[41,48,52,57],[43,50,55,59],[48,55,59,64],[47,55,59,62],[45,52,55,60],[41,48,52,57],[50,57,60,65],[43,50,55,59],[48,55,60,64],[43,50,55,59]];
const melody=[[[0,72,1],[1.5,76,.5],[2,79,1],[3,76,.8]],[[0,76,1.5],[2,74,.5],[2.5,72,1]],[[0,69,1],[1,72,1],[2.5,76,1]],[[0,74,1.5],[2,71,.75],[3,67,.8]],[[0,72,.5],[.5,74,.5],[1,76,1],[2.5,79,1]],[[0,81,1.5],[2,79,.5],[3,76,.8]],[[0,77,1],[1,76,.5],[2,72,1.5]],[[0,74,1],[1.5,71,.5],[2,72,1.7]],[[0,79,1],[1.5,83,.5],[2,84,1.5]],[[0,83,1],[1,79,1],[2.5,74,1]],[[0,81,1.5],[2,79,.5],[3,76,.75]],[[0,77,1],[1.5,76,.5],[2,72,1.5]],[[0,74,.75],[1,77,.75],[2,81,1.5]],[[0,79,1],[1.5,77,.5],[2,74,1]],[[0,76,1],[1,74,.5],[2,72,1.8]],[[0,71,1],[1.5,74,.5],[2.5,67,1]]];
// Render once and loop one source, rather than resume many live oscillators.
function create(ctx,destination){
 const bus=ctx.createGain(),meter=ctx.createAnalyser(),filter=ctx.createBiquadFilter();
 bus.gain.value=0;filter.type='lowpass';filter.frequency.value=6000;filter.Q.value=.3;filter.connect(bus);bus.connect(meter);meter.fftSize=1024;meter.connect(destination);
 let buffer=null,source=null,volume=.65,active=false,elapsed=0,startedAt=0,failed=false;
 const events=[],DURATION=16*4*BEAT;
 function progress(){return elapsed+(source?Math.max(0,ctx.currentTime-startedAt):0);}
 function render(){
  const C=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!C)throw Error('Music rendering unavailable');
  const rate=32000,frames=Math.round(rate*DURATION),offline=new C(1,frames+rate*4,rate);
  function note(n,time,length,level,type='keys'){
   const duration=length*BEAT,env=offline.createGain();env.connect(offline.destination);events.push(time);
   env.gain.setValueAtTime(.00001,time);env.gain.exponentialRampToValueAtTime(level,time+(type==='pad'?.18:.012));
   env.gain.exponentialRampToValueAtTime(type==='pad'?level*.85:level*.3,time+duration*.75);
   env.gain.exponentialRampToValueAtTime(.00001,time+duration+.25);
   const parts=type==='keys'?[[1,1],[2,.22],[3,.07]]:type==='pad'?[[1,.55],[1.003,.45]]:[[1,1]];
   for(const [ratio,amp]of parts){const o=offline.createOscillator(),g=offline.createGain();o.type='sine';o.frequency.value=440*Math.pow(2,(n-69)/12)*ratio;g.gain.value=amp;o.connect(g);g.connect(env);o.start(time);o.stop(time+duration+.3);}
  }
  const pattern=[0,2,1,3,2,1,3,1];
  for(let bar=0;bar<16;bar++){
   const time=bar*4*BEAT,c=chords[bar];
   for(const n of c.slice(1))note(n,time,3.6,.022,'pad');
   note(c[0]-12,time,1.8,.075,'bass');note(c[0]-5,time+2*BEAT,1.3,.037,'bass');
   for(let e=0;e<8;e++)note(c[pattern[e]]+12,time+e*BEAT/2,.65,.022);
   for(const [b,n,length]of melody[bar])note(n,time+b*BEAT,length,.062);
  }
  events.sort((a,b)=>a-b);
  return offline.startRendering().then(rendered=>{
   const b=ctx.createBuffer(1,frames,rate),dst=b.getChannelData(0),src=rendered.getChannelData(0);
   dst.set(src.subarray(0,frames));
   for(let i=frames;i<src.length;i++)dst[(i-frames)%frames]+=src[i];
   return b;
  });
 }
 function playBuffer(){
  if(!active||source||!buffer||ctx.state!=='running'||document.hidden)return;
  const s=ctx.createBufferSource();s.buffer=buffer;s.loop=true;s.connect(filter);
  startedAt=ctx.currentTime;source=s;s.start(0,elapsed%buffer.duration);setVolume(volume);
 }
 function setVolume(v){volume=Math.max(0,Math.min(1,v));bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setTargetAtTime(active?volume:0,ctx.currentTime,.08);}
 function start(){active=true;playBuffer();setVolume(volume);}
 function stop(){
  elapsed=progress();active=false;bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setValueAtTime(0,ctx.currentTime);
  if(source){const s=source;source=null;s.onended=null;try{s.stop();}catch{}s.disconnect();}
 }
 function setScene(s){filter.frequency.setTargetAtTime(['lago','bosque','refuge'].includes(s)?3300:6000,ctx.currentTime,.6);}
 function snapshot(){
  const t=progress(),duration=buffer?.duration||DURATION,loops=Math.floor(t/duration),at=t%duration;
  let rms=0;if(active&&ctx.state==='running'){const a=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(a);rms=Math.sqrt(a.reduce((s,n)=>s+n*n,0)/a.length);}
  return{title:'Caminhos de Sol',bpm:BPM,bars:16,active,ready:!!buffer,failed,scoreNotes:events.length,playedNotes:loops*events.length+events.filter(e=>e<=at).length,loops,bar:Math.min(16,Math.floor(at/(4*BEAT))+1),rms,voices:source?1:0};
 }
 try{render().then(b=>{buffer=b;playBuffer();document.dispatchEvent(new CustomEvent('solaris:sound-state'));}).catch(()=>{failed=true;document.dispatchEvent(new CustomEvent('solaris:sound-state'));});}catch{failed=true;}
 return Object.freeze({start,stop,setVolume,setScene,snapshot});
}
window.SolarisMusic=Object.freeze({create});
})();