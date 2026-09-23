import fs from 'node:fs';
import assert from 'node:assert/strict';
// The original landscape QA point (30%,20%) hit the mission panel, not the map.
// Keep the pan assertion; first prove the complete drag path hits the actual map.
const file = 'tests/solaris-game.cjs';
let code = fs.readFileSync(file, 'utf8');
const old = "await tap('#zoomIn');const before=await page.locator('#world').getAttribute('style');const r=await page.locator('#stage').boundingBox();await page.mouse.move(r.x+r.width*.3,r.y+r.height*.2);await page.mouse.down();await page.mouse.move(r.x+r.width*.3+55,r.y+r.height*.2+20,{steps:7});await page.mouse.up();assert.notEqual(await page.locator('#world').getAttribute('style'),before);await tap('#follow');";
assert.equal(code.split(old).length, 2, 'Expected exact reviewed test, refusing other changes.');
const replacement = `await tap('#zoomIn');
   const before=await page.locator('#world').getAttribute('style');
   const drag=await page.evaluate(()=>{
    const stage=document.getElementById('stage'),r=stage.getBoundingClientRect();
    function onMap(x,y){const el=document.elementFromPoint(x,y);return el&&stage.contains(el)&&!el.closest('button,a,dialog');}
    for(const fy of [.5,.3,.65,.2])for(const fx of [.55,.4,.7,.2]){
     const x=r.left+r.width*fx,y=r.top+r.height*fy;
     if([0,.25,.5,.75,1].every(t=>onMap(x+55*t,y+20*t)))return {x,y};
    }
    return null;
   });
   assert(drag,'The viewport must expose a draggable area outside the HUD');
   await page.mouse.move(drag.x,drag.y);await page.mouse.down();
   await page.mouse.move(drag.x+55,drag.y+20,{steps:7});await page.mouse.up();
   await page.waitForFunction(before=>document.getElementById('world').getAttribute('style')!==before,before);
   assert.notEqual(await page.locator('#world').getAttribute('style'),before);
   await page.screenshot({path:path.join(out,spec.name+'-map-pan.png')});await tap('#follow');`;
fs.writeFileSync(file,code.replace(old,replacement));
console.log('Pan QA now checks an unobstructed map region, including landscape.');
