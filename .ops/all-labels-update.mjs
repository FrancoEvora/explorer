// Uniform names for every Solaris point. Original image, gate, coordinates and controls are preserved.
export const VERSION = '2026-09-22-all-labels-v4';
const css = `
/* Names are independent of map scale. Never truncate them or limit them to featured points. */
.pins .pin span{display:none!important}
.pins .pin{z-index:3}
.pins .pin b{border-color:#eee4b9;box-shadow:0 2px 10px #0006}
.map-label{position:absolute;z-index:2;left:0;top:0;width:max-content;max-width:156px;margin:0;border:1px solid #d8cda667;border-radius:8px;padding:6px 9px;background:#10271ef5;color:#f5f3e9;font:500 11px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;text-align:left;white-space:normal;overflow:visible;word-break:normal;box-shadow:0 2px 10px #0004;pointer-events:auto;touch-action:none;transition:background .18s}
.map-label[aria-pressed=true]{background:#e1d9b2;color:#172a1f;border-color:#e1d9b2;z-index:4}
.map-label:hover{border-color:#f3e8b6}
.label-connectors{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none;fill:none;stroke:#f0e4b9;stroke-width:1;stroke-linecap:round;filter:drop-shadow(0 1px 1px #10221c);opacity:.83}
@media(max-width:600px){.map-label{font-size:10px;max-width:132px;padding:6px 8px;border-radius:7px}}
@media(max-height:530px) and (orientation:landscape){.map-label{font-size:10px;max-width:132px;padding:5px 8px}}
`;

