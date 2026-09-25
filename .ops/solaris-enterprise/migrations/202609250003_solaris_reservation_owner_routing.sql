create or replace function public.submit_solaris_lot_request(p_submission jsonb,p_fingerprint text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 cfg private.crm_public_forms%rowtype;
 unit_row public.crm_inventory_units%rowtype;
 prior private.solaris_lot_requests%rowtype;
 request_id uuid; person text; phone_number text; selected_id text; payload_key text;
 lead_id uuid; contact_key uuid; detail text; rate_key text; counter integer;
 owner_key uuid; now_value timestamptz:=now();
begin
 if current_user not in ('postgres','service_role','supabase_admin') then raise exception 'RESERVE_FORBIDDEN';end if;
 if jsonb_typeof(p_submission) is distinct from 'object' or pg_column_size(p_submission)>2048
 or p_submission->>'requestId' is null or p_submission->>'requestId' !~* '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
 or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'RESERVE_INVALID';end if;
 request_id:=(p_submission->>'requestId')::uuid;
 person:=regexp_replace(trim(p_submission->>'name'),'[[:space:]]+',' ','g');
 phone_number:=p_submission->>'phone';selected_id:=p_submission->>'id';
 if person is null or length(person) not between 3 and 120 or phone_number is null
 or phone_number !~ '^[+]55[1-9][0-9]9[0-9]{8}$'
 or selected_id is null or selected_id !~ '^lote-[a-j]-(0[1-9]|[1-9][0-9])$'
 or p_submission->'consent' is distinct from 'true'::jsonb then raise exception 'RESERVE_INVALID';end if;
 select * into cfg from private.crm_public_forms where slug='solaris-futura-casa' and active;
 if not found then raise exception 'RESERVE_UNAVAILABLE';end if;
 payload_key:=md5(lower(person)||'|'||phone_number||'|'||selected_id);
 perform pg_advisory_xact_lock(hashtextextended('solaris-lot-request:'||request_id::text,0));
 select * into prior from private.solaris_lot_requests where id=request_id;
 if found then
  if prior.payload_hash<>payload_key then raise exception 'RESERVE_ID_CONFLICT';end if;
  return jsonb_build_object('requestId',prior.id,'protocol','SOL-'||upper(left(replace(prior.id::text,'-',''),10)),'duplicate',true);
 end if;
 -- Every successful request is rechecked against current inventory. It does not block the lot.
 select u.* into unit_row from public.crm_inventory_units u
 join public.crm_products product on product.id=u.product_id and product.organization_id=u.organization_id
 where u.organization_id=cfg.organization_id and u.project_id=cfg.project_id and product.code='LOTES_RESIDENCIAIS'
 and u.active and 'lote-'||lower(u.block_code)||'-'||lpad(u.lot_number,2,'0')=selected_id for update of u;
 if not found or selected_id='lote-c-18' then raise exception 'RESERVE_LOT_UNAVAILABLE';end if;
 perform pg_advisory_xact_lock(hashtextextended('solaris-lot-payload:'||payload_key,0));
 select * into prior from private.solaris_lot_requests where payload_hash=payload_key and created_at>now_value-interval '1 day' order by created_at desc limit 1;
 if found then return jsonb_build_object('requestId',prior.id,'protocol','SOL-'||upper(left(replace(prior.id::text,'-',''),10)),'duplicate',true);end if;
 if unit_row.status<>'disponivel' or exists(select 1 from public.crm_unit_reservations r where r.unit_id=unit_row.id and r.status='ativa' and (r.starts_at is null or r.starts_at<=now_value) and (r.expires_at is null or r.expires_at>now_value)) then raise exception 'RESERVE_LOT_UNAVAILABLE';end if;
 delete from private.crm_public_form_limits where expires_at<now_value;
 foreach rate_key in array array['solaris-lot:ip:'||p_fingerprint,'solaris-lot:phone:'||md5(phone_number)||':'||to_char(now_value,'YYYY-MM-DD-HH24'),'solaris-lot:all:'||to_char(now_value,'YYYY-MM-DD-HH24')] loop
  insert into private.crm_public_form_limits(key,count,expires_at) values(rate_key,1,now_value+interval '2 hours')
  on conflict(key) do update set count=private.crm_public_form_limits.count+1 returning count into counter;
  if counter>(case when rate_key like 'solaris-lot:all:%' then 500 when rate_key like 'solaris-lot:phone:%' then 3 else 20 end) then raise exception 'RESERVE_RATE_LIMIT';end if;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended(cfg.organization_id::text||':solaris-reserve:'||phone_number||':'||lower(person),0));
 select id,contact_id into lead_id,contact_key from public.crm_records
 where organization_id=cfg.organization_id and project_id=cfg.project_id and record_status='aberta'
 and lower(trim(person_name))=lower(person) and regexp_replace(phone,'[^0-9]','','g') in(substring(phone_number from 2),substring(phone_number from 4)) order by created_at desc,id limit 1;
 detail:='Solicitação de reserva pelo Solaris Imersivo. Lote '||unit_row.lot_number||' / Quadra '||unit_row.block_code||' ('||unit_row.unit_code||'), área '||round(unit_row.area,2)||' m². Protocolo SOL-'||upper(left(replace(request_id::text,'-',''),10))||'. Aguardando atendimento e confirmação comercial; não há bloqueio automático. Contato por WhatsApp sobre este lote autorizado no envio (solaris-reserva-v1).';
 if lead_id is null then
  select id into contact_key from public.contacts where organization_id=cfg.organization_id and active and lower(trim(name))=lower(person) and regexp_replace(phone,'[^0-9]','','g') in(substring(phone_number from 2),substring(phone_number from 4)) order by created_at desc,id limit 1;
  if contact_key is null then
   insert into public.contacts(organization_id,contact_type,name,phone,preferred_channel,data_processing_basis,notes)
   values(cfg.organization_id,'prospect',person,phone_number,'whatsapp','consent',detail) returning id into contact_key;
  end if;
  insert into public.crm_records(organization_id,contact_id,person_name,phone,project_id,pipeline_id,stage_id,stage,record_status,source,source_channel,lead_source_id,notes,tags,preferred_city,landing_page)
  values(cfg.organization_id,contact_key,person,phone_number,cfg.project_id,cfg.pipeline_id,cfg.stage_id,'novo','aberta','Solaris Imersivo — Solicitação de reserva','web_form',cfg.lead_source_id,detail,array['solaris_imersivo','reserva_solicitada','solaris',unit_row.unit_code],'Monte Carmelo','https://solaris-imersivo.vercel.app/#'||selected_id) returning id into lead_id;
 else
  update public.crm_records set notes=concat_ws(E'\n\n',nullif(notes,''),detail),tags=array(select distinct unnest(coalesce(tags,'{}'::text[])||array['solaris_imersivo','reserva_solicitada',unit_row.unit_code])),updated_at=now_value where id=lead_id;
 end if;
 select coalesce(sdr_user_id,broker_user_id) into owner_key from public.crm_records where id=lead_id;
 insert into public.crm_alerts(organization_id,crm_record_id,alert_type,severity,title,message,assigned_to,due_at,status)
 values(cfg.organization_id,lead_id,'solaris_reserva:'||left(request_id::text,8),'alta','Solicitação de reserva — '||unit_row.unit_code,detail,owner_key,now_value+interval '2 hours','aberto');
 insert into private.solaris_lot_requests(id,unit_id,crm_record_id,payload_hash) values(request_id,unit_row.id,lead_id,payload_key);
 return jsonb_build_object('requestId',request_id,'protocol','SOL-'||upper(left(replace(request_id::text,'-',''),10)),'duplicate',false);
end;
$$;
revoke all on function public.submit_solaris_lot_request(jsonb,text) from public,anon,authenticated;
grant execute on function public.submit_solaris_lot_request(jsonb,text) to service_role;
