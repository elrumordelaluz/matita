import { chronological, isAssisted, type Attempt } from './attempt.ts'
import type { Known } from './known.ts'

// Lo stato di ogni abilità, derivato dai tentativi e dai segni di già
// saputo. Vedi SPEC.md, "Stato di un'abilità" e "Già saputo". Il grafo arriva
// come parametro: progress/ non conosce content/.

export interface SkillNode {
  readonly id: string
  readonly prerequisites: readonly string[]
}

export type SkillGraph = readonly SkillNode[]

export type SkillState = 'locked' | 'learning' | 'mastered'

const masteryStreak = 3

export function skillStates(
  graph: SkillGraph,
  attempts: readonly Attempt[],
  known: readonly Known[] = [],
): Record<string, SkillState> {
  const mastered = masteredSkills(attempts, known)
  return Object.fromEntries(
    graph.map(({ id, prerequisites }) => [
      id,
      mastered.has(id)
        ? 'mastered'
        : prerequisites.every((p) => mastered.has(p))
          ? 'learning'
          : 'locked',
    ]),
  )
}

// Un'abilità diventa acquisita la prima volta che la serie arriva a tre, e
// lo resta: da lì la segue il ripasso. Il segno di già saputo la rende
// acquisita finché c'è; tolto il segno, decidono di nuovo i tentativi.
function masteredSkills(
  attempts: readonly Attempt[],
  known: readonly Known[],
): Set<string> {
  return new Set([
    ...masteryAttempts(attempts).keys(),
    ...known.map((k) => k.skill),
  ])
}

/**
 * Per ogni abilità acquisita con i tentativi, l'id del tentativo che l'ha
 * resa acquisita: il terzo corretto consecutivo senza aiuti. I segni di già
 * saputo non contano qui: li aggiunge chi li riceve.
 */
export function masteryAttempts(
  attempts: readonly Attempt[],
): Map<string, string> {
  const streaks = new Map<string, number>()
  const mastery = new Map<string, string>()
  for (const a of chronological(attempts)) {
    const clean = a.outcome === 'correct' && !isAssisted(a)
    const streak = clean ? (streaks.get(a.skill) ?? 0) + 1 : 0
    streaks.set(a.skill, streak)
    if (streak >= masteryStreak && !mastery.has(a.skill))
      mastery.set(a.skill, a.id)
  }
  return mastery
}
