create index if not exists saved_items_trail_id_idx
  on public.saved_items(trail_id)
  where trail_id is not null;

create index if not exists saved_items_observation_id_idx
  on public.saved_items(observation_id)
  where observation_id is not null;

create index if not exists saved_items_risk_id_idx
  on public.saved_items(risk_id)
  where risk_id is not null;
