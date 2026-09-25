import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {publicUnits,narration,validateReservation} from '../functions/solaris-experience/core.mjs';
const row={id:'internal-id',block_code:'A',lot_number:'04',area:'469.53',status:'disponivel',list_price:'586912.50',price_per_sqm:'1250',minimum_price:1,strategic_reason:'private',customer_name:'private'};
test('canonical IDs and exact Enterprise prices; no private fields',()=>{
 const [u]=publicUnits([row],[]);
 assert.deepEqual(u,{id:'lote-a-04',block:'A',number:4,status:'disponivel',area:469.53,price:586912.5,pricePerSqm:1250});
});
test('sold, blocked, unknown and institutional lots never expose a price',()=>{
 for(const status of ['vendido','bloqueio_estrategico','bloqueio_comercial','unknown']){
  const [u]=publicUnits([{...row,status}],[]);assert.equal(u.price,null);assert.equal(u.pricePerSqm,null);
 }
 const [u]=publicUnits([{...row,block_code:'C',lot_number:'18'}],[]);assert.equal(u.status,'institucional');assert.equal(u.price,null);
});
test('current reservation overrides availability; expired/rejected/future do not',()=>{
 const now=Date.parse('2026-09-25T12:00:00Z');
 const reservation={unit_id:row.id,status:'ativa',starts_at:'2026-09-25T10:00:00Z',expires_at:'2026-09-25T14:00:00Z',approval_status:'approved'};
 const [u]=publicUnits([row],[reservation],now);assert.equal(u.status,'reservado');assert.equal(u.price,null);
 for(const patch of [{expires_at:'2026-09-25T11:00:00Z'},{approval_status:'rejected'},{starts_at:'2026-09-26T10:00:00Z'},{status:'expirada'}])assert.equal(publicUnits([row],[{...reservation,...patch}],now)[0].status,'disponivel');
});
test('inconsistent identifiers fail closed and missing price is not invented',()=>{
 assert.throws(()=>publicUnits([row,row],[]),/DUPLICATE/);
 assert.throws(()=>publicUnits([{...row,block_code:'other-project'}],[]),/INVALID/);
 assert.equal(publicUnits([{...row,list_price:null}],[])[0].price,null);
});
test('narration accepts only an existing selection and reads public values',()=>{
 const units=publicUnits([row],[]),text=narration('lote-a-04',units,[]);
 assert.match(text,/Lote 4, quadra A/);assert.match(text,/469,53/);assert.match(text,/Lote residencial/);assert.doesNotMatch(text,/586\.912|Preço|R\$/);
 assert.equal(narration('arbitrary customer text',units,[]),null);
 assert.equal(narration('lote-a-90',units,[]),null);
 const sold=publicUnits([{...row,status:'vendido'}],[]);assert.doesNotMatch(narration('lote-a-04',sold,[]),/586|Preço/);
});
test('reservation accepts only a known ID shape, valid mobile, consent and UUID',()=>{
 const valid={id:'lote-b-23',requestId:'23456789-abcd-4abc-8abc-123456789012',name:'  Nome de Teste  ',phone:'(34) 99000-0001',consent:true,website:''};
 assert.deepEqual(validateReservation(valid),{id:valid.id,requestId:valid.requestId,name:'Nome de Teste',phone:'+5534990000001',consent:true});
 for(const change of [{phone:'123'},{phone:'(00) 99999-9999'},{consent:false},{name:' '},{website:'spam'},{id:'lote-z-01'},{requestId:'gggggggg-abcd-4abc-8abc-123456789012'}])assert.equal(validateReservation({...valid,...change}),null);
});
test('all 249 server identifiers match the actual map, including zero padding',()=>{
 const context={};vm.createContext(context);
 const source=process.env.SOLARIS_SOURCE?process.env.SOLARIS_SOURCE+'/lots-data.js':new URL('../../../solaris/lots-data.js',import.meta.url);
 vm.runInContext(fs.readFileSync(source,'utf8')+';this.lots=lots',context);
 const rows=Array.from(context.lots,p=>({...row,id:p.id,block_code:p.block,lot_number:p.n}));
 assert.equal(rows.length,249);
 assert.deepEqual(publicUnits(rows,[]).map(u=>u.id).sort(),Array.from(context.lots,p=>p.id).sort());
});
