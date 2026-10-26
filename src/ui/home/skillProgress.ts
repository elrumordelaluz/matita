import {
  chronological,
  isAssisted,
  type Attempt,
} from '../../progress/attempt.ts'
import type { SessionItem } from '../../progress/session.ts'

// Quello che home e progressi mostrano oltre allo stato: la serie verso
// l'acquisizione, qualche conto onesto sui tentativi, la sessione raggruppata.

/** Tre corretti consecutivi senza aiuti. Vedi SPEC.md, "Stato di un'abilità". */
export const masteryStreak = 3

// La serie in corso per ogni abilità: corretti senza aiuti dall'ultimo
// errore o aiuto.
export function currentStreaks(
  attempts: readonly Attempt[],
): Map<string, number> {
  const streaks = new Map<string, number>()
  for (const a of chronological(attempts)) {
    const clean = a.outcome === 'correct' && !isAssisted(a)
    streaks.set(a.skill, clean ? (streaks.get(a.skill) ?? 0) + 1 : 0)
  }
  return streaks
}

export interface AttemptStats {
  readonly total: number
  /** Corretti senza suggerimenti né riscritture. */
  readonly clean: number
  readonly days: number
}

export function attemptStats(attempts: readonly Attempt[]): AttemptStats {
  return {
    total: attempts.length,
    clean: attempts.filter((a) => a.outcome === 'correct' && !isAssisted(a))
      .length,
    days: new Set(attempts.map((a) => new Date(a.answeredAt).toDateString()))
      .size,
  }
}

export type Reason = SessionItem['reason']

export const reasonLabel: Record<Reason, string> = {
  review: 'Ripasso',
  learning: 'In apprendimento',
  new: 'Abilità nuova',
}

export interface SessionGroup {
  readonly skill: string
  readonly reason: Reason
  readonly count: number
}

// Gli esercizi della sessione raccolti per abilità e motivo, nell'ordine in
// cui arrivano.
export function groupSession(items: readonly SessionItem[]): SessionGroup[] {
  const groups = new Map<string, SessionGroup>()
  for (const { skill, reason } of items) {
    const key = `${reason}:${skill}`
    const group = groups.get(key)
    groups.set(key, { skill, reason, count: (group?.count ?? 0) + 1 })
  }
  return [...groups.values()]
}
