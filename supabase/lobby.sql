-- Shared lobby. Run only on the Trilha project. Existing Lapa/catalog data is preserved.
create schema if not exists trilha_private;
revoke all on schema trilha_private from public, anon, authenticated;
create table public.lobby_servers (
 id text primary key, name text not null, capacity integer not null default 50 check(capacity between 2 and 80),
 enabled boolean not null default true
);
insert into public.lobby_servers(id,name) values
 ('araucaria','Araucária'),('fogueira','Fogueira'),('bussola','Bússola'),('cruzeiro','Cruzeiro do Sul'),
 ('pioneiros','Pioneiros'),('castores','Castores'),('montanha','Montanha'),('nascente','Nascente');
create table public.lobby_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 server_id text not null references public.lobby_servers(id),
 nickname text not null check(char_length(nickname) between 3 and 18),
 avatar text not null check(avatar in ('trilheiro','observadora','guardiao','cartografa','naturalista','pioneiro')),
 club text not null default '' check(char_length(club)<=100),
 last_seen timestamptz not null default now()
);
create index lobby_members_server_seen on public.lobby_members(server_id,last_seen);
create table public.lobby_messages (
 id uuid primary key default gen_random_uuid(), server_id text not null references public.lobby_servers(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 nickname text not null, avatar text not null,
 body text not null check(char_length(body) between 1 and 160), created_at timestamptz not null default now()
);
create index lobby_messages_room_time on public.lobby_messages(server_id,created_at desc);
create index lobby_messages_user_time on public.lobby_messages(user_id,created_at desc);
create table public.lobby_admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table public.lobby_worlds(id text primary key, enabled boolean not null default false);
insert into public.lobby_worlds values('lapa',false);
create table public.lobby_entitlements (
 user_id uuid primary key references auth.users(id) on delete cascade,
 vip boolean not null default false, payment_reference text unique, granted_at timestamptz not null default now()
);
create table public.lobby_reports (
 id uuid primary key default gen_random_uuid(), reporter uuid not null references auth.users(id),
 target uuid not null references auth.users(id), server_id text not null references public.lobby_servers(id),
 reason text not null check(char_length(reason) between 3 and 300), created_at timestamptz not null default now()
);
alter table public.lobby_servers enable row level security;
alter table public.lobby_members enable row level security;
alter table public.lobby_messages enable row level security;
alter table public.lobby_admins enable row level security;
alter table public.lobby_worlds enable row level security;
alter table public.lobby_entitlements enable row level security;
alter table public.lobby_reports enable row level security;
grant select on public.lobby_servers,public.lobby_members,public.lobby_messages,public.lobby_admins,public.lobby_worlds,public.lobby_entitlements to authenticated;
revoke all on public.lobby_reports from anon,authenticated;
create policy servers_read on public.lobby_servers for select to authenticated using(enabled);
create policy own_admin on public.lobby_admins for select to authenticated using(user_id=(select auth.uid()));
create policy own_entitlement on public.lobby_entitlements for select to authenticated using(user_id=(select auth.uid()));
-- Definer helpers are isolated, have fixed search paths, and always require an authenticated caller.
create function trilha_private.room() returns text language sql stable security definer set search_path='' as $$
 select server_id from public.lobby_members where user_id=auth.uid() and last_seen>now()-interval '60 seconds'
$$;
grant usage on schema trilha_private to authenticated;
revoke all on function trilha_private.room() from public;
grant execute on function trilha_private.room() to authenticated;
create policy room_members_read on public.lobby_members for select to authenticated
 using(server_id=(select trilha_private.room()) and last_seen>now()-interval '60 seconds');
create policy room_chat_read on public.lobby_messages for select to authenticated
 using(server_id=(select trilha_private.room()));
create policy worlds_read on public.lobby_worlds for select to authenticated using(enabled or exists(select 1 from public.lobby_admins where user_id=(select auth.uid())));
create function public.lobby_server_list() returns table(id text,name text,capacity integer,online bigint)
 language sql stable security definer set search_path='' as $$
 select s.id,s.name,s.capacity,count(m.user_id) from public.lobby_servers s
 left join public.lobby_members m on m.server_id=s.id and m.last_seen>now()-interval '60 seconds'
 where s.enabled and auth.uid() is not null group by s.id order by s.name
$$;
create function public.lobby_join(room_id text,display_name text,avatar_id text,club_name text)
 returns void language plpgsql security definer set search_path='' as $$
 declare uid uuid:=auth.uid(); cap integer;
 begin
 if uid is null then raise exception 'Entre para escolher um servidor.'; end if;
 perform pg_advisory_xact_lock(hashtext(uid::text));
 select capacity into cap from public.lobby_servers where id=room_id and enabled for update;
 if cap is null then raise exception 'Servidor indisponível.'; end if;
 if (select count(*) from public.lobby_members where server_id=room_id and user_id<>uid and last_seen>now()-interval '60 seconds')>=cap then raise exception 'Servidor cheio. Escolha outro.'; end if;
 if display_name ~* '(@|https?://|[0-9]{7,})' then raise exception 'Use um apelido sem contato pessoal.'; end if;
 insert into public.lobby_members(user_id,server_id,nickname,avatar,club,last_seen)
 values(uid,room_id,btrim(display_name),avatar_id,left(club_name,100),now())
 on conflict(user_id) do update set server_id=excluded.server_id,nickname=excluded.nickname,avatar=excluded.avatar,club=excluded.club,last_seen=now();
 end $$;
create function public.lobby_heartbeat() returns void language sql security definer set search_path='' as $$
 update public.lobby_members set last_seen=now() where user_id=auth.uid()
$$;
create function public.lobby_leave() returns void language sql security definer set search_path='' as $$
 delete from public.lobby_members where user_id=auth.uid()
$$;
create function public.lobby_say(message text) returns void language plpgsql security definer set search_path='' as $$
 declare member public.lobby_members;
 begin
 if auth.uid() is null then raise exception 'Entre novamente.'; end if;
 select * into member from public.lobby_members where user_id=auth.uid() and last_seen>now()-interval '60 seconds' for update;
 if member.user_id is null then raise exception 'Escolha um servidor.'; end if;
 if exists(select 1 from public.lobby_messages where user_id=auth.uid() and created_at>now()-interval '8 seconds') then raise exception 'Aguarde 8 segundos entre mensagens.'; end if;
 if message ~* '(@|https?://|[0-9][0-9 ()+.-]{6,}[0-9])' then raise exception 'Não compartilhe contatos ou links.'; end if;
 insert into public.lobby_messages(server_id,user_id,nickname,avatar,body) values(member.server_id,member.user_id,member.nickname,member.avatar,btrim(message));
 end $$;
create function public.lobby_report(target_id uuid,reason_text text) returns void language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null or trilha_private.room() is null then raise exception 'Entre no servidor.'; end if;
 if not exists(select 1 from public.lobby_members where user_id=target_id and server_id=trilha_private.room()) then raise exception 'Jogador fora do servidor.'; end if;
 if exists(select 1 from public.lobby_reports where reporter=auth.uid() and created_at>now()-interval '1 minute') then raise exception 'Aguarde antes de enviar outra denúncia.'; end if;
 insert into public.lobby_reports(reporter,target,server_id,reason) values(auth.uid(),target_id,trilha_private.room(),reason_text);
 end $$;
create function public.lobby_set_lapa(is_enabled boolean) returns void language plpgsql security definer set search_path='' as $$
 begin
 if not exists(select 1 from public.lobby_admins where user_id=auth.uid()) then raise exception 'Acesso restrito à administração.'; end if;
 update public.lobby_worlds set enabled=is_enabled where id='lapa';
 end $$;
revoke all on function public.lobby_server_list(),public.lobby_join(text,text,text,text),public.lobby_heartbeat(),public.lobby_leave(),public.lobby_say(text),public.lobby_report(uuid,text),public.lobby_set_lapa(boolean) from public,anon;
grant execute on function public.lobby_server_list(),public.lobby_join(text,text,text,text),public.lobby_heartbeat(),public.lobby_leave(),public.lobby_say(text),public.lobby_report(uuid,text),public.lobby_set_lapa(boolean) to authenticated;
create policy lobby_presence_read on realtime.messages for select to authenticated
 using(extension='presence' and realtime.topic()='lobby:'||(select trilha_private.room()));
create policy lobby_presence_write on realtime.messages for insert to authenticated
 with check(extension='presence' and realtime.topic()='lobby:'||(select trilha_private.room()));
alter publication supabase_realtime add table public.lobby_messages;
-- VIP entitlements and admin roles have no client write grants or policies.
