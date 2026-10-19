import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { clubs, cosmetics, editions, rewards } from './gameData'
import { realClubs } from './realClubs'
import { worldLocations } from './world/locations'
import { supabase } from './lib/supabase'
import type { Club, CosmeticProduct, Edition, EditionId, Reward } from './model'
import './catalog.css'

interface Catalog {
  clubs: Club[]
  cosmetics: CosmeticProduct[]
  editions: Edition[]
  rewards: Reward[]
}

interface CatalogContext extends Catalog {
  source: 'supabase' | 'demo'
  refresh: () => void
}

const demoCatalog: Catalog = { clubs, cosmetics, editions, rewards }
const CatalogContext = createContext<CatalogContext | null>(null)

function editionId(value: string): EditionId {
  if (value !== 'preview' && value !== 'alpha' && value !== 'omega') throw new Error('Edição inválida no catálogo.')
  return value
}

async function fetchCatalog(signal: AbortSignal): Promise<Catalog> {
  if (!supabase) throw new Error('Configuração do Supabase ausente.')
  const [editionResult, rewardResult, cosmeticResult] = await Promise.all([
    supabase.from('editions').select('id,label,short_label,description,accent_color').abortSignal(signal),
    supabase.from('rewards').select('id,edition_id,name,description,category,rarity,points,max_claims,map_x,map_y,icon').eq('active', true).order('id').abortSignal(signal),
    supabase.from('cosmetics').select('id,name,description,price_minor,currency_code,icon,item_type').eq('active', true).order('id').abortSignal(signal),
  ])
  for (const result of [editionResult, rewardResult, cosmeticResult]) {
    if (result.error) throw result.error
  }
  if (!editionResult.data?.length || !rewardResult.data?.length) {
    throw new Error('Catálogo incompleto.')
  }
  const editionOrder: EditionId[] = ['preview', 'alpha', 'omega']
  const mappedEditions = editionResult.data.map((row): Edition => ({
    id: editionId(row.id), label: row.label, shortLabel: row.short_label,
    description: row.description, accent: row.accent_color,
  })).sort((a, b) => editionOrder.indexOf(a.id) - editionOrder.indexOf(b.id))
  return {
    editions: mappedEditions,
    clubs: realClubs,
    rewards: rewardResult.data.map((row): Reward => {
      if (!['Comum', 'Incomum', 'Raro'].includes(row.rarity)) throw new Error('Raridade inválida.')
      return {
        id: row.id, edition: editionId(row.edition_id), name: row.name, description: row.description,
        category: row.category, rarity: row.rarity as Reward['rarity'], points: row.points,
        limit: row.max_claims, x: worldLocations[row.id]?.[0] ?? row.map_x, y: worldLocations[row.id]?.[1] ?? row.map_y, icon: row.icon,
      }
    }),
    cosmetics: (cosmeticResult.data ?? []).map((row): CosmeticProduct => {
      if (row.currency_code !== 'BRL' || !['Acessório', 'Visual'].includes(row.item_type)) throw new Error('Cosmético inválido.')
      return {
        id: row.id, name: row.name, description: row.description, price: row.price_minor / 100,
        icon: row.icon, type: row.item_type as CosmeticProduct['type'],
      }
    }),
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(demoCatalog)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const refresh = () => setAttempt((value) => value + 1)

  useEffect(() => {
    if (!supabase && !import.meta.env.PROD) { setStatus('ready'); return }
    let cancelled = false
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 15000)
    setStatus('loading')
    fetchCatalog(controller.signal).then((data) => {
      if (!cancelled) { setCatalog(data); setStatus('ready') }
    }).catch((error: unknown) => {
      if (!cancelled) { console.error('Falha ao carregar catálogo:', error); setStatus('error') }
    }).finally(() => window.clearTimeout(timer))
    return () => { cancelled = true; window.clearTimeout(timer); controller.abort() }
  }, [attempt])

  if (status !== 'ready') return (
    <main className="catalog-state" aria-busy={status === 'loading'}>
      <div className="catalog-state-card" role={status === 'error' ? 'alert' : 'status'}>
        <span className="catalog-mark" aria-hidden="true">🧭</span>
        <h1>{status === 'loading' ? 'Preparando sua trilha…' : 'O espaço está temporariamente indisponível.'}</h1>
        <p>{status === 'loading' ? 'Carregando as edições e recompensas.' : 'Não foi possível carregar o catálogo. Confira sua conexão e tente novamente.'}</p>
        {status === 'error' && <button className="primary-button" onClick={refresh}>Tentar novamente</button>}
      </div>
    </main>
  )
  return <CatalogContext.Provider value={{ ...catalog, source: supabase ? 'supabase' : 'demo', refresh }}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('O catálogo precisa de um CatalogProvider.')
  return value
}
