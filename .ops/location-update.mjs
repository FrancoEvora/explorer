// Location corrections calibrated against the three screenshots supplied by the owner.
// Coordinates are normalized illustration coordinates, never survey measurements.
export const VERSION = '2026-09-22-landmarks-v3';
export const SCENES = [
  {id:'geral',name:'Visão geral',tag:'O empreendimento',x:.5,y:.5,z:1,info:'Explore o masterplan completo, com a Praça, a Portaria e o Bosque e Pista de Caminhada identificados.'},
  {id:'portaria',name:'Portaria',tag:'Acesso ao Solaris',x:.5628,y:.5108,z:4.1,featured:true,info:'Implantação ilustrativa da portaria no ponto indicado, junto ao clube e às quadras. A representação não substitui o projeto arquitetônico.'},
  {id:'praca',name:'Praça',tag:'Convivência & paisagismo',x:.6490,y:.4753,z:3.8,featured:true,info:'Praça paisagística na área triangular próxima ao clube e às quadras. Explore os caminhos e os espaços de convivência representados na imagem.'},
  {id:'bosque',name:'Bosque e Pista de Caminhada',tag:'Natureza & caminhada',x:.3146,y:.2095,z:3.15,featured:true,info:'Faixa verde entre as quadras residenciais, com bosque e pista de caminhada. A imagem preserva o traçado dos caminhos e o paisagismo de referência.'},
  {id:'lago',name:'Lago e Deck',tag:'Natureza & convivência',x:.155,y:.327,z:2.65,info:'Explore a margem do lago, os decks e a vegetação representados na imagem.'},
  {id:'clube',name:'Clube e Piscinas',tag:'Lazer & encontro',x:.588,y:.405,z:3.4,info:'Aproxime o núcleo do clube, as piscinas e sua relação com o entorno.'},
  {id:'quadras',name:'Quadras',tag:'Esporte & movimento',x:.584,y:.477,z:3.7,info:'Veja o setor esportivo e a conexão com as áreas de lazer do masterplan.'},
  {id:'hipica',name:'Centro Hípico',tag:'Experiência equestre',x:.428,y:.682,z:3,info:'Percorra visualmente a arena, as instalações de apoio e a faixa verde ao redor.'},
  {id:'acesso',name:'Acesso principal',tag:'Conexão viária externa',x:.927,y:.392,z:2.55,info:'Conexão viária externa representada na imagem. A Portaria do Solaris está identificada separadamente, junto ao setor de lazer.'},
  {id:'parque',name:'Parque das Árvores',tag:'Bairro planejado',x:.751,y:.283,z:2,info:'Explore as quadras do Bairro Parque das Árvores integradas ao conjunto.'}
];

const css = `
/* Named locations stay legible independently of map magnification. */
.pin.featured{z-index:4}
.pin.featured b{border-color:#eee4b9;box-shadow:0 2px 10px #0007}
.pin.featured span{display:block;opacity:1;white-space:normal;width:max-content;max-width:170px;line-height:1.25;border:1px solid #d8cda657;box-shadow:0 3px 12px #0004;text-align:left}
.pin.featured[aria-pressed=true] span{background:#e1d9b2;color:#172a1f}
#pin-portaria{transform:translate(-50%,10px)}
#pin-portaria:before{content:'';position:absolute;top:-10px;left:21px;height:20px;border-left:1px solid #efe6bd}
#pin-portaria span{left:auto;right:39px}
.site-overlay{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:none;pointer-events:none;overflow:visible}
#stage:not(.ready) .site-overlay{display:none}
.scene{min-width:127px}
@media(max-width:600px){.pin.featured span{display:block;max-width:126px;font-size:10px;padding:5px 8px}.pin.featured b{width:24px;height:24px}.scene{min-width:116px}.pin#pin-bosque span{max-width:142px}}
`;

