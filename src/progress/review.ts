import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'
import { chronological, isAssisted, type Attempt } from './attempt.ts'
import type { Known } from './known.ts'
import { masteryAttempts } from './skillState.ts'

// Il ripasso spaziato. Vedi SPEC.md, "Ripasso spaziato" e "Già saputo". La
// carta è l'abilità, non l'esercizio, e nasce quando l'abilità diventa
// acquisita. Le carte non si salvano: si ricostruiscono rigiocando tentativi
// e segni, così il backup di quelli basta.

// Senza passi brevi: un'abilità appena acquisita ha già tre corretti di fila
// e il primo ripasso va a qualche giorno, non a dieci minuti. Senza fuzz, così
// rigiocare gli stessi tentativi dà sempre le stesse carte.
const scheduler = fsrs({ enable_short_term: false, enable_fuzz: false })

/** Easy non si usa finché non c'è un criterio onesto per darlo. */
export function gradeFor(attempt: Attempt): Grade {
  if (attempt.outcome !== 'correct') return Rating.Again
  return isAssisted(attempt) ? Rating.Hard : Rating.Good
}

// Il segno nasce con un voto Good, come il terzo corretto di una serie: il
// primo ripasso arriva dopo qualche giorno.
const knownGrade: Grade = Rating.Good

type Event =
  | { readonly at: number; readonly attempt: Attempt }
  | { readonly at: number; readonly known: Known }

/**
 * La carta di ogni abilità acquisita. Nasce dal primo fra il tentativo che
 * rende l'abilità acquisita e il segno di già saputo; da lì ogni tentativo è
 * un ripasso. I tentativi prima della nascita non contano, e un segno che
 * arriva dopo la nascita non cambia nulla.
 */
export function reviewCards(
  attempts: readonly Attempt[],
  known: readonly Known[] = [],
): Map<string, Card> {
  const mastery = masteryAttempts(attempts)
  // A parità di data il tentativo viene prima del segno.
  const events: Event[] = [
    ...chronological(attempts).map((attempt) => ({
      at: attempt.answeredAt,
      attempt,
    })),
    ...known.map((k) => ({ at: k.markedAt, known: k })),
  ].sort((a, b) => a.at - b.at)

  const cards = new Map<string, Card>()
  for (const event of events) {
    const at = new Date(event.at)
    if ('known' in event) {
      const { skill } = event.known
      if (!cards.has(skill))
        cards.set(
          skill,
          scheduler.next(createEmptyCard(at), at, knownGrade).card,
        )
      continue
    }
    const a = event.attempt
    const card =
      cards.get(a.skill) ??
      (mastery.get(a.skill) === a.id ? createEmptyCard(at) : undefined)
    if (card) cards.set(a.skill, scheduler.next(card, at, gradeFor(a)).card)
  }
  return cards
}

/** Le abilità scadute, la più in ritardo per prima. */
export function dueReviews(
  attempts: readonly Attempt[],
  now: Date,
  known: readonly Known[] = [],
): string[] {
  return [...reviewCards(attempts, known)]
    .filter(([, card]) => card.due.getTime() <= now.getTime())
    .sort(([, a], [, b]) => a.due.getTime() - b.due.getTime())
    .map(([skill]) => skill)
}
