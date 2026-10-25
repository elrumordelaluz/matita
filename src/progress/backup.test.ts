import { expect, test } from 'vitest'
import { exportBackup, importBackup } from './backup.ts'
import { attempt } from './fixtures.ts'
import { skillStates } from './skillState.ts'
import { createMemoryStore } from './store.ts'

const graph = [
  { id: 'n.add-sub', prerequisites: [] },
  { id: 'n.mul-div', prerequisites: [] },
  { id: 'n.order', prerequisites: ['n.add-sub', 'n.mul-div'] },
]

async function storeWith(attempts: ReturnType<typeof attempt>[]) {
  const store = createMemoryStore()
  for (const a of attempts) await store.addAttempt(a)
  return store
}

test('esportazione e reimportazione: stessi tentativi, stesso stato', async () => {
  const original = await storeWith([
    ...[1, 2, 3].map(() => attempt({ skill: 'n.add-sub' })),
    attempt({ skill: 'n.mul-div', outcome: 'wrong', answer: '12' }),
    attempt({
      skill: 'n.mul-div',
      outcome: 'misconception',
      misconception: 'n.left-to-right',
    }),
    attempt({ skill: 'n.mul-div', hints: 2, rewrites: 1 }),
  ])
  const file = await exportBackup(original)

  const restored = createMemoryStore()
  expect(await importBackup(restored, file)).toEqual({ ok: true, count: 6 })

  expect(await restored.attempts()).toEqual(await original.attempts())
  expect(skillStates(graph, await restored.attempts())).toEqual(
    skillStates(graph, await original.attempts()),
  )
})

test('reimportare lo stesso file non duplica i tentativi', async () => {
  const store = await storeWith([attempt(), attempt()])
  const file = await exportBackup(store)
  await importBackup(store, file)
  expect(await store.attempts()).toHaveLength(2)
})

test('l’importazione aggiunge ai tentativi già presenti', async () => {
  const backup = await storeWith([attempt({ id: 'from-backup' })])
  const store = await storeWith([attempt({ id: 'already-here' })])
  await importBackup(store, await exportBackup(backup))
  expect((await store.attempts()).map((a) => a.id).sort()).toEqual([
    'already-here',
    'from-backup',
  ])
})

test.each([
  ['un file che non è JSON', 'non sono json'],
  ['un JSON di un altro programma', JSON.stringify({ foo: 1 })],
  [
    'una versione del formato sconosciuta',
    JSON.stringify({ format: 'matita-progress', version: 99, attempts: [] }),
  ],
  [
    'un tentativo con un esito sconosciuto',
    JSON.stringify({
      format: 'matita-progress',
      version: 1,
      attempts: [{ ...attempt(), outcome: 'forse' }],
    }),
  ],
  [
    'un tentativo senza seme',
    JSON.stringify({
      format: 'matita-progress',
      version: 1,
      attempts: [{ ...attempt(), seed: undefined }],
    }),
  ],
])('rifiuta %s senza toccare i dati', async (_, text) => {
  const store = await storeWith([attempt({ id: 'kept' })])
  const result = await importBackup(store, text)
  expect(result).toEqual({ ok: false, message: expect.any(String) })
  expect((await store.attempts()).map((a) => a.id)).toEqual(['kept'])
})

test('rifiuta tutto il file se anche un solo tentativo non è valido', async () => {
  const store = createMemoryStore()
  const text = JSON.stringify({
    format: 'matita-progress',
    version: 1,
    attempts: [attempt(), { ...attempt(), hints: -1 }],
  })
  expect((await importBackup(store, text)).ok).toBe(false)
  expect(await store.attempts()).toEqual([])
})
