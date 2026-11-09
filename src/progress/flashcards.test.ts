import { expect, test } from 'vitest'
import {
  dueFlashcards,
  flashcardCards,
  flashcardState,
  introduce,
  newFlashcards,
  type FlashcardReview,
  type Introduced,
} from './flashcards.ts'

// Le flashcard arrivano come parametro: progress/ non conosce i capitoli.

const day = 86_400_000
const t0 = Date.UTC(2026, 8, 14, 9)
const cards = [{ id: 'a.one' }, { id: 'a.two' }, { id: 'a.three' }]

const intro = (card: string, introducedAt = t0): Introduced => ({
  card,
  introducedAt,
})
const review = (
  card: string,
  grade: FlashcardReview['grade'],
  at: number,
): FlashcardReview => ({ card, grade, at })

test('gli stessi voti in qualsiasi ordine danno la stessa carta', () => {
  const reviews = [
    review('a.one', 'good', t0 + day),
    review('a.one', 'again', t0 + 4 * day),
    review('a.one', 'hard', t0 + 6 * day),
  ]
  const forward = flashcardCards(cards, [intro('a.one')], reviews)
  const shuffled = flashcardCards(
    cards,
    [intro('a.one')],
    [reviews[2]!, reviews[0]!, reviews[1]!],
  )
  expect(shuffled.get('a.one')).toEqual(forward.get('a.one'))
  expect(forward.get('a.one')?.reps).toBe(3)
})

test('un voto Good rinvia la carta di più di un voto Again', () => {
  const good = flashcardCards(
    cards,
    [intro('a.one')],
    [review('a.one', 'good', t0)],
  )
  const again = flashcardCards(
    cards,
    [intro('a.one')],
    [review('a.one', 'again', t0)],
  )
  expect(good.get('a.one')!.due.getTime()).toBeGreaterThan(
    again.get('a.one')!.due.getTime(),
  )
})

test('introduce aggiunge solo le carte non ancora introdotte, con la prima data', () => {
  const first = introduce(['a.one', 'a.two'], [], t0)
  expect(first).toEqual([intro('a.one'), intro('a.two')])
  const again = introduce(['a.two', 'a.three'], first, t0 + day)
  expect(again).toEqual([intro('a.three', t0 + day)])
  expect(introduce(['a.one', 'a.two'], first, t0 + day)).toEqual([])
})

test('lo stato: mai introdotta, nuova, in apprendimento, in ripasso', () => {
  const introduced = [intro('a.one'), intro('a.two'), intro('a.three')]
  const reviews = [
    review('a.two', 'good', t0),
    review('a.three', 'good', t0),
    review('a.three', 'again', t0 + 5 * day),
  ]
  const states = ['a.one', 'a.two', 'a.three', 'a.four'].map((id) =>
    flashcardState(id, introduced, reviews),
  )
  expect(states).toEqual(['new', 'review', 'learning', 'unseen'])
})

test('i record di carte che non ci sono più si ignorano', () => {
  const introduced = [intro('gone'), intro('a.one')]
  const reviews = [review('gone', 'good', t0)]
  const map = flashcardCards(cards, introduced, reviews)
  expect([...map.keys()]).toEqual(['a.one'])
  expect(
    dueFlashcards(cards, introduced, reviews, new Date(t0 + 99 * day)),
  ).toEqual([])
  expect(newFlashcards(cards, introduced, reviews)).toEqual(['a.one'])
})

test('i voti prima dell’introduzione si ignorano', () => {
  const introduced = [intro('a.one', t0 + day)]
  const early = [review('a.one', 'good', t0)]
  expect(flashcardCards(cards, introduced, early).get('a.one')?.reps).toBe(0)
  expect(newFlashcards(cards, introduced, early)).toEqual(['a.one'])
})

test('nuova e scaduta: la nuova non ha voti, la scaduta ha la data passata', () => {
  const introduced = [intro('a.one'), intro('a.two'), intro('a.three')]
  const reviews = [
    review('a.two', 'good', t0),
    review('a.three', 'good', t0 + 30 * day),
  ]
  const now = new Date(t0 + 31 * day)
  expect(newFlashcards(cards, introduced, reviews)).toEqual(['a.one'])
  expect(dueFlashcards(cards, introduced, reviews, now)).toEqual(['a.two'])
  expect(dueFlashcards(cards, [], [], now)).toEqual([])
})
