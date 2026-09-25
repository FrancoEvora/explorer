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
export function narration(id, units, places) {
  const p=places.find(p=>p.id===id);
  if(p)return `${p.title}. ${p.description} ${p.note}`;
  const block=/^quadra-([a-j])$/.exec(id);
  if(block){
    const letter=block[1].toUpperCase(), group=units.filter(u=>u.block===letter);
    if(!group.length)return null;
    const available=group.filter(u=>u.status==='disponivel').length;
    return `Quadra ${letter}. ${group.length} lotes identificados, sendo ${available} disponíveis. Selecione um lote para conhecer suas características e metragem.`;
  }
  const unit=units.find(u=>u.id===id);
  if(!unit)return null;
  const {number,block:letter,status,area}=unit;
  return `Lote ${number}, quadra ${letter}. ${status==='institucional'?'Área institucional.':'Lote residencial.'} ${area?`Área de ${decimal(area)} metros quadrados. `:''}${STATUS[status]}.`;
}

export function validateReservation(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||data.website||data.consent!==true)return null;
 const name=typeof data.name==='string'?data.name.trim().replace(/\s+/g,' '):'';
 let phone=typeof data.phone==='string'?data.phone.replace(/\D/g,''):'';
 if(phone.length===13&&phone.startsWith('55'))phone=phone.slice(2);
 const ddds=[11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];
 if(name.length<3||name.length>120||!/^\d{2}9\d{8}$/.test(phone)||!ddds.includes(Number(phone.slice(0,2)))||/^(\d)\1+$/.test(phone.slice(2)))return null;
 if(!/^lote-[a-j]-(0[1-9]|[1-9][0-9])$/.test(data.id)||!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(data.requestId))return null;
 return {id:data.id,requestId:data.requestId.toLowerCase(),name,phone:'+55'+phone,consent:true};
}
