-- Public narration uses the existing Bia voice. No changes to CRM inventory or RLS.
create table if not exists public.solaris_audio_usage (
  scope text not null,
  window_at timestamptz not null,
  requests integer not null default 0 check (requests >= 0),
  primary key (scope, window_at)
);
create index if not exists solaris_audio_usage_window_idx on public.solaris_audio_usage(window_at);
alter table public.solaris_audio_usage enable row level security;
revoke all on public.solaris_audio_usage from public, anon, authenticated;
grant select, insert, update, delete on public.solaris_audio_usage to service_role;

create or replace function public.solaris_audio_consume(p_client_hash text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  if p_client_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  delete from public.solaris_audio_usage where window_at < now() - interval '2 days';
  insert into public.solaris_audio_usage as usage(scope,window_at,requests)
    values ('client:'||p_client_hash,date_trunc('minute',now()),1)
    on conflict(scope,window_at) do update set requests=usage.requests+1
      where usage.requests < 12 returning requests into n;
  if n is null then return false; end if;
  n := null;
  insert into public.solaris_audio_usage as usage(scope,window_at,requests)
    values ('global',date_trunc('day',now()),1)
    on conflict(scope,window_at) do update set requests=usage.requests+1
      where usage.requests < 800 returning requests into n;
  return n is not null;
end;
$$;
revoke all on function public.solaris_audio_consume(text) from public, anon, authenticated;
grant execute on function public.solaris_audio_consume(text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('solaris-narration','solaris-narration',false,3000000,array['audio/mpeg'])
on conflict(id) do nothing;

comment on table public.solaris_audio_usage is 'Service-only counters for bounded public Solaris narration; no contact or customer information.';
