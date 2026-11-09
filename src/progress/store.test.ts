import { expect, test } from 'vitest'
import { attempt } from './fixtures.ts'
import { createMemoryStore } from './store.ts'

// Il negozio in memoria, quello dei test e delle finestre senza IndexedDB.

test('un segno nuovo per la stessa abilità sostituisce il vecchio', async () => {
  const store = createMemoryStore()
  await store.putKnown([
    { skill: 'n.add-sub', markedAt: 1 },
    { skill: 'n.mul-div', markedAt: 1 },
  ])
  await store.putKnown([{ skill: 'n.add-sub', markedAt: 2 }])
  expect(await store.known()).toEqual([
    { skill: 'n.add-sub', markedAt: 2 },
    { skill: 'n.mul-div', markedAt: 1 },
  ])
})

test('togliere i segni lascia gli altri segni e tutti i tentativi', async () => {
  const store = createMemoryStore()
  const a = attempt({ skill: 'n.add-sub' })
  await store.addAttempt(a)
  await store.putKnown([
    { skill: 'n.add-sub', markedAt: 1 },
    { skill: 'z.add-sub', markedAt: 1 },
  ])
  await store.removeKnown(['n.add-sub', 'n.order'])
  expect(await store.known()).toEqual([{ skill: 'z.add-sub', markedAt: 1 }])
  expect(await store.attempts()).toEqual([a])
})

test('le introduzioni e i voti delle flashcard si rileggono e la stessa chiave non duplica', async () => {
  const store = createMemoryStore()
  await store.putIntroduced([{ card: 'n.order', introducedAt: 1 }])
  await store.putIntroduced([{ card: 'n.order', introducedAt: 1 }])
  await store.putFlashcardReviews([
    { card: 'n.order', grade: 'good', at: 5 },
    { card: 'n.order', grade: 'again', at: 2 },
  ])
  await store.putFlashcardReviews([{ card: 'n.order', grade: 'good', at: 5 }])
  expect(await store.introduced()).toEqual([
    { card: 'n.order', introducedAt: 1 },
  ])
  expect(await store.flashcardReviews()).toEqual([
    { card: 'n.order', grade: 'again', at: 2 },
    { card: 'n.order', grade: 'good', at: 5 },
  ])
})

test('una introduzione più tarda della stessa carta non sostituisce la prima', async () => {
  const store = createMemoryStore()
  await store.putIntroduced([{ card: 'n.order', introducedAt: 1 }])
  await store.putIntroduced([{ card: 'n.order', introducedAt: 5 }])
  expect(await store.introduced()).toEqual([
    { card: 'n.order', introducedAt: 1 },
  ])
  await store.putIntroduced([{ card: 'n.order', introducedAt: 0 }])
  expect(await store.introduced()).toEqual([
    { card: 'n.order', introducedAt: 0 },
  ])
})
