import type { SessionItem } from '../../progress/session.ts'

// La prima voce "nuova" di ogni abilità: lì la sessione propone la lezione
// prima dell'esercizio. Diventa superflua se composeSession marcherà lui
// stesso la prima voce di ogni abilità nuova.

export function firstNewBySkill(
  items: readonly SessionItem[],
): Map<string, number> {
  const first = new Map<string, number>()
  items.forEach((item, index) => {
    if (item.reason === 'new' && !first.has(item.skill))
      first.set(item.skill, index)
  })
  return first
}
