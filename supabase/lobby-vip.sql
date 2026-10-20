insert into public.lobby_servers(id,name,capacity)
 select 'vip-'||id,'Refúgio VIP · '||name,25 from public.lobby_servers where id not like 'vip-%';
create or replace function trilha_private.lobby_server_list() returns table(id text,name text,capacity integer,online bigint)
 language sql stable security definer set search_path='' as $$
 select s.id,s.name,s.capacity,count(m.user_id) from public.lobby_servers s
 left join public.lobby_members m on m.server_id=s.id and m.last_seen>now()-interval '60 seconds'
 where s.enabled and s.id not like 'vip-%' and auth.uid() is not null group by s.id order by s.name
$$;
create or replace function trilha_private.lobby_join(room_id text,display_name text,avatar_id text,club_name text)
 returns void language plpgsql security definer set search_path='' as $$
 declare uid uuid:=auth.uid(); cap integer;
 begin
 if uid is null then raise exception 'Entre para escolher um servidor.'; end if;
 if room_id like 'vip-%' and not exists(select 1 from public.lobby_entitlements where user_id=uid and vip)
 then raise exception 'Este refúgio exige um acesso VIP confirmado pelo servidor.'; end if;
 perform pg_advisory_xact_lock(hashtext(uid::text));
 select capacity into cap from public.lobby_servers where id=room_id and enabled for update;
 if cap is null then raise exception 'Servidor indisponível.'; end if;
 if (select count(*) from public.lobby_members where server_id=room_id and user_id<>uid and last_seen>now()-interval '60 seconds')>=cap then raise exception 'Servidor cheio. Escolha outro.'; end if;
 if display_name ~* '(@|https?://|[0-9]{7,})' then raise exception 'Use um apelido sem contato pessoal.'; end if;
 insert into public.lobby_members(user_id,server_id,nickname,avatar,club,last_seen)
 values(uid,room_id,btrim(display_name),avatar_id,left(club_name,100),now())
 on conflict(user_id) do update set server_id=excluded.server_id,nickname=excluded.nickname,avatar=excluded.avatar,club=excluded.club,last_seen=now();
 end $$;