// Runs inside its own closure; no replacement of the existing zoom/touch/tour implementation.
function installAllLabels() {
  'use strict';
  const stage = document.getElementById('stage');
  const plane = document.getElementById('plane');
  const pins = document.getElementById('pins');
  const app = document.getElementById('app');
  if (!stage || !plane || !pins || !app) return;
  const ns = 'http://www.w3.org/2000/svg';
  const lines = document.createElementNS(ns, 'svg');
  lines.classList.add('label-connectors');
  lines.setAttribute('aria-hidden', 'true');
  pins.prepend(lines);
  const preferences = {
    portaria: ['SW','W','S'], praca: ['E','SE','NE'], bosque: ['NW','N','W'],
    lago: ['W','SW','NW'], clube: ['NW','N','W'], quadras: ['W','SW','NW'],
    hipica: ['S','SW','SE'], acesso: ['E','SE','S'], parque: ['NE','N','E']
  };
  const priority = ['portaria','quadras','clube','praca','parque','acesso','bosque','lago','hipica'];
  const entries = Array.from(pins.querySelectorAll('.pin')).map(pin => {
    const id = pin.dataset.scene;
    const name = pin.getAttribute('aria-label') || pin.querySelector('span').textContent;
    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'map-label';
    label.id = 'label-' + id;
    label.dataset.target = id;
    label.textContent = name;
    label.setAttribute('aria-label', 'Explorar ' + name);
    label.style.visibility = 'hidden';
    let start = null, dragged = false;
    label.addEventListener('pointerdown', event => {
      start = {x:event.clientX,y:event.clientY}; dragged = false;
      label.setPointerCapture(event.pointerId);
    });
    label.addEventListener('pointermove', event => {
      if (start && Math.hypot(event.clientX-start.x,event.clientY-start.y)>5) dragged=true;
    });
    label.addEventListener('pointercancel', () => {start=null;dragged=true;});
    label.addEventListener('pointerup', () => {start=null;});
    label.addEventListener('click', event => {
      if (event.detail!==0 && dragged) {event.preventDefault();return;}
      pin.click();
    });
    const line = document.createElementNS(ns,'path');
    lines.append(line); pins.append(label);
    return {id,pin,label,line};
  }).sort((a,b)=>priority.indexOf(a.id)-priority.indexOf(b.id));
  let frame = 0;
  function requestLayout(){if(!frame)frame=requestAnimationFrame(layout);}
  function intersect(a,b,gap=3){return a.x < b.x+b.w+gap && a.x+a.w+gap > b.x && a.y < b.y+b.h+gap && a.y+a.h+gap > b.y;}
  function near(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
  function obstacle(el,base) {
    if(!el || el.hidden) return null;
    const r=el.getBoundingClientRect();
    return r.width&&r.height?{x:r.left-base.left,y:r.top-base.top,w:r.width,h:r.height}:null;
  }
  function layout() {
    frame=0;
    if(!stage.classList.contains('ready') || pins.hidden || app.classList.contains('clean')) return;
    const base=stage.getBoundingClientRect(), W=base.width, H=base.height;
    if(W<20 || H<20) return;
    lines.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const visible=[];
    for(const item of entries){
      const r=item.pin.querySelector('b').getBoundingClientRect();
      const x=r.left-base.left+r.width/2, y=r.top-base.top+r.height/2;
      const show=!item.pin.hidden && x>=0 && x<=W && y>=0 && y<=H;
      item.label.hidden=!show; item.line.style.display=show?'':'none';
      if(show){item.anchor={x,y};visible.push(item);}
    }
    const circles=visible.map(i=>({x:i.anchor.x-15,y:i.anchor.y-15,w:30,h:30}));
    const blocked=[obstacle(document.querySelector('.toolbox'),base),obstacle(document.getElementById('detail'),base)].filter(Boolean);
    const placed=[];
    for(const item of visible){
      const {x:ax,y:ay}=item.anchor, w=item.label.offsetWidth,h=item.label.offsetHeight;
      const preferred=preferences[item.id]||['E'];
      const directions=[...new Set([...preferred,'E','W','N','S','NE','NW','SE','SW'])];
      let best=null;
      function candidate(x,y,penalty){
        x=near(x,5,Math.max(5,W-w-5)); y=near(y,5,Math.max(5,H-h-5));
        const box={x,y,w,h};
        const collisions=[...circles,...blocked,...placed].filter(r=>intersect(box,r)).length;
        const cx=near(ax,x,x+w),cy=near(ay,y,y+h);
        const score=collisions*1000000+Math.hypot(cx-ax,cy-ay)+penalty;
        if(!best || score<best.score)best={...box,score,collisions,cx,cy};
      }
      for(const gap of [20,32,48,68,92,124,160,205]){
        directions.forEach((d,rank)=>{
          let x=ax-w/2,y=ay-h/2;
          if(d.includes('E'))x=ax+gap;
          if(d.includes('W'))x=ax-gap-w;
          if(d.includes('N'))y=ay-gap-h;
          if(d.includes('S'))y=ay+gap;
          candidate(x,y,rank*5);
        });
      }
      // Dense mobile frames have room above/below the letterboxed image. Use it rather than hiding names.
      if(best.collisions){
        for(let y=5;y<=H-h-5;y+=14)for(let x=5;x<=W-w-5;x+=18)candidate(x,y,25);
      }
      placed.push(best);
      item.label.style.left=best.x.toFixed(2)+'px';
      item.label.style.top=best.y.toFixed(2)+'px';
      item.label.style.visibility='visible';
      item.label.setAttribute('aria-pressed',item.pin.getAttribute('aria-pressed')||'false');
      const dist=Math.hypot(best.cx-ax,best.cy-ay);
      const ux=(best.cx-ax)/(dist||1),uy=(best.cy-ay)/(dist||1);
      item.line.setAttribute('d',dist>17?`M${(ax+ux*15).toFixed(2)} ${(ay+uy*15).toFixed(2)}L${best.cx.toFixed(2)} ${best.cy.toFixed(2)}`:'');
    }
    app.dataset.labelMode='all-visible';
    app.dataset.visibleLabels=String(visible.length);
  }
  new MutationObserver(requestLayout).observe(plane,{attributes:true,attributeFilter:['style']});
  new MutationObserver(requestLayout).observe(pins,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(requestLayout).observe(app,{attributes:true,attributeFilter:['class']});
  new MutationObserver(requestLayout).observe(document.getElementById('detail'),{attributes:true,attributeFilter:['hidden']});
  new ResizeObserver(requestLayout).observe(stage);
  const image=document.getElementById('masterplan');
  image.addEventListener('load',requestLayout);
  if(document.fonts)document.fonts.ready.then(requestLayout);
  requestLayout();
}

export function applyAllLabelsUpdate(html) {
  if(!html.includes('2026-09-22-landmarks-v3') || !html.includes('id="portaria-implantacao"')) throw new Error('Expected complete, reviewed Solaris landmark release.');
  if(html.includes('id="all-location-labels"')) throw new Error('Labels update must run only once.');
  html=html.replace('</head>','<style id="all-location-labels">'+css+'</style></head>');
  html=html.replace('</body>','<script>('+installAllLabels.toString()+')();</script></body>');
  return html.replaceAll('2026-09-22-landmarks-v3',VERSION);
}
