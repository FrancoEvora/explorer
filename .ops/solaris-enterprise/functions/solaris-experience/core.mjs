export const PROJECT = '85799c1b-e14a-5120-bf3d-976928d5dec3';
export const ORG = '041758e2-bc13-4614-8f06-a92fde19c9f8';
export const PRODUCT = 'b63ad44e-e6bf-44d8-b10b-2083444f9de0';
export const STATUS = {disponivel:'Disponível',reservado:'Reservado',vendido:'Vendido',bloqueado:'Indisponível',indisponivel:'Indisponível',institucional:'Institucional'};
const positive = value => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value)>0 ? Number(value) : null;

// Explicit projection: never return discounts, negotiation floors, reasons or customer data.
export function publicUnits(rows, reservations, now = Date.now()) {
  const reserved = new Set(reservations.filter(r => r.status==='ativa' && (!r.starts_at || Date.parse(r.starts_at)<=now) && (!r.expires_at || Date.parse(r.expires_at)>now) && !['rejected','expired'].includes(r.approval_status)).map(r=>r.unit_id));
  const ids=new Set();
  return rows.map(row=>{
    const block=String(row.block_code).toUpperCase().trim(), number=Number(row.lot_number);
    if(!/^[A-J]$/.test(block)||!Number.isInteger(number)||number<1||number>99)throw new Error('INVALID_INVENTORY');
    const id=`lote-${block.toLowerCase()}-${String(number).padStart(2,'0')}`;
    if(ids.has(id))throw new Error('DUPLICATE_INVENTORY');
    ids.add(id);
    let status= row.status==='disponivel' ? (reserved.has(row.id)?'reservado':'disponivel') : row.status==='vendido'?'vendido':row.status==='reservado'?'reservado':String(row.status).startsWith('bloqueio_')?'bloqueado':'indisponivel';
    if(id==='lote-c-18')status='institucional';
    const area=positive(row.area), price=status==='disponivel'?positive(row.list_price):null;
    return {id,block,number,status,area,price,pricePerSqm:price?(positive(row.price_per_sqm)||(area?Math.round(price/area*100)/100:null)):null};
  }).sort((a,b)=>a.block.localeCompare(b.block)||a.number-b.number);
}

const decimal = value => new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(value);
const money = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export function narration(id, units, places) {
  const p=places.find(p=>p.id===id);
  if(p)return `${p.title}. ${p.description} ${p.note}`;
  const block=/^quadra-([a-j])$/.exec(id);
  if(block){
    const letter=block[1].toUpperCase(), group=units.filter(u=>u.block===letter);
    if(!group.length)return null;
    const available=group.filter(u=>u.status==='disponivel').length;
    return `Quadra ${letter}. ${group.length} lotes identificados, sendo ${available} disponíveis no Évora Enterprise. Selecione um lote para conhecer a metragem e o valor. Disponibilidade sujeita a confirmação.`;
  }
  const unit=units.find(u=>u.id===id);
  if(!unit)return null;
  const {number,block:letter,status,area,price}=unit;
  return `Lote ${number}, quadra ${letter}. ${area?`Área de ${decimal(area)} metros quadrados. `:''}${STATUS[status]}. ${price?`Preço de tabela: ${money(price)}. `:status==='disponivel'?'Preço sob consulta. ':''}${status==='institucional'?'Área institucional, sem oferta comercial.':'Informações do Évora Enterprise. Valores e disponibilidade sujeitos a confirmação.'}`;
}
