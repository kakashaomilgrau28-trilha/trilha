import type { Claim, ClaimResult, EditionId, GameState, Reward } from './model'

export const RESCUE_RADIUS = 10

export function canRescue(
  reward: Reward,
  edition: EditionId,
  playerPosition: { x: number; y: number },
  claims: Claim[],
): ClaimResult {
  if (reward.edition !== edition) return { ok: false, reason: 'edition-mismatch' }
  if (claims.some((claim) => claim.rewardId === reward.id && claim.edition === edition)) return { ok: false, reason: 'already-claimed' }
  if (claims.filter((claim) => claim.rewardId === reward.id && claim.edition === edition).length >= reward.limit) return { ok: false, reason: 'limit-reached' }
  const distance = Math.hypot(reward.x - playerPosition.x, reward.y - playerPosition.y)
  if (distance > RESCUE_RADIUS) return { ok: false, reason: 'out-of-range' }
  const claim: Claim = { rewardId: reward.id, edition, claimedAt: new Date().toISOString() }
  return { ok: true, claim }
}

export function earnedPoints(state: GameState, edition: EditionId, rewards: Reward[]) {
  return state.claims
    .filter((claim) => claim.edition === edition)
    .reduce((sum, claim) => sum + (rewards.find((reward) => reward.id === claim.rewardId)?.points ?? 0), 0)
}

export function containsPersonalContact(text: string) {
  const email = /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i
  const phone = /(?:\+?\d[\s().-]*){9,}/
  return email.test(text) || phone.test(text)
}

export function normalizeNickname(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 18)
}

export function scoreLabel(reason: string) {
  if (reason === 'already-claimed') return 'Você já resgatou este item nesta edição.'
  if (reason === 'out-of-range') return 'Você está fora da área de resgate.'
  if (reason === 'limit-reached') return 'O limite de resgates deste item foi atingido.'
  return 'Este item pertence a outra edição.'
}
