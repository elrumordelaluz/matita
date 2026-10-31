import { expect, test } from 'vitest'
import { exportBackup, importBackup, importNotice } from './backup.ts'
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

test.each([
  [{ ok: true, count: 0 }, 'Il backup non contiene progressi.'],
  [{ ok: true, count: 1 }, 'Importato 1 tentativo.'],
  [{ ok: true, count: 3 }, 'Importati 3 tentativi.'],
  [
    { ok: true, count: 1, known: 1 },
    'Importato 1 tentativo e 1 abilità già saputa.',
  ],
  [
    { ok: true, count: 3, known: 2 },
    'Importati 3 tentativi e 2 abilità già sapute.',
  ],
  [
    { ok: false, message: 'Il file non è un backup di Matita.' },
    'Il file non è un backup di Matita.',
  ],
])('il risultato dell’importazione dice: %s', (result, notice) => {
  expect(importNotice(result)).toBe(notice)
})

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

test('il backup porta i segni di già saputo e li reimporta', async () => {
  const original = await storeWith([attempt({ skill: 'n.order' })])
  await original.putKnown([
    { skill: 'n.add-sub', markedAt: 1 },
    { skill: 'n.mul-div', markedAt: 1 },
  ])
  const file = await exportBackup(original)
  expect(JSON.parse(file)).toMatchObject({ version: 2 })

  const restored = createMemoryStore()
  expect(await importBackup(restored, file)).toEqual({
    ok: true,
    count: 1,
    known: 2,
  })
  expect(await restored.known()).toEqual(await original.known())
  expect(
    skillStates(graph, await restored.attempts(), await restored.known()),
  ).toEqual({
    'n.add-sub': 'mastered',
    'n.mul-div': 'mastered',
    'n.order': 'learning',
  })
})

test('un backup della versione 1 si legge ancora: solo tentativi', async () => {
  const store = createMemoryStore()
  await store.putKnown([{ skill: 'n.add-sub', markedAt: 1 }])
  const text = JSON.stringify({
    format: 'matita-progress',
    version: 1,
    attempts: [attempt({ id: 'old' })],
  })
  expect(await importBackup(store, text)).toEqual({ ok: true, count: 1 })
  expect((await store.attempts()).map((a) => a.id)).toEqual(['old'])
  expect(await store.known()).toEqual([{ skill: 'n.add-sub', markedAt: 1 }])
})

test.each([
  ['senza segni', { attempts: [] }],
  ['con un segno senza data', { attempts: [], known: [{ skill: 'n.order' }] }],
  [
    'con un segno senza abilità',
    { attempts: [], known: [{ skill: '', markedAt: 1 }] },
  ],
])(
  'rifiuta un backup della versione 2 %s senza toccare i dati',
  async (_, body) => {
    const store = await storeWith([attempt({ id: 'kept' })])
    const text = JSON.stringify({
      format: 'matita-progress',
      version: 2,
      ...body,
    })
    expect((await importBackup(store, text)).ok).toBe(false)
    expect((await store.attempts()).map((a) => a.id)).toEqual(['kept'])
    expect(await store.known()).toEqual([])
  },
)

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
