-- Public read-only catalog. Player data stays inaccessible through the Data API.
grant select on public.editions, public.clubs, public.rewards, public.cosmetics to anon, authenticated;

create policy editions_catalog_read on public.editions for select to anon, authenticated using (true);
create policy clubs_catalog_read on public.clubs for select to anon, authenticated using (true);
create policy rewards_catalog_read on public.rewards for select to anon, authenticated using (active = true);
create policy cosmetics_catalog_read on public.cosmetics for select to anon, authenticated using (active = true);
