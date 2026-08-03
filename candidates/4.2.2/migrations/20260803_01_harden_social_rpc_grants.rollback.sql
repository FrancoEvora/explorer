-- Rollback to the pre-4.2.2 grants.
begin;
grant execute on function public.get_or_create_conversation(uuid) to public, anon, authenticated, service_role;
grant execute on function public.is_conversation_participant(uuid) to public, anon, authenticated, service_role;
grant execute on function public.notify_comment_event() to public, anon, authenticated, service_role;
grant execute on function public.notify_follow_event() to public, anon, authenticated, service_role;
grant execute on function public.notify_like_event() to public, anon, authenticated, service_role;
grant execute on function public.notify_message_event() to public, anon, authenticated, service_role;
commit;
