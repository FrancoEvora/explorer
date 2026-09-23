from pathlib import Path
p=Path('site/conquista/conquista.css');s=p.read_text()
a='#missionDialog button{-webkit-appearance:none;appearance:none;touch-action:manipulation;position:relative}'
b='#missionDialog button{-webkit-appearance:none;appearance:none;touch-action:manipulation}'
assert s.count(a)==1
p.write_text(s.replace(a,b))
p=Path('tests/solaris-conquista.cjs');s=p.read_text()
a='const before=await snapshot(p);await solve(p,l.type,l.id);'
b="const before=await snapshot(p);if(l.type==='hidden'){assert(await p.locator('.hidden-object').evaluateAll(es=>es.every(e=>getComputedStyle(e).position==='absolute')),'Hidden-object targets retain their map anchoring');}await solve(p,l.type,l.id);"
assert s.count(a)==1
p.write_text(s.replace(a,b))
