import { createClient } from 'npm:@supabase/supabase-js@2.110.7';
import { ORG, PROJECT, PRODUCT, publicUnits, narration } from './core.mjs';
import places from './places.json' with { type: 'json' };

const RELEASE='solaris-enterprise-v1';
const BUCKET='solaris-narration';
const ALLOWED_ORIGINS=new Set(['https://solaris-imersivo.vercel.app','http://localhost:4173']);
function equal(a:string,b:string){let d=a.length^b.length;for(let i=0;i<512;i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0;}
function authorized(req:Request){
  const key=req.headers.get('apikey')||'';
  if(key.length<32||key.length>512||/\s/.test(key))return false;
  try{return Object.values(JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}')).some(v=>typeof v==='string'&&equal(key,v));}catch{return false;}
}
function serviceKey(){try{const value=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;if(value)return value;}catch{}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';}
async function digest(text:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
class PublicError extends Error { constructor(public code:string,public status=503){super(code);} }

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get('origin')||'';
  const headers:Record<string,string>={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-solaris-release':RELEASE,'vary':'Origin'};
  if(ALLOWED_ORIGINS.has(origin))Object.assign(headers,{'access-control-allow-origin':origin,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'apikey, content-type','access-control-max-age':'600'});
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json({error:'ORIGIN_NOT_ALLOWED'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  // Publishable-key authentication matches the Enterprise Bia gateway. No browser secret.
  if(!authorized(req))return json({error:'UNAUTHORIZED'},401);
  try{
    if(Number(req.headers.get('content-length'))>1024)throw new PublicError('INVALID_INPUT',400);
    const raw=await req.text();if(raw.length>1024)throw new PublicError('INVALID_INPUT',400);
    let body;try{body=JSON.parse(raw);}catch{throw new PublicError('INVALID_INPUT',400);}
    if(!body||typeof body!=='object'||!['inventory','speech'].includes(body.action)||Object.keys(body).some(k=>!['action','id'].includes(k)))throw new PublicError('INVALID_INPUT',400);
    if(body.action==='speech'&&(typeof body.id!=='string'||body.id.length>40||!(/^(lote-[a-j]-(?:0[1-9]|[1-9][0-9])|quadra-[a-j])$/.test(body.id)||places.some(p=>p.id===body.id))))throw new PublicError('INVALID_SELECTION',400);
    const admin=createClient(Deno.env.get('SUPABASE_URL')!,serviceKey(),{auth:{persistSession:false,autoRefreshToken:false}});
    const now=new Date().toISOString();
    const [inventory,reservations]=await Promise.all([
      admin.from('crm_inventory_units').select('id,block_code,lot_number,area,status,list_price,price_per_sqm').eq('organization_id',ORG).eq('project_id',PROJECT).eq('product_id',PRODUCT).eq('active',true).limit(500),
      admin.from('crm_unit_reservations').select('unit_id,status,starts_at,expires_at,approval_status').eq('organization_id',ORG).eq('project_id',PROJECT).eq('status','ativa').or(`expires_at.is.null,expires_at.gt.${now}`).limit(1000)
    ]);
    if(inventory.error||reservations.error||!inventory.data?.length||reservations.data?.length===1000)throw new PublicError('INVENTORY_UNAVAILABLE');
    const units=publicUnits(inventory.data,reservations.data||[]);
    if(body.action==='inventory')return json({source:'Évora Enterprise',asOf:now,units});
    const text=narration(body.id,units,places);
    if(!text)throw new PublicError('SELECTION_NOT_FOUND',404);
    const hash=await digest(RELEASE+'-marin-ptbr-'+text), path=hash+'.mp3';
    const storage=admin.storage.from(BUCKET);
    // Signed URLs are returned only for existing, previously generated, approved narration.
    const cached=await storage.createSignedUrl(path,3600);
    if(cached.data?.signedUrl)return json({url:cached.data.signedUrl,text,voice:'Bia',asOf:now});
    const clientHash=await digest((req.headers.get('x-forwarded-for')||req.headers.get('cf-connecting-ip')||'unknown').split(',')[0].trim());
    const quota=await admin.rpc('solaris_audio_consume',{p_client_hash:clientHash});
    if(quota.error||quota.data!==true)throw new PublicError('SPEECH_LIMIT',429);
    const config=await admin.rpc('get_crm_ai_runtime_credentials',{p_organization_id:ORG});
    if(config.error||config.data?.enabled!==true||typeof config.data.api_key!=='string'||config.data.api_key.length<32)throw new PublicError('SPEECH_UNAVAILABLE');
    const result=await fetch('https://api.openai.com/v1/audio/speech',{
      method:'POST',headers:{'authorization':`Bearer ${config.data.api_key}`,'content-type':'application/json'},
      body:JSON.stringify({model:'gpt-4o-mini-tts',voice:'marin',input:text,response_format:'mp3',speed:1.05,instructions:'Você é a Bia, guia do Solaris. Fale em português brasileiro com voz feminina adulta, agradável, natural e acolhedora. Leia fielmente o texto, com dicção clara e ritmo tranquilo. Pronuncie valores e áreas em português. Não acrescente nenhuma informação.'}),
      signal:AbortSignal.any([req.signal,AbortSignal.timeout(45000)])
    });
    if(!result.ok)throw new PublicError('SPEECH_UNAVAILABLE');
    const audio=await result.arrayBuffer();
    if(audio.byteLength<100||audio.byteLength>3000000)throw new PublicError('SPEECH_UNAVAILABLE');
    const uploaded=await storage.upload(path,audio,{contentType:'audio/mpeg',cacheControl:'31536000',upsert:false});
    if(uploaded.error&&!String(uploaded.error.message).includes('already exists'))throw new PublicError('SPEECH_UNAVAILABLE');
    const signed=await storage.createSignedUrl(path,3600);
    if(!signed.data?.signedUrl)throw new PublicError('SPEECH_UNAVAILABLE');
    return json({url:signed.data.signedUrl,text,voice:'Bia',asOf:now});
  }catch(error){
    const status=error instanceof PublicError?error.status:503;
    const code=error instanceof PublicError?error.code:'SERVICE_UNAVAILABLE';
    // Never log provider bodies, credentials or private inventory fields.
    console.error('solaris-experience',{code,status});
    return json({error:code},status);
  }
});
