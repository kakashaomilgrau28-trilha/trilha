import assert from 'node:assert/strict'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
assert.ok(url && key, 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.')
const tables = ['editions', 'clubs', 'rewards', 'cosmetics']
const data = Object.fromEntries(await Promise.all(tables.map(async (table) => {
  const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: { apikey: key }, signal: AbortSignal.timeout(15000),
  })
  assert.equal(response.status, 200, `Leitura pública falhou: ${table} (${response.status}).`)
  const rows = await response.json()
  assert.ok(Array.isArray(rows) && rows.length > 0, `Catálogo vazio: ${table}.`)
  return [table, rows]
})))

const editionIds = new Set(data.editions.map((edition) => edition.id))
assert.ok(data.rewards.every((reward) => editionIds.has(reward.edition_id)), 'Recompensa com edição inexistente.')
assert.ok(data.rewards.every((reward) => reward.active && reward.points >= 0), 'Recompensa pública inválida.')

for (const table of ['profiles', 'reward_claims', 'chat_messages', 'user_cosmetics']) {
  const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: key }, signal: AbortSignal.timeout(15000),
  })
  assert.ok([401, 403].includes(response.status), `Dados privados acessíveis: ${table} (${response.status}).`)
}
console.log('Supabase OK: catálogo público disponível; dados dos jogadores protegidos.')
console.log(Object.fromEntries(tables.map((table) => [table, data[table].length])))
