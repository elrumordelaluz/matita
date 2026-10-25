import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'
import { chronological, isAssisted, type Attempt } from './attempt.ts'
import { masteryAttempts } from './skillState.ts'

// Il ripasso spaziato. Vedi SPEC.md, "Ripasso spaziato". La carta è
// l'abilità, non l'esercizio, e nasce quando l'abilità diventa acquisita.
// Le carte non si salvano: si ricostruiscono rigiocando i tentativi, così il
// backup dei tentativi basta.

// Senza passi brevi: un'abilità appena acquisita ha già tre corretti di fila
// e il primo ripasso va a qualche giorno, non a dieci minuti. Senza fuzz, così
// rigiocare gli stessi tentativi dà sempre le stesse carte.
const scheduler = fsrs({ enable_short_term: false, enable_fuzz: false })

/** Easy non si usa finché non c'è un criterio onesto per darlo. */
export function gradeFor(attempt: Attempt): Grade {
  if (attempt.outcome !== 'correct') return Rating.Again
  return isAssisted(attempt) ? Rating.Hard : Rating.Good
}

export function reviewCards(attempts: readonly Attempt[]): Map<string, Card> {
  const mastery = masteryAttempts(attempts)
  const cards = new Map<string, Card>()
  for (const a of chronological(attempts)) {
    const at = new Date(a.answeredAt)
    const card =
      cards.get(a.skill) ??
      (mastery.get(a.skill) === a.id ? createEmptyCard(at) : undefined)
    if (card) cards.set(a.skill, scheduler.next(card, at, gradeFor(a)).card)
  }
  return cards
}

/** Le abilità scadute, la più in ritardo per prima. */
export function dueReviews(attempts: readonly Attempt[], now: Date): string[] {
  return [...reviewCards(attempts)]
    .filter(([, card]) => card.due.getTime() <= now.getTime())
    .sort(([, a], [, b]) => a.due.getTime() - b.due.getTime())
    .map(([skill]) => skill)
}
