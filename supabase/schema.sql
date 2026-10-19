-- Initial database schema for Trilha Campori.
-- Demo catalog data is intentionally not seeded here; replace it with event-approved data.
-- Client roles receive no access until authentication and server-side game rules are implemented.

create table public.editions (
  id text primary key check (id in ('preview', 'alpha', 'omega')),
  label text not null,
  short_label text not null,
  description text not null default '',
  accent_color text not null check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now()
);

create table public.clubs (
  id text primary key,
  name text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 3 and 18),
  avatar_id text not null,
  club_id text references public.clubs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_nickname_lower_unique
  on public.profiles (lower(nickname));

create index profiles_club_id_idx
  on public.profiles (club_id);

create table public.rewards (
  id text primary key,
  edition_id text not null references public.editions (id) on delete restrict,
  name text not null,
  description text not null default '',
  category text not null,
  rarity text not null check (rarity in ('Comum', 'Incomum', 'Raro')),
  points integer not null check (points >= 0),
  max_claims integer not null check (max_claims > 0),
  map_x numeric(5,2) not null check (map_x between 0 and 100),
  map_y numeric(5,2) not null check (map_y between 0 and 100),
  icon text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, edition_id)
);

create index rewards_edition_active_idx
  on public.rewards (edition_id, active);

create table public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  reward_id text not null,
  edition_id text not null,
  points_awarded integer not null check (points_awarded >= 0),
  claimed_at timestamptz not null default now(),
  foreign key (reward_id, edition_id)
    references public.rewards (id, edition_id) on delete restrict,
  unique (user_id, reward_id)
);

create index reward_claims_user_edition_idx
  on public.reward_claims (user_id, edition_id, claimed_at desc);

create index reward_claims_reward_idx
  on public.reward_claims (reward_id, edition_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (user_id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 160),
  created_at timestamptz not null default now()
);

create index chat_messages_created_at_idx
  on public.chat_messages (created_at desc);

create index chat_messages_sender_id_idx
  on public.chat_messages (sender_id);

create table public.cosmetics (
  id text primary key,
  name text not null,
  description text not null default '',
  price_minor integer not null check (price_minor >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  icon text not null,
  item_type text not null check (item_type in ('Acessório', 'Visual')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_cosmetics (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  cosmetic_id text not null references public.cosmetics (id) on delete restrict,
  acquired_at timestamptz not null default now(),
  primary key (user_id, cosmetic_id)
);

create index user_cosmetics_cosmetic_id_idx
  on public.user_cosmetics (cosmetic_id);

alter table public.editions enable row level security;
alter table public.clubs enable row level security;
alter table public.profiles enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_claims enable row level security;
alter table public.chat_messages enable row level security;
alter table public.cosmetics enable row level security;
alter table public.user_cosmetics enable row level security;

revoke all privileges on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;
