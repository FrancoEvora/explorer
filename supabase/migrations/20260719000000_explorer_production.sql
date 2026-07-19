-- Explorer v1.0 — schema de produção
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trails (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  place text,
  start_notes text,
  start_time timestamptz not null,
  end_time timestamptz,
  distance_meters double precision not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trail_points (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trail_id text not null references public.trails(id) on delete cascade,
  sequence_no integer not null,
  recorded_at timestamptz not null default now(),
  latitude double precision not null,
  longitude double precision not null,
  altitude double precision,
  accuracy double precision,
  speed double precision,
  heading double precision,
  unique (trail_id, sequence_no)
);

create table if not exists public.observations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trail_id text references public.trails(id) on delete set null,
  created_at timestamptz not null,
  type text not null,
  status text,
  species text,
  behavior text,
  habitat text,
  notes text,
  latitude double precision,
  longitude double precision,
  altitude double precision,
  updated_at timestamptz not null default now()
);

create table if not exists public.risks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trail_id text references public.trails(id) on delete set null,
  created_at timestamptz not null,
  type text not null,
  severity text not null,
  notes text,
  latitude double precision,
  longitude double precision,
  altitude double precision,
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  observation_id text references public.observations(id) on delete cascade,
  risk_id text references public.risks(id) on delete cascade,
  kind text not null,
  name text,
  mime_type text,
  size_bytes bigint,
  storage_path text not null,
  camera_model text,
  lens_model text,
  accessory_used text,
  focal_length text,
  shot_settings text,
  note text,
  created_at timestamptz not null default now(),
  constraint media_single_parent check (
    (case when observation_id is null then 0 else 1 end) +
    (case when risk_id is null then 0 else 1 end) <= 1
  )
);

create table if not exists public.equipment (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, category, name)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  planned_return timestamptz,
  emergency_phone text,
  trusted_contacts text,
  medical_info text,
  return_alert_sent_for text,
  updated_at timestamptz not null default now()
);

create table if not exists public.sos_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  altitude double precision,
  battery_percent integer,
  details jsonb not null default '{}'::jsonb
);

create table if not exists public.sync_snapshots (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  app_version text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.current_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_version text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists trails_user_time_idx on public.trails(user_id, start_time desc);
create index if not exists trail_points_trail_seq_idx on public.trail_points(trail_id, sequence_no);
create index if not exists trail_points_user_idx on public.trail_points(user_id);
create index if not exists observations_user_time_idx on public.observations(user_id, created_at desc);
create index if not exists observations_trail_idx on public.observations(trail_id) where trail_id is not null;
create index if not exists risks_user_time_idx on public.risks(user_id, created_at desc);
create index if not exists risks_trail_idx on public.risks(trail_id) where trail_id is not null;
create index if not exists media_user_parent_idx on public.media(user_id, observation_id, risk_id);
create index if not exists media_observation_idx on public.media(observation_id) where observation_id is not null;
create index if not exists media_risk_idx on public.media(risk_id) where risk_id is not null;
create index if not exists sos_events_user_idx on public.sos_events(user_id);
create index if not exists snapshots_user_time_idx on public.sync_snapshots(user_id, created_at desc);

create or replace function public.handle_new_explorer_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(coalesce(new.email, '')) <> 'franco@evoraurbanismo.com.br' then
    raise exception 'Explorer is restricted to its owner';
  end if;
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'Franco'))
  on conflict (id) do nothing;
  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_explorer_user() from public, anon, authenticated;

-- O script de produção também cria triggers updated_at, habilita RLS em todas as
-- tabelas e aplica políticas owner-only usando auth.uid(). Consulte o histórico
-- de migrações do projeto Supabase para a versão operacional aplicada.
