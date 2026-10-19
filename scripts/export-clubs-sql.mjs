import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export async function exportClubsSql(clubs) {
  const palette = ['#c26c48', '#d5a841', '#647da8', '#628f78', '#a8789b', '#587f9e']
  const quoted = value => `'${value.replaceAll("'", "''")}'`
  const values = clubs.map(club => `  (${quoted(club.id)}, ${quoted(club.name)}, ${quoted(palette[Number(club.id.slice(4)) % palette.length])})`)
  await fs.writeFile('supabase/real-clubs.sql', `-- Snapshot from the public DSA Brazil > Paraná > city selectors, 2026-10-19.\n-- Only Desbravadores club names/IDs. Regenerate with: node scripts/import-dsa-clubs.mjs\ninsert into public.clubs (id, name, color) values\n${values.join(',\n')}\non conflict (id) do update set name = excluded.name, color = excluded.color;\n\n-- Retire only known, locally seeded demo clubs with no profile references.\ndelete from public.clubs where id in ('horizonte','ipe','constelacao')\n  and not exists (select 1 from public.profiles where profiles.club_id = clubs.id);\n`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await exportClubsSql(JSON.parse(await fs.readFile('src/data/parana-clubs.json', 'utf8')))
}
