-- Explorer 4.2.2 candidate: restrict privileged social functions.
-- Data-safe: permission-only migration; no row or schema mutations.

begin;

revoke execute on function public.get_or_create_conversation(uuid) from public, anon;
revoke execute on function public.is_conversation_participant(uuid) from public, anon;

revoke execute on function public.notify_comment_event() from public, anon, authenticated;
revoke execute on function public.notify_follow_event() from public, anon, authenticated;
revoke execute on function public.notify_like_event() from public, anon, authenticated;
revoke execute on function public.notify_message_event() from public, anon, authenticated;

grant execute on function public.get_or_create_conversation(uuid) to authenticated, service_role;
grant execute on function public.is_conversation_participant(uuid) to authenticated, service_role;

commit;
