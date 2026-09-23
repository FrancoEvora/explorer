from pathlib import Path
import hashlib
root=Path('.')
paths=['site/conquista/conquista.js','site/conquista/conquista.css','site/conquista/index.html','.ops/conquest-update.mjs']
expected={'site/conquista/conquista.js': 'c1150fa735a1fc66dd390db654aabe9a8e68c334551ac9b24a0a0f61cfd6a3b8', 'site/conquista/conquista.css': 'b8377497ac56719e70dd40bef2ea34c77db8b2b7f22b27598b8e6fe91b74a77a', 'site/conquista/index.html': '4b0fcf6dc5c860f06f1fbdbe478a1a5f59fe3951e235a8f10ca673c63bc5bc19', 'site/conquista/README.md': '4e28c2ec9feb6add3109e591bba2d4a7051abad7a48fde61bb9bbac5f0e543e1', '.ops/conquest-update.mjs': 'c6d8db3e7c8ad43b3fb239802dc299f1278bf86a5beb9b1d840bd360cf3ab4c8'}
for name,digest in expected.items():
    assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==digest, 'Concurrent application change: '+name
assert not Path('site/conquista/input.js').exists()
p=Path('site/conquista/conquista.js');s=p.read_text()
assert "const VERSION='solaris-conquista-v2.2',KEY='solaris-conquista-v2'" in s
s=s.replace("const VERSION='solaris-conquista-v2.2'", "const VERSION='solaris-conquista-v2.2.1'",1)
a='const $=id=>document.getElementById(id),svg=(id,cls=\'\')=>`<svg aria-hidden="true" class="${cls}"><use href="#i-${id}"/></svg>`;'
b='''const $=id=>document.getElementById(id),iconCache=new Map();
function svg(id,cls=''){
 if(!iconCache.has(id)){const symbol=$('i-'+id);iconCache.set(id,{viewBox:symbol?.getAttribute('viewBox')||'0 0 24 24',body:symbol?.innerHTML||'<circle cx="12" cy="12" r="7"/>'});}
 const icon=iconCache.get(id);
 return `<svg aria-hidden="true" focusable="false" class="${cls}" data-icon="${id}" viewBox="${icon.viewBox}">${icon.body}</svg>`;
}'''
assert s.count(a)==1;s=s.replace(a,b)
assert s.count('const sound=window.SolarisSound;')==1
# Sound is decorative feedback: a native audio exception cannot abort a phase.
s=s.replace('sound?.play(', 'playCue(')
s=s.replace('const sound=window.SolarisSound;','''const sound=window.SolarisSound;
function playCue(...args){try{sound?.play(...args);}catch(e){document.body.dataset.audioFeedback='unavailable';}}
''')
start=s.index('function buildRoute(l){');end=s.index('function buildMemory(l){',start)
s=s[:start]+Path('.ops/phase1-route.js').read_text()+'\n'+s[end:]
p.write_text(s)
Path('site/conquista/input.js').write_text(Path('.ops/phase1-input.js').read_text())
p=Path('site/conquista/index.html');s=p.read_text();assert 'solaris-conquista-v2.2' in s
s=s.replace('solaris-conquista-v2.2','solaris-conquista-v2.2.1').replace('?v=22','?v=221')
a='<script src="./conquista.js?v=221" defer></script>'
assert s.count(a)==1
s=s.replace(a,'<script src="./input.js?v=221" defer></script>'+a)
p.write_text(s)
p=Path('.ops/conquest-update.mjs');s=p.read_text().replace('solaris-conquista-v2.2','solaris-conquista-v2.2.1')
s=s.replace("'audio.js','conquista.js'","'audio.js','input.js','conquista.js'")
s=s.replace("sourceSHA256:crypto", "input:{nativeTouch:true,inlineIcons:true,guidedFirstPhase:true},sourceSHA256:crypto")
p.write_text(s)
p=Path('site/conquista/conquista.css');s=p.read_text()
s+='''
/* v2.2.1: direct touch targets and named, explicit first-phase progress. */
#missionDialog{touch-action:pan-y;overscroll-behavior:contain}
#missionDialog button{-webkit-appearance:none;appearance:none;touch-action:manipulation;position:relative}
#missionDialog button>*{pointer-events:none}
#missionDialog .closebutton{position:absolute}
#missionBoard svg{overflow:visible;pointer-events:none}
.route-guide{padding:12px;border:1px solid var(--line);border-radius:14px;background:#102a2355;margin-bottom:12px}
.route-guide>.eyebrow{display:block;font-size:9px;margin-bottom:8px}
.route-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:0;padding:0;list-style:none}
.route-steps li{position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;padding:9px 3px 7px;border:1px solid transparent;border-radius:10px;color:var(--muted);min-width:0}
.route-steps li.current{border-color:var(--gold);background:#e8d69813;color:var(--ivory)}
.route-steps li.done{background:var(--gold);color:var(--deep)}
.route-steps svg{width:23px;height:23px}.route-steps b{font-size:11px;font-weight:550;white-space:nowrap}
.route-step-no{position:absolute;left:4px;top:2px;font-size:8px;opacity:.65}
.route-step-state{font-size:7px;font-weight:600;letter-spacing:.04em}
.route-prompt{margin:10px 0 12px;color:var(--gold);font-size:13px;min-height:20px;line-height:1.45}
.route-prompt.complete{color:var(--mint)}
.route-options button{min-height:84px;gap:5px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.route-options button.chosen{background:#46674a;border-color:var(--gold)}
.route-options button.route-wrong{border-color:#e6a185;background:#663f3533}
.route-card-state{font-size:7px;font-weight:600;letter-spacing:.04em;color:#d0d9bc}
#missionDialog button:active{filter:brightness(1.14)}
@media(max-width:390px){.route-options{gap:8px}.route-options button{min-height:77px}.route-steps b{font-size:10px}}
@media(max-height:500px) and (orientation:landscape){.route-guide{padding:8px}.route-steps li{padding:5px 2px}.route-options button{min-height:58px}.route-options button svg{width:23px;height:23px}}
'''
p.write_text(s)
p=Path('site/conquista/README.md');s=p.read_text();s+='''

## v2.2.1 — phase-one touch and icon resilience
Mission buttons now activate directly on a valid touch/pointer release, with native compatibility-click deduplication, drag/cancel guards and the original mouse/keyboard path preserved. Dynamic game icons embed their SVG geometry and viewBox; no hidden symbol reference is required for rendering. Phase one has named, numbered steps, an explicit next-card prompt, chosen-state feedback and an enabled completion button only after the complete sequence. Audio effect failures cannot interrupt visual progress. Existing progress key, music, 15 phases, nine visit achievements and reward amounts are unchanged. Browser automation is not a physical iPhone test.
''';p.write_text(s)
print('v2.2.1 candidate created; map, audio lifecycle and save key preserved.')
