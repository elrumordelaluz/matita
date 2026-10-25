import { chronological, isAssisted, type Attempt } from './attempt.ts'

// Lo stato di ogni abilità, derivato dai tentativi. Vedi SPEC.md, "Stato di
// un'abilità". Il grafo arriva come parametro: progress/ non conosce
// content/.

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
): Record<string, SkillState> {
  const mastered = masteredSkills(attempts)
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
// lo resta: da lì la segue il ripasso.
function masteredSkills(attempts: readonly Attempt[]): Set<string> {
  return new Set(masteryAttempts(attempts).keys())
}

/**
 * Per ogni abilità acquisita, l'id del tentativo che l'ha resa acquisita: il
 * terzo corretto consecutivo senza aiuti.
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
