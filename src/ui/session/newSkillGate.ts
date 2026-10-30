import type { SessionItem } from '../../progress/session.ts'

// Il cancello dell'abilità nuova: dove una sessione si ferma a offrire la
// lezione prima dell'esercizio. Vedi SPEC.md, "Sessione".

/** Per ogni abilità, l'indice della sua prima voce `new` nel piano. */
export function firstNewItems(
  items: readonly SessionItem[],
): ReadonlyMap<string, number> {
  const firsts = new Map<string, number>()
  items.forEach(({ skill, reason }, i) => {
    if (reason === 'new' && !firsts.has(skill)) firsts.set(skill, i)
  })
  return firsts
}
