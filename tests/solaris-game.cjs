const {chromium,webkit}=require(process.env.QA_NODE_MODULES+'/playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('solaris-dist'),out=path.resolve('qa-output');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{let pathname=new URL(req.url,'http://localhost').pathname;try{pathname=decodeURIComponent(pathname);}catch{res.writeHead(400);return res.end();}if(pathname.endsWith('/'))pathname+='index.html';const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(8877,'127.0.0.1',r));
 const base=process.env.QA_BASE_URL||'http://127.0.0.1:8877',report={version:'solaris-day-v1',checks:[]};
 for(const spec of [{name:'iphone-webkit',engine:webkit,viewport:{width:393,height:740},mobile:true},{name:'iphone-compact-webkit',engine:webkit,viewport:{width:375,height:620},mobile:true},{name:'iphone-landscape-webkit',engine:webkit,viewport:{width:844,height:390},mobile:true},{name:'desktop-chromium',engine:chromium,viewport:{width:1440,height:900},mobile:false}]){
  const browser=await spec.engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:spec.viewport,isMobile:spec.mobile,hasTouch:spec.mobile,deviceScaleFactor:1,reducedMotion:'reduce',acceptDownloads:true});
   const page=await context.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))external.push(r.url());});
   const tap=async selector=>{const l=page.locator(selector);if(spec.mobile)await l.tap();else await l.click();};
   const arrived=async()=>page.waitForFunction(()=>document.body.dataset.walking==='false',{},{timeout:15000});
   const response=await page.goto(base+'/jogo/',{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.waitForFunction(()=>document.body.dataset.ready==='true');
   assert.equal(await page.locator('#masterplan').evaluate(e=>e.naturalWidth),1448);assert.equal(await page.locator('#startBtn').isEnabled(),true);
   await page.locator('#nickname').fill('Explorador');await tap('[data-outfit=verde]');
   await page.screenshot({path:path.join(out,spec.name+'-welcome.png')});await tap('#startBtn');
   assert.equal(await page.locator('#welcome').isVisible(),false);assert.equal(await page.evaluate(()=>SolarisGame.snapshot().data.outfit),'verde');
   await tap('#stop-bosque');await page.waitForTimeout(120);
   assert((await page.evaluate(()=>SolarisGame.snapshot().remainingNodes))>0,'Character walks rather than teleporting');
   await tap('#pauseWalk');let p1=await page.evaluate(()=>SolarisGame.snapshot().position);await page.waitForTimeout(130);assert.deepEqual(await page.evaluate(()=>SolarisGame.snapshot().position),p1);await tap('#pauseWalk');await arrived();
   assert.equal(await page.locator('#taskTitle').textContent(),'Bosque e Pista de Caminhada');await page.screenshot({path:path.join(out,spec.name+'-map.png')});await tap('#taskAction');
   assert.equal(await page.locator('#groveFinish').isDisabled(),true);await tap('[data-item=leaf]');await tap('[data-item=leaf]');assert.equal(await page.evaluate(()=>SolarisGame.snapshot().data.found.length),1);
   await tap('#closeMission');await tap('#taskAction');assert.equal(await page.evaluate(()=>SolarisGame.snapshot().data.found.length),1);
   await page.screenshot({path:path.join(out,spec.name+'-grove.png')});await tap('[data-item=bird]');await tap('[data-item=butterfly]');await tap('#groveFinish');
   assert.equal(await page.evaluate(()=>SolarisGame.snapshot().data.completed.length),1);await tap('#rewardNext');await arrived();await tap('#taskAction');
   await tap('[data-node=sun]');assert.equal(await page.evaluate(()=>SolarisGame.snapshot().data.plaza.length),0);assert.equal(await page.locator('#plazaFinish').isDisabled(),true);
   for(const n of ['leaf','flower','heart'])await tap('[data-node='+n+']');await page.screenshot({path:path.join(out,spec.name+'-plaza.png')});await tap('#plazaFinish');await tap('#rewardNext');await arrived();await tap('#taskAction');
   assert.equal(await page.locator('#photoShutter').isDisabled(),true);
   const board=await page.locator('#photoBoard').boundingBox(),frame=await page.locator('#photoFrame').boundingBox();
   await page.mouse.move(frame.x+frame.width/2,frame.y+frame.height/2);await page.mouse.down();await page.mouse.move(board.x+board.width*.44,board.y+board.height*.46,{steps:8});await page.mouse.up();
   assert.equal(await page.locator('#photoShutter').isEnabled(),true);await page.screenshot({path:path.join(out,spec.name+'-photography.png')});await tap('#photoShutter');await tap('#rewardNext');
   await page.waitForFunction(()=>!document.getElementById('downloadAlbum').disabled);assert.equal(await page.locator('.memory:not(.locked)').count(),3);
   await page.screenshot({path:path.join(out,spec.name+'-album.png')});
   const downloadPromise=page.waitForEvent('download');await tap('#downloadAlbum');const download=await downloadPromise;const png=path.join(out,spec.name+'-card.png');await download.saveAs(png);const bytes=fs.readFileSync(png);assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1350);assert(bytes.length>30000);
   // Validate the share payload without contacting any messaging or social network.
   await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async v=>{window.sharedPayload={count:v.files.length,type:v.files[0].type,size:v.files[0].size};}});});await tap('#shareAlbum');assert.equal(await page.evaluate(()=>window.sharedPayload.type),'image/png');
   const href=await page.locator('#visitLink').getAttribute('href');assert(href.startsWith('https://enterprise.terraragroup.com.br/atendimento/solaris/cadastro?'));assert(!href.includes('Explorador'));
   await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.body.dataset.ready==='true');assert.equal(await page.locator('#resumeBtn').isVisible(),true);await tap('#resumeBtn');assert.equal(await page.evaluate(()=>SolarisGame.snapshot().data.completed.length),3);
   await tap('#albumBtn');await page.waitForFunction(()=>!document.getElementById('downloadAlbum').disabled);await tap('#closeAlbum');
   await tap('#helpBtn');assert.equal(await page.locator('#helpDialog').isVisible(),true);await tap('#closeHelp');
   await tap('#zoomIn');
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
   await page.screenshot({path:path.join(out,spec.name+'-map-pan.png')});await tap('#follow');
   await page.goto(base+'/',{waitUntil:'networkidle'});await page.waitForSelector('#stage.ready');assert.equal(await page.locator('.map-label').count(),9);assert.equal(await page.locator('#portaria-implantacao').count(),1);assert.equal(await page.locator('#playGame').getAttribute('href'),'./jogo/');
   const link=await page.locator('#playGame').boundingBox();assert(link.x>=0&&link.x+link.width<=spec.viewport.width+1,'Game link must fit mobile header');
   await page.screenshot({path:path.join(out,spec.name+'-existing-map.png')});await tap('#playGame');await page.waitForFunction(()=>document.body.dataset.ready==='true');
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   report.checks.push({browser:spec.name,completeGameplay:true,pathMovement:true,pauseResume:true,threeMissions:true,correctAnswerRequired:true,photoFraming:true,albumPNG:'1080x1350',sharePayload:true,persistence:true,existingMapAndNineLabels:true,javascriptErrors:errors});
   await context.close();
  }finally{await browser.close();}
 }
 // Storage-disabled and missing-image recovery: no dead start button presented as playable.
 const browser=await chromium.launch({headless:true});try{
 const ctx=await browser.newContext(),page=await ctx.newPage();await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));await page.goto(base+'/jogo/');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#startBtn').click();assert((await page.locator('#saveStatus').textContent()).includes('sessão'));await ctx.close();
 const c2=await browser.newContext(),p2=await c2.newPage();await p2.route('**/assets/masterplan.*',r=>r.abort());await p2.goto(base+'/jogo/');await p2.waitForFunction(()=>document.getElementById('startBtn').textContent.includes('indisponível'));assert.equal(await p2.locator('#startBtn').isDisabled(),true);await c2.close();
 report.failureHandling={blockedStorage:'session fallback',missingImage:'disabled start and visible message'};
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
