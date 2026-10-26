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
