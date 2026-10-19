-- Public names verified on 2026-10-19; original directory URLs in src/realClubs.ts.
-- New IDs preserve old demo associations without attributing them to real clubs.
insert into public.clubs (id, name, color) values
  ('dsa-1897', 'CARATUVA', '#c26c48'),
  ('dsa-1224', 'Escudeiros do Rei', '#d5a841'),
  ('dsa-1790', 'Shekinah', '#647da8')
on conflict (id) do update set name = excluded.name, color = excluded.color;
