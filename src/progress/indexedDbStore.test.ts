import 'fake-indexeddb/auto'
import { openDB } from 'idb'
import { expect, test } from 'vitest'
import { attempt } from './fixtures.ts'
import { openIndexedDbStore } from './indexedDbStore.ts'

// L'adattatore IndexedDB è sottile: qui basta vedere che tentativi e segni
// sopravvivono alla riapertura, che l'importazione non duplica e che un
// database vecchio si aggiorna.

let n = 0
const freshName = () => `matita-test-${++n}`

test('i tentativi restano dopo aver riaperto il database', async () => {
  const name = freshName()
  const first = attempt({ answeredAt: 2 })
  const second = attempt({ answeredAt: 1 })
  const store = await openIndexedDbStore(name)
  await store.addAttempt(first)
  await store.addAttempt(second)

  const reopened = await openIndexedDbStore(name)
  expect(await reopened.attempts()).toEqual([second, first])
})

test('putAttempts sostituisce i tentativi con lo stesso id', async () => {
  const store = await openIndexedDbStore(freshName())
  const a = attempt()
  await store.addAttempt(a)
  await store.putAttempts([a, attempt()])
  expect(await store.attempts()).toHaveLength(2)
})

test('i segni di già saputo restano dopo la riapertura e si possono togliere', async () => {
  const name = freshName()
  const store = await openIndexedDbStore(name)
  await store.putKnown([
    { skill: 'n.add-sub', markedAt: 1 },
    { skill: 'n.mul-div', markedAt: 1 },
  ])
  await store.putKnown([{ skill: 'n.add-sub', markedAt: 2 }])

  const reopened = await openIndexedDbStore(name)
  expect(await reopened.known()).toEqual([
    { skill: 'n.add-sub', markedAt: 2 },
    { skill: 'n.mul-div', markedAt: 1 },
  ])
  await reopened.removeKnown(['n.add-sub'])
  expect(await reopened.known()).toEqual([{ skill: 'n.mul-div', markedAt: 1 }])
})

test('un database della versione 1 passa alla 2 senza perdere i tentativi', async () => {
  const name = freshName()
  const a = attempt()
  // Il database come lo lasciava la prima versione: solo i tentativi.
  const old = await openDB(name, 1, {
    upgrade(db) {
      db.createObjectStore('attempts', { keyPath: 'id' })
    },
  })
  await old.put('attempts', a)
  old.close()

  const store = await openIndexedDbStore(name)
  expect(await store.attempts()).toEqual([a])
  expect(await store.known()).toEqual([])
  await store.putKnown([{ skill: 'n.add-sub', markedAt: 1 }])
  expect(await store.known()).toHaveLength(1)
})
