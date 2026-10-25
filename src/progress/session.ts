import type { Attempt } from './attempt.ts'
import { dueReviews } from './review.ts'
import { skillStates, type SkillGraph } from './skillState.ts'

// Una seduta di circa dieci esercizi. Vedi SPEC.md, "Sessione": prima i
// ripassi scaduti, un esercizio per abilità e quindi alternati, poi
// l'abilità in apprendimento, poi, se c'è spazio, la prossima sbloccata.

export interface SessionItem {
  readonly skill: string
  /** `new`: l'abilità non ha ancora tentativi, va preceduta dalla lezione. */
  readonly reason: 'review' | 'learning' | 'new'
}

const sessionSize = 10
// Quanti esercizi tenere per l'abilità in apprendimento quando dopo c'è
// un'altra abilità sbloccata: abbastanza per una serie di tre con margine.
const learningShare = 6

export function composeSession({
  graph,
  attempts,
  now,
  canPractise = () => true,
}: {
  graph: SkillGraph
  attempts: readonly Attempt[]
  now: Date
  /** Esclude le abilità senza generatore. */
  canPractise?: (skill: string) => boolean
}): SessionItem[] {
  const states = skillStates(graph, attempts)
  const practised = new Set(attempts.map((a) => a.skill))

  const reviews: SessionItem[] = dueReviews(attempts, now)
    .filter(canPractise)
    .slice(0, sessionSize)
    .map((skill) => ({ skill, reason: 'review' }))

  // In apprendimento, nell'ordine del percorso, con prima quelle già iniziate.
  const learning = graph
    .map((s) => s.id)
    .filter((id) => states[id] === 'learning' && canPractise(id))
    .sort((a, b) => Number(practised.has(b)) - Number(practised.has(a)))

  const items = [...reviews]
  const [current, next] = learning
  const fill = (skill: string, count: number) => {
    const reason = practised.has(skill) ? 'learning' : 'new'
    for (let i = 0; i < count; i++) items.push({ skill, reason })
  }
  if (current) {
    const room = sessionSize - items.length
    fill(current, next ? Math.min(room, learningShare) : room)
  }
  if (next) fill(next, sessionSize - items.length)
  return items
}
