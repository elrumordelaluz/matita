import type { QueueItem } from '../../progress/queue.ts'

// Il cancello dell'abilità nuova: dove una sessione si ferma a offrire la
// lezione prima dell'esercizio. Vedi SPEC.md, "Sessione".

/**
 * Per ogni abilità, l'indice della sua prima voce `new` nella coda. Le
 * flashcard occupano un posto ma non hanno abilità nuova.
 */
export function firstNewItems(
  items: readonly QueueItem[],
): ReadonlyMap<string, number> {
  const firsts = new Map<string, number>()
  items.forEach((entry, i) => {
    if (entry.kind !== 'exercise') return
    const { skill, reason } = entry.item
    if (reason === 'new' && !firsts.has(skill)) firsts.set(skill, i)
  })
  return firsts
}
