import { realClubs } from './realClubs'
import { worldLocations } from './world/locations'
import type { ChatMessage, Club, CosmeticProduct, Edition, EditionId, Player, Reward } from './model'

export const DEMO_MODE = true
export const DEMO_MAP_LABEL = 'Vale das Araucárias · mapa virtual de demonstração'

export const editions: Edition[] = [
  { id: 'preview', label: 'Prévia', shortLabel: 'PRÉVIA', description: 'Explore sem sair de casa', accent: '#4b7961' },
  { id: 'alpha', label: 'Edição Alpha', shortLabel: 'ALPHA', description: 'Espaço demonstrativo Alpha', accent: '#c4874c' },
  { id: 'omega', label: 'Edição Ômega', shortLabel: 'ÔMEGA', description: 'Espaço demonstrativo Ômega', accent: '#6c76a8' },
]

export const clubs: Club[] = realClubs

export const avatars = [
  { id: 'trilheiro', label: 'Trilheiro', emoji: '🧭', color: '#d59156' },
  { id: 'observadora', label: 'Observadora', emoji: '🔭', color: '#71889a' },
  { id: 'guardiao', label: 'Guardião', emoji: '🌿', color: '#659276' },
  { id: 'cartografa', label: 'Cartógrafa', emoji: '🗺️', color: '#bc7e75' },
  { id: 'naturalista', label: 'Naturalista', emoji: '🦋', color: '#8f7eae' },
  { id: 'pioneiro', label: 'Pioneiro', emoji: '🏕️', color: '#b18145' },
]

// Posições, nomes e pontos são exclusivamente fictícios e substituíveis.
export const rewards: Reward[] = [
  { id: 'rosa-dos-ventos', name: 'Rosa dos Ventos', description: 'Um emblema para quem segue novos caminhos.', category: 'Emblema', rarity: 'Incomum', points: 30, limit: 1, x: 34, y: 36, edition: 'preview', icon: '🧭' },
  { id: 'folha-de-campo', name: 'Folha de Campo', description: 'Cartão colecionável inspirado na natureza.', category: 'Cartão', rarity: 'Comum', points: 15, limit: 1, x: 69, y: 27, edition: 'preview', icon: '🍃' },
  { id: 'constelacao-do-sul', name: 'Constelação do Sul', description: 'Um distintivo para guardar no seu álbum.', category: 'Distintivo', rarity: 'Raro', points: 50, limit: 1, x: 64, y: 68, edition: 'alpha', icon: '✨' },
  { id: 'trilha-de-pinheiros', name: 'Trilha de Pinheiros', description: 'Uma lembrança ilustrada de exploração.', category: 'Cartão', rarity: 'Comum', points: 20, limit: 1, x: 31, y: 67, edition: 'alpha', icon: '🌲' },
  { id: 'sinal-de-companheirismo', name: 'Sinal de Companheirismo', description: 'Emblema de uma jornada feita em conjunto.', category: 'Emblema', rarity: 'Incomum', points: 35, limit: 1, x: 48, y: 28, edition: 'omega', icon: '🤝' },
  { id: 'cume-dourado', name: 'Cume Dourado', description: 'Cartão especial da edição Ômega.', category: 'Cartão', rarity: 'Raro', points: 55, limit: 1, x: 71, y: 62, edition: 'omega', icon: '⛰️' },
]
for (const reward of rewards) {
  const location = worldLocations[reward.id]
  if (location) [reward.x, reward.y] = location
}

export const players: Player[] = [
  { id: 'player-lua', nickname: 'LuaSerena', avatar: 'observadora', clubId: '', x: 48, y: 49, online: true },
  { id: 'player-caio', nickname: 'CaioTrilha', avatar: 'trilheiro', clubId: '', x: 56, y: 40, online: true },
  { id: 'player-nina', nickname: 'NinaNorte', avatar: 'cartografa', clubId: '', x: 43, y: 62, online: true },
  { id: 'player-sol', nickname: 'SolNascente', avatar: 'naturalista', clubId: '', x: 77, y: 46, online: true },
  { id: 'player-teo', nickname: 'TeoExplora', avatar: 'guardiao', clubId: '', x: 23, y: 43, online: false },
]

export const cosmetics: CosmeticProduct[] = [
  { id: 'lenço-azul', name: 'Lenço azul-marinho', description: 'Um toque de cor para o seu avatar.', price: 4.9, icon: '🧣', type: 'Acessório' },
  { id: 'mochila-campo', name: 'Mochila de campo', description: 'Visual alternativo com bolsos de exploração.', price: 7.9, icon: '🎒', type: 'Acessório' },
  { id: 'moldura-folhas', name: 'Moldura de folhas', description: 'Uma moldura decorativa para o perfil.', price: 3.9, icon: '🌿', type: 'Visual' },
  { id: 'emote-saudacao', name: 'Emote de saudação', description: 'Um cumprimento animado para o mapa.', price: 5.9, icon: '👋', type: 'Visual' },
]

export const demoMessages: ChatMessage[] = [
  { id: 'msg-1', playerId: 'player-lua', nickname: 'LuaSerena', avatar: 'observadora', text: 'Que bom encontrar vocês por aqui! 🌿', sentAt: '10:14' },
  { id: 'msg-2', playerId: 'player-caio', nickname: 'CaioTrilha', avatar: 'trilheiro', text: 'Achei um cartão perto da ponte!', sentAt: '10:16' },
  { id: 'msg-3', playerId: 'player-nina', nickname: 'NinaNorte', avatar: 'cartografa', text: 'O mapa está lindo hoje ✨', sentAt: '10:17' },
]

export const editionLabel = (id: EditionId) => editions.find((edition) => edition.id === id)?.label ?? 'Prévia'
