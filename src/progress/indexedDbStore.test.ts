import 'fake-indexeddb/auto'
import { expect, test } from 'vitest'
import { attempt } from './fixtures.ts'
import { openIndexedDbStore } from './indexedDbStore.ts'

// L'adattatore IndexedDB è sottile: qui basta vedere che i tentativi
// sopravvivono alla riapertura e che l'importazione non duplica.

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
