import { createEmptyCard, Rating, State, type Card, type Grade } from 'ts-fsrs'
import { scheduler } from './review.ts'

// Le flashcard nel ripasso. Vedi SPEC.md, "Ripasso e tracking". Come per le
// abilità si salvano i fatti, non le carte: l'introduzione di ogni flashcard
// e ogni voto dato. La carta FSRS si ricostruisce rigiocando i voti.
// progress/ non conosce i capitoli né il contenuto: le flashcard arrivano
// come parametro, solo con il loro id.

export interface Flashcard {
  readonly id: string
}

/** Il voto dato dopo aver girato la carta. Easy non c'è, come per gli esercizi. */
export type FlashcardGrade = 'again' | 'hard' | 'good'

export interface Introduced {
  readonly card: string
  /** Millisecondi dall'epoca Unix. */
  readonly introducedAt: number
}

export interface FlashcardReview {
  readonly card: string
  readonly grade: FlashcardGrade
  /** Millisecondi dall'epoca Unix. */
  readonly at: number
}

/** Mai introdotta; introdotta ma mai votata; in apprendimento; in ripasso. */
export type FlashcardState = 'unseen' | 'new' | 'learning' | 'review'

export const flashcardGrades: readonly FlashcardGrade[] = [
  'again',
  'hard',
  'good',
]

const ratings: Record<FlashcardGrade, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
}

/**
 * Le introduzioni da aggiungere per queste carte: solo quelle non ancora
 * introdotte, così la prima data resta.
 */
export function introduce(
  cards: readonly string[],
  introduced: readonly Introduced[],
  at: number,
): Introduced[] {
  const done = new Set(introduced.map((i) => i.card))
  return [...new Set(cards)]
    .filter((card) => !done.has(card))
    .map((card) => ({ card, introducedAt: at }))
}

/**
 * La carta di ogni flashcard introdotta: nasce vuota alla data
 * dell'introduzione e ogni voto successivo la fa avanzare. I voti prima
 * dell'introduzione e i record di carte non più in `flashcards` non contano.
 */
export function flashcardCards(
  flashcards: readonly Flashcard[],
  introduced: readonly Introduced[],
  reviews: readonly FlashcardReview[],
): Map<string, Card> {
  const known = new Set(flashcards.map((f) => f.id))
  const cards = new Map<string, Card>()
  for (const { card, introducedAt } of introduced)
    if (known.has(card) && !cards.has(card))
      cards.set(card, createEmptyCard(new Date(introducedAt)))
  const since = new Map(introduced.map((i) => [i.card, i.introducedAt]))
  const ordered = [...reviews].sort((a, b) => a.at - b.at)
  for (const { card, grade, at } of ordered) {
    const current = cards.get(card)
    if (!current || at < (since.get(card) ?? Infinity)) continue
    const when = new Date(at)
    cards.set(card, scheduler.next(current, when, ratings[grade]).card)
  }
  return cards
}

/**
 * Senza passi brevi FSRS non ha uno stato di apprendimento: una carta è in
 * apprendimento finché l'ultimo voto è Again, poi torna in ripasso.
 */
export function flashcardState(
  id: string,
  introduced: readonly Introduced[],
  reviews: readonly FlashcardReview[],
): FlashcardState {
  const since = introduced.find((i) => i.card === id)?.introducedAt
  if (since === undefined) return 'unseen'
  const last = reviews
    .filter((r) => r.card === id && r.at >= since)
    .sort((a, b) => b.at - a.at)[0]
  if (!last) return 'new'
  return last.grade === 'again' ? 'learning' : 'review'
}

/** Le flashcard scadute, la più in ritardo per prima. */
export function dueFlashcards(
  flashcards: readonly Flashcard[],
  introduced: readonly Introduced[],
  reviews: readonly FlashcardReview[],
  now: Date,
): string[] {
  return [...flashcardCards(flashcards, introduced, reviews)]
    .filter(
      ([, card]) =>
        card.state !== State.New && card.due.getTime() <= now.getTime(),
    )
    .sort(([, a], [, b]) => a.due.getTime() - b.due.getTime())
    .map(([id]) => id)
}

/** Le flashcard introdotte e mai votate, nell'ordine delle introduzioni. */
export function newFlashcards(
  flashcards: readonly Flashcard[],
  introduced: readonly Introduced[],
  reviews: readonly FlashcardReview[],
): string[] {
  const cards = flashcardCards(flashcards, introduced, reviews)
  return [...introduced]
    .sort((a, b) => a.introducedAt - b.introducedAt)
    .map((i) => i.card)
    .filter((id) => cards.get(id)?.state === State.New)
}
