// One-time, rate-limited import of public club names from the directory's own state/city selectors.
// No member names, addresses or private contact details are collected.
import fs from 'node:fs/promises'
import { exportClubsSql } from './export-clubs-sql.mjs'

const origin = 'https://clubes.adventistas.org'
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function post(path, body) {
  const response = await fetch(`${origin}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  return response.text()
}
function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#039;/g, "'").replace(/&nbsp;/g, ' ').trim()
}
function options(html) {
  return [...html.matchAll(/<option\s+value\s*=\s*['"]?(\d+)['"]?\s*>([^<]*)<\/option>/gi)]
    .map(([, id, text]) => ({ id, text: decode(text) }))
}
const states = options(await post('/busca_estado.php', { cod_pais: '1' }))
const parana = states.find(state => state.text === 'PARANÁ')
if (!parana) throw new Error('Paraná ausente no diretório')
const cities = options(await post('/busca_cidade.php', { cod_estado: parana.id })).filter(city => city.id !== '0')
console.log(`${cities.length} cidades no filtro oficial do Paraná`)
const clubs = []
for (let i = 0; i < cities.length; i++) {
  const city = cities[i]
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const items = options(await post('/busca_clube.php', { cod_cidade: city.id }))
      for (const item of items) {
        if (!item.text.startsWith('DESBRAVADORES | ')) continue
        const full = item.text.slice('DESBRAVADORES | '.length)
        const name = full.replace(/ - (?:ASSOCIAÇÃO|MISSÃO|UNIÃO)\b.*$/i, '').trim()
        if (name) clubs.push({ id: `dsa-${item.id}`, name, city: city.text, cityId: city.id })
      }
      break
    } catch (error) {
      if (attempt === 2) throw new Error(`${city.text}: ${error.message}`)
      await wait(1500 * (attempt + 1))
    }
  }
  if ((i + 1) % 20 === 0) console.log(`${i + 1}/${cities.length} cidades, ${clubs.length} clubes de Desbravadores`)
  await wait(550)
}
clubs.sort((a, b) => a.city.localeCompare(b.city, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'))
if (!clubs.some(club => club.city === 'LAPA' && club.name === 'EXCELÊNCIA DA CRIAÇÃO')) throw new Error('Clube da Lapa não encontrado; importação cancelada')
if (new Set(clubs.map(club => club.id)).size !== clubs.length) throw new Error('IDs repetidos no diretório')
await fs.mkdir('src/data', { recursive: true })
await fs.writeFile('src/data/parana-clubs.json', JSON.stringify(clubs, null, 2) + '\n')
await exportClubsSql(clubs)
console.log(`Concluído: ${clubs.length} clubes de Desbravadores em ${new Set(clubs.map(c => c.city)).size} cidades`)