// A deliberately two-dimensional implantation diagram, not simulated 3D or a construction photograph.
const gate = `<svg class="site-overlay" id="portaria-implantacao" viewBox="0 0 1448 1086" role="img" aria-label="Implantação ilustrativa da portaria no ponto indicado">
<title>Portaria — implantação ilustrativa</title>
<g transform="translate(814.93 554.69) rotate(18)">
<rect x="-17" y="-5" width="34" height="11" rx="2" fill="#14201d" opacity=".28" transform="translate(2 2)"/>
<rect x="-17" y="-7" width="34" height="10" rx="1.2" fill="#d8c9a9" stroke="#f5e9ca" stroke-width=".65"/>
<rect x="-15.8" y="-6" width="31.6" height="7.6" rx=".6" fill="#536059"/>
<path d="M-13-5v6M-9-5v6M-5-5v6M5-5v6M9-5v6M13-5v6" stroke="#81877b" stroke-width=".6"/>
<rect x="-4.3" y="-5.8" width="8.6" height="11.8" rx="1.2" fill="#ddd0b4" stroke="#f4e9d0" stroke-width=".65"/>
<rect x="-3.1" y="-4.6" width="6.2" height="8.5" rx=".5" fill="#2f4844"/>
<path d="M-15 6h9M6 6h9" stroke="#f4e6c3" stroke-width="1.3"/>
<path d="M-14 6h2m3 0h2M7 6h2m3 0h2" stroke="#ab533c" stroke-width="1.35"/>
<circle cx="-16" cy="5.5" r="1.1" fill="#ddd0b4"/><circle cx="16" cy="5.5" r="1.1" fill="#ddd0b4"/>
</g></svg>`;

function replaceOnce(html, oldText, newText) {
  if (!html.includes(oldText) || html.indexOf(oldText) !== html.lastIndexOf(oldText)) {
    throw new Error('Unexpected source structure: location update stopped instead of guessing.');
  }
  return html.replace(oldText, newText);
}

export function applyLocationUpdate(input) {
  if (!input.includes('2026-09-22-image-v2')) throw new Error('Expected reviewed image-only baseline.');
  let html = input;
  const block = html.match(/const scenes=\[[\s\S]*?\n\];/);
  if (!block) throw new Error('Scene definitions not found.');
  html = replaceOnce(html, block[0], 'const scenes=' + JSON.stringify(SCENES) + ';');
  html = replaceOnce(html, '</picture></div><div class="pins"', '</picture>' + gate + '</div><div class="pins"');
  html = replaceOnce(html, '</style>', css + '\n</style>');
  html = replaceOnce(html, "p.className='pin';", "p.className='pin'+(s.featured?' featured':'');");
  html = replaceOnce(html, "sm.textContent=String(i+1).padStart(2,'0');", "sm.textContent=i?String(i).padStart(2,'0'):'GERAL';");
  html = replaceOnce(html, "if(moved)app.classList.add('exploring');", "if(moved){app.classList.add('exploring');$('detail').hidden=true;}");
  html = replaceOnce(html, "current=s.id;app.classList.toggle", "current=s.id;app.dataset.activeScene=s.id;app.classList.toggle");
  // Keep the existing gesture, responsive framing, presentation and guided-tour implementation.
  html = html.replaceAll('2026-09-22-image-v2', VERSION);
  html = replaceOnce(html, 'Imagem ilustrativa · pontos de interesse indicativos', 'Imagem ilustrativa · portaria com implantação indicativa');
  html = replaceOnce(html, 'Os pontos são indicativos; a imagem não substitui a planta aprovada nem informa disponibilidade comercial.', 'Praça, Portaria e Bosque e Pista de Caminhada seguem as posições indicadas. A portaria foi acrescentada como desenho de implantação ilustrativo. A imagem não substitui a planta aprovada nem informa disponibilidade comercial.');
  for (const s of SCENES) {
    if (!(s.x>=0 && s.x<=1 && s.y>=0 && s.y<=1 && s.z>=1 && s.z<=5)) throw new Error('Invalid location.');
  }
  return html;
}
