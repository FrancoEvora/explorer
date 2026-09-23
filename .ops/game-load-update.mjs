import fs from 'node:fs';
import assert from 'node:assert/strict';
const file='site/game/game.js';
let s=fs.readFileSync(file,'utf8');
const old="image.addEventListener('load',startImage);image.addEventListener('error',()=>{if(!image.src.includes('masterplan.jpg')){image.src='../assets/masterplan.jpg';return;}$('loading').textContent='Não foi possível carregar o mapa. Atualize a página para tentar novamente.';$('startBtn').textContent='Cenário indisponível — atualize a página';});";
const replacement=`let fallbackTried=false;
function imageFailed(){
 if(ready)return;
 if(!fallbackTried){fallbackTried=true;image.src='../assets/masterplan.jpg';return;}
 $('loading').hidden=false;$('loading').textContent='Não foi possível carregar o mapa. Atualize a página para tentar novamente.';
 $('startBtn').disabled=true;$('startBtn').textContent='Cenário indisponível — atualize a página';
}
image.addEventListener('load',startImage);image.addEventListener('error',imageFailed);`;
assert.equal(s.split(old).length,2,'Unexpected source; stop rather than guessing.');
s=s.replace(old,replacement);
const oldStart="$('game').inert=true;update();if(image.complete&&image.naturalWidth)startImage();";
assert.equal(s.split(oldStart).length,2);
s=s.replace(oldStart,"$('game').inert=true;update();if(image.complete){if(image.naturalWidth)startImage();else imageFailed();}");
fs.writeFileSync(file,s);
console.log('Image startup handles both load/error events and already-completed image requests.');
