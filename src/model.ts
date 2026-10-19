export type EditionId = 'preview' | 'alpha' | 'omega'
export type PageId = 'map' | 'collection' | 'ranking' | 'shop' | 'chat'

export interface Player {
  id: string
  nickname: string
  avatar: string
  clubId: string
  x: number
  y: number
  online: boolean
}

export interface Club {
  id: string
  name: string
  color: string
}

export interface Edition {
  id: EditionId
  label: string
  shortLabel: string
  description: string
  accent: string
}

export interface Reward {
  id: string
  name: string
  description: string
  category: string
  rarity: 'Comum' | 'Incomum' | 'Raro'
  points: number
  limit: number
  x: number
  y: number
  edition: EditionId
  icon: string
}

export interface Claim {
  rewardId: string
  edition: EditionId
  claimedAt: string
}

export interface CosmeticProduct {
  id: string
  name: string
  description: string
  price: number
  icon: string
  type: 'Acessório' | 'Visual'
}

export interface ChatMessage {
  id: string
  playerId: string
  nickname: string
  avatar: string
  text: string
  sentAt: string
}

export interface GameState {
  nickname: string
  avatar: string
  clubId: string
  edition: EditionId
  claims: Claim[]
  purchasedCosmetics: string[]
  mutedPlayerIds: string[]
  blockedPlayerIds: string[]
  messages: ChatMessage[]
  lastMessageAt: number
}

export type ClaimResult =
  | { ok: true; claim: Claim }
  | { ok: false; reason: 'already-claimed' | 'out-of-range' | 'limit-reached' | 'edition-mismatch' }
