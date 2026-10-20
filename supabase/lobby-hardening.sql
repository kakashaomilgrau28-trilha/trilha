-- Keep elevated implementations out of PostgREST's exposed public schema.
alter function public.lobby_server_list() set schema trilha_private;
alter function public.lobby_join(text,text,text,text) set schema trilha_private;
alter function public.lobby_heartbeat() set schema trilha_private;
alter function public.lobby_leave() set schema trilha_private;
alter function public.lobby_say(text) set schema trilha_private;
alter function public.lobby_report(uuid,text) set schema trilha_private;
alter function public.lobby_set_lapa(boolean) set schema trilha_private;
create function public.lobby_server_list() returns table(id text,name text,capacity integer,online bigint)
 language sql security invoker set search_path='' as $$ select * from trilha_private.lobby_server_list() $$;
create function public.lobby_join(room_id text,display_name text,avatar_id text,club_name text) returns void
 language sql security invoker set search_path='' as $$ select trilha_private.lobby_join(room_id,display_name,avatar_id,club_name) $$;
create function public.lobby_heartbeat() returns void language sql security invoker set search_path='' as $$ select trilha_private.lobby_heartbeat() $$;
create function public.lobby_leave() returns void language sql security invoker set search_path='' as $$ select trilha_private.lobby_leave() $$;
create function public.lobby_say(message text) returns void language sql security invoker set search_path='' as $$ select trilha_private.lobby_say(message) $$;
create function public.lobby_report(target_id uuid,reason_text text) returns void language sql security invoker set search_path='' as $$ select trilha_private.lobby_report(target_id,reason_text) $$;
create function public.lobby_set_lapa(is_enabled boolean) returns void language sql security invoker set search_path='' as $$ select trilha_private.lobby_set_lapa(is_enabled) $$;
revoke all on function public.lobby_server_list(),public.lobby_join(text,text,text,text),public.lobby_heartbeat(),public.lobby_leave(),public.lobby_say(text),public.lobby_report(uuid,text),public.lobby_set_lapa(boolean) from public,anon;
grant execute on function public.lobby_server_list(),public.lobby_join(text,text,text,text),public.lobby_heartbeat(),public.lobby_leave(),public.lobby_say(text),public.lobby_report(uuid,text),public.lobby_set_lapa(boolean) to authenticated;
create table trilha_private.admin_owner(email text primary key);
-- Provision the verified owner email separately in this private allowlist.
revoke all on trilha_private.admin_owner from public,anon,authenticated;
create function trilha_private.activate_admin() returns void language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null then return; end if;
 if exists(select 1 from auth.users u join trilha_private.admin_owner o on lower(o.email)=lower(u.email)
 where u.id=auth.uid() and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,true)) then
 insert into public.lobby_admins(user_id) values(auth.uid()) on conflict do nothing;
 end if;
 end $$;
revoke all on function trilha_private.activate_admin() from public,anon;
grant execute on function trilha_private.activate_admin() to authenticated;
create function public.lobby_activate_admin() returns void language sql security invoker set search_path='' as $$ select trilha_private.activate_admin() $$;
revoke all on function public.lobby_activate_admin() from public,anon;
grant execute on function public.lobby_activate_admin() to authenticated;
alter policy own_admin on public.lobby_admins using(user_id=(select auth.uid()) and not coalesce((auth.jwt()->>'is_anonymous')::boolean,true));
alter policy own_entitlement on public.lobby_entitlements using(user_id=(select auth.uid()) and not coalesce((auth.jwt()->>'is_anonymous')::boolean,true));
grant select on public.lobby_reports to authenticated;
create policy admin_reports_read on public.lobby_reports for select to authenticated using(exists(select 1 from public.lobby_admins where user_id=(select auth.uid())));

