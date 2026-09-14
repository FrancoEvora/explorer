-- Explorer 4.2.5
-- Otimiza políticas RLS para evitar reavaliação de auth.uid() por linha.
-- Não altera papéis, comandos, permissões ou predicados de autorização.

begin;

drop policy if exists "client telemetry insert" on public.client_error_events;
create policy "client telemetry insert" on public.client_error_events
for insert to anon, authenticated
with check (
  (((select auth.uid()) is null) and user_id is null)
  or (((select auth.uid()) is not null) and user_id = (select auth.uid()))
);

drop policy if exists participants_update_self on public.conversation_participants;
create policy participants_update_self on public.conversation_participants
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists emergency_contacts_own on public.emergency_contacts;
create policy emergency_contacts_own on public.emergency_contacts
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists map_markers_delete on public.map_markers;
create policy map_markers_delete on public.map_markers
for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists map_markers_insert on public.map_markers;
create policy map_markers_insert on public.map_markers
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists map_markers_update on public.map_markers;
create policy map_markers_update on public.map_markers
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and public.is_conversation_participant(conversation_id)
);

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists risk_confirmations_delete on public.risk_confirmations;
create policy risk_confirmations_delete on public.risk_confirmations
for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists risk_confirmations_insert on public.risk_confirmations;
create policy risk_confirmations_insert on public.risk_confirmations
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists saved_items_own on public.saved_items;
create policy saved_items_own on public.saved_items
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

commit;
