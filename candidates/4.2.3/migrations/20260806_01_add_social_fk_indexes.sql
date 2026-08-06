-- Explorer 4.2.3 candidate: covering indexes for critical social foreign keys.
-- Data-safe and idempotent: creates indexes only; no row changes.

begin;

create index if not exists conversation_participants_user_id_idx
  on public.conversation_participants (user_id);

create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

create index if not exists notifications_actor_id_idx
  on public.notifications (actor_id);

create index if not exists client_error_events_user_id_idx
  on public.client_error_events (user_id);

create index if not exists risk_confirmations_user_id_idx
  on public.risk_confirmations (user_id);

commit;
