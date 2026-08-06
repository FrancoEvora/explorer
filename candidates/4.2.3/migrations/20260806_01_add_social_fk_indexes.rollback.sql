-- Rollback Explorer 4.2.3 social foreign-key indexes.

begin;

drop index if exists public.conversation_participants_user_id_idx;
drop index if exists public.messages_sender_id_idx;
drop index if exists public.notifications_actor_id_idx;
drop index if exists public.client_error_events_user_id_idx;
drop index if exists public.risk_confirmations_user_id_idx;

commit;
