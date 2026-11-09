import { expect, test } from 'vitest'
import { attempt } from './fixtures.ts'
import { composeQueue, requeue, type QueueItem } from './queue.ts'
import { composeSession } from './session.ts'

const graph = [
  { id: 'n.add-sub', prerequisites: [] },
  { id: 'n.mul-div', prerequisites: [] },
  { id: 'n.order', prerequisites: ['n.add-sub', 'n.mul-div'] },
]
const flashcards = Array.from({ length: 9 }, (_, i) => ({ id: `n.card-${i}` }))
const day = 86_400_000
const monday = Date.UTC(2026, 8, 14, 9)
const now = new Date(monday + 20 * day)

const mastery = (skill: string, at: number) =>
  [0, 1, 2].map((i) => attempt({ skill, answeredAt: at + i * 60_000 }))
// Due ripassi scaduti: due abilità acquisite da tempo.
const attempts = [
  ...mastery('n.add-sub', monday),
  ...mastery('n.mul-div', monday + day),
]
const introduced = (ids: string[], at = monday) =>
  ids.map((card) => ({ card, introducedAt: at }))
const reviewed = (card: string, at: number) => ({
  card,
  grade: 'good' as const,
  at,
})

const compose = (over: Partial<Parameters<typeof composeQueue>[0]> = {}) =>
  composeQueue({
    graph,
    attempts,
    now,
    flashcards,
    introduced: [],
    flashcardReviews: [],
    random: () => 0.5,
    ...over,
  })
const cardsOf = (queue: QueueItem[]) =>
  queue.flatMap((q) => (q.kind === 'flashcard' ? [q.card] : []))
const exercisesOf = (queue: QueueItem[]) =>
  queue.flatMap((q) => (q.kind === 'exercise' ? [q.item] : []))

test('senza introduzioni, la coda è la sessione di sempre', () => {
  const queue = compose()
  expect(cardsOf(queue)).toEqual([])
  expect(exercisesOf(queue)).toEqual(composeSession({ graph, attempts, now }))
})

test('ripassi scaduti e flashcard scadute stanno in un solo blocco mescolato', () => {
  const ids = ['n.card-0', 'n.card-1', 'n.card-2']
  const reviews = ids.map((id) => reviewed(id, monday))
  const queue = compose({
    introduced: introduced(ids),
    flashcardReviews: reviews,
  })
  const dueReviews = composeSession({ graph, attempts, now }).filter(
    (i) => i.reason === 'review',
  )
  expect(dueReviews).toHaveLength(2)
  const block = queue.slice(0, 5)
  expect(cardsOf(block).sort()).toEqual(ids)
  expect(exercisesOf(block)).toHaveLength(2)
  // Con un random diverso il blocco cambia ordine, ma non contenuto.
  const other = compose({
    introduced: introduced(ids),
    flashcardReviews: reviews,
    random: () => 0.01,
  })
  expect(other.slice(0, 5)).not.toEqual(block)
  expect(cardsOf(other.slice(0, 5)).sort()).toEqual(ids)
})

test('le nuove vengono dopo il blocco dei ripassi, al più cinque', () => {
  const ids = flashcards.map((f) => f.id)
  const queue = compose({ introduced: introduced(ids) })
  const firstNew = queue.findIndex((q) => q.kind === 'flashcard')
  expect(cardsOf(queue)).toHaveLength(5)
  // Dopo i due ripassi, prima del resto della sessione.
  expect(firstNew).toBe(2)
  expect(queue.slice(2, 7).every((q) => q.kind === 'flashcard')).toBe(true)
  expect(queue.slice(0, 2).every((q) => q.kind === 'exercise')).toBe(true)
})

test('ogni flashcard dice se è scaduta o nuova', () => {
  const ids = flashcards.map((f) => f.id)
  const queue = compose({
    introduced: introduced(ids),
    flashcardReviews: ids.slice(0, 2).map((id) => reviewed(id, 0)),
  })
  const withDue = (due: boolean) =>
    queue.flatMap((q) =>
      q.kind === 'flashcard' && q.due === due ? [q.card] : [],
    )
  expect(withDue(true).sort()).toEqual(ids.slice(0, 2))
  expect(withDue(false).sort()).toEqual(ids.slice(2, 7))
})

test('le flashcard non ancora scadute e quelle mai introdotte non ci sono', () => {
  const queue = compose({
    introduced: introduced(['n.card-0']),
    flashcardReviews: [reviewed('n.card-0', now.getTime())],
  })
  expect(cardsOf(queue)).toEqual([])
})

test('le flashcard non cambiano il numero di esercizi, né quali', () => {
  const plain = exercisesOf(compose())
  const withCards = exercisesOf(
    compose({
      introduced: introduced(flashcards.map((f) => f.id)),
      random: () => 0,
    }),
  )
  expect(withCards).toHaveLength(plain.length)
  expect(withCards.map((i) => `${i.skill}/${i.reason}`).sort()).toEqual(
    plain.map((i) => `${i.skill}/${i.reason}`).sort(),
  )
})

test('requeue: Again rimette la voce tre posti dopo', () => {
  const q: QueueItem[] = 'abcde'
    .split('')
    .map((card) => ({ kind: 'flashcard', card, due: true }))
  const names = (x: QueueItem[]) => cardsOf(x).join('')
  expect(names(requeue(q, 0, 'again'))).toBe('abcade')
  expect(names(requeue(q, 3, 'again'))).toBe('abcded')
  expect(names(requeue(q, 4, 'again'))).toBe('abcdee')
  expect(names(requeue(requeue(q, 0, 'again'), 3, 'again'))).toBe('abcadea')
})

test('requeue: Hard e Good non rimettono nulla', () => {
  const q: QueueItem[] = [{ kind: 'flashcard', card: 'a', due: true }]
  expect(requeue(q, 0, 'hard')).toEqual(q)
  expect(requeue(q, 0, 'good')).toEqual(q)
})
