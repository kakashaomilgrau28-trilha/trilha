import directory from './data/parana-clubs.json'

// Snapshot of the official Brazil > Paraná > city selectors, collected 2026-10-19.
// Only public Desbravadores club IDs/names and cities are present.
const colors = ['#c26c48', '#d5a841', '#647da8', '#628f78', '#a8789b', '#587f9e']
export const realClubs = directory.map(club => ({
  ...club,
  color: colors[Number(club.id.slice(4)) % colors.length],
  source: 'https://clubes.adventistas.org/br/',
}))
export const paranaCities = ['LAPA', ...new Set(realClubs.map(club => club.city).filter(city => city !== 'LAPA'))]
