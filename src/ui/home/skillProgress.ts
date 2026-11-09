import {
  chronological,
  isAssisted,
  type Attempt,
} from '../../progress/attempt.ts'
import type { QueueItem } from '../../progress/queue.ts'
import type { SessionItem } from '../../progress/session.ts'
import type { SkillState } from '../../progress/skillState.ts'

// Quello che home e progressi mostrano di ogni abilità: lo stato con il suo
// tag, la serie verso l'acquisizione, qualche conto onesto sui tentativi, la
// coda raggruppata.

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

/** Lo stato di un'abilità con i nomi del glossario, e il colore del suo tag. */
export const stateLabel: Record<SkillState, string> = {
  locked: 'bloccata',
  learning: 'in apprendimento',
  mastered: 'acquisita',
}

export const stateTag: Record<SkillState, string> = {
  locked: 'bg-paper text-dim',
  learning: 'bg-pencil-soft text-pencil-ink',
  mastered: 'bg-ok-soft text-ok',
}

export type Reason = SessionItem['reason']

export const reasonLabel: Record<Reason, string> = {
  review: 'Ripasso',
  learning: 'In apprendimento',
  new: 'Abilità nuova',
}

export type QueueGroup =
  | {
      readonly kind: 'exercise'
      readonly skill: string
      readonly reason: Reason
      readonly count: number
    }
  | {
      readonly kind: 'flashcard'
      readonly due: boolean
      readonly count: number
    }

// La coda raccolta in righe, nell'ordine in cui compare ciascuna per la
// prima volta: gli esercizi per abilità e motivo, le flashcard in una riga
// sola per blocco, scadute e nuove separate.
export function groupQueue(queue: readonly QueueItem[]): QueueGroup[] {
  const groups = new Map<string, QueueGroup>()
  for (const q of queue) {
    let key: string
    let fresh: QueueGroup
    if (q.kind === 'exercise') {
      const { skill, reason } = q.item
      key = `${reason}:${skill}`
      fresh = { kind: 'exercise', skill, reason, count: 0 }
    } else {
      const { due } = q
      key = due ? 'due-cards' : 'new-cards'
      fresh = { kind: 'flashcard', due, count: 0 }
    }
    const group = groups.get(key) ?? fresh
    groups.set(key, { ...group, count: group.count + 1 })
  }
  return [...groups.values()]
}
