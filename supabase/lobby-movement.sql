alter policy lobby_presence_read on realtime.messages using(extension in ('presence','broadcast') and realtime.topic()='lobby:'||(select trilha_private.room()));
alter policy lobby_presence_write on realtime.messages with check(extension in ('presence','broadcast') and realtime.topic()='lobby:'||(select trilha_private.room()));
create or replace function trilha_private.lobby_heartbeat() returns void language plpgsql security definer set search_path='' as $$
 begin
 update public.lobby_members set last_seen=now() where user_id=auth.uid() and last_seen>now()-interval '60 seconds';
 if not found then raise exception 'Sessão expirada. Entre novamente no servidor.'; end if;
 end $$;
