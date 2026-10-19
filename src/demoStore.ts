import type { GameState } from './model'
import { demoMessages } from './gameData'

const STORAGE_KEY = 'trilha-demo-v1'

export const initialState: GameState = {
  nickname: '',
  avatar: 'trilheiro',
  clubId: '',
  edition: 'preview',
  claims: [],
  purchasedCosmetics: [],
  mutedPlayerIds: [],
  blockedPlayerIds: [],
  messages: demoMessages,
  lastMessageAt: 0,
}

export function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const state = saved ? { ...initialState, ...JSON.parse(saved) } as GameState : initialState
    if (['horizonte', 'ipe', 'constelacao'].includes(state.clubId)) state.clubId = ''
    return state
  } catch {
    return initialState
  }
}

export function saveState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage is optional; the current session continues in memory.
  }
}

// Replace this local adapter with a server adapter before any public launch.
// The server must own identity, edition checks, item limits and point calculation.
export interface GameRepository {
  claimReward: (rewardId: string, edition: GameState['edition']) => Promise<{ ok: boolean }>
  sendMessage: (text: string) => Promise<{ ok: boolean }>
}

export const demoRepository: GameRepository = {
  async claimReward() { return { ok: true } },
  async sendMessage() { return { ok: true } },
}
