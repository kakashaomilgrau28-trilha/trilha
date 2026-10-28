-- VIP was removed from the game at the owner's request on 2026-10-28.
-- Retire legacy rooms without deleting accounts, entitlements or progress.
-- lobby_join already rejects rooms whose enabled flag is false.
update public.lobby_servers set enabled = false where id like 'vip-%';
