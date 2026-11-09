import { describe, expect, test } from 'vitest'
import { exportBackup, importBackup, importNotice } from './backup.ts'
import { attempt } from './fixtures.ts'
import { createMemoryStore, type ProgressStore } from './store.ts'

// Il backup con le flashcard: i 9 file da rifiutare e i 9 da importare.
// I file si scrivono a mano, non si esportano: la forma è quella del formato.

const intro = { card: 'n.order', introducedAt: 1 }
const rev = { card: 'n.order', grade: 'good' as const, at: 5 }

const v3 = (extra: Record<string, unknown> = {}) => ({
  format: 'matita-progress',
  version: 3,
  attempts: [],
  known: [],
  introduced: [intro],
  flashcardReviews: [rev],
  ...extra,
})
const without = (key: string) => {
  const rest: Record<string, unknown> = v3()
  delete rest[key]
  return rest
}

async function snapshot(store: ProgressStore) {
  return {
    attempts: await store.attempts(),
    known: await store.known(),
    introduced: await store.introduced(),
    reviews: await store.flashcardReviews(),
  }
}

const bad = (key: string, record: unknown) =>
  JSON.stringify(v3({ [key]: [record] }))

// Un file per voce, tranne dove la regola ha più forme: allora sono più file.
const rejected: [string, string[]][] = [
  ['non è JSON', ['questo non è JSON']],
  ['ha un format sbagliato', [JSON.stringify(v3({ format: 'altro' }))]],
  ['è della versione 4', [JSON.stringify(v3({ version: 4 }))]],
  ['non ha introduced', [JSON.stringify(without('introduced'))]],
  ['non ha flashcardReviews', [JSON.stringify(without('flashcardReviews'))]],
  ['ha un voto easy', [bad('flashcardReviews', { ...rev, grade: 'easy' })]],
  [
    'ha un voto con la carta vuota',
    [bad('flashcardReviews', { ...rev, card: '' })],
  ],
  [
    'ha un voto con la data negativa o non intera',
    [
      bad('flashcardReviews', { ...rev, at: -1 }),
      bad('flashcardReviews', { ...rev, at: 1.5 }),
    ],
  ],
  [
    'ha un’introduzione con la carta non stringa o senza introducedAt',
    [
      bad('introduced', { ...intro, card: 7 }),
      bad('introduced', { card: 'n.order' }),
    ],
  ],
]

describe('un file da rifiutare non scrive niente', () => {
  test.each(rejected)('%s', async (_, texts) => {
    for (const text of texts) {
      const store = createMemoryStore()
      const before = await snapshot(store)
      const result = await importBackup(store, text)
      expect(result.ok).toBe(false)
      expect(await snapshot(store)).toEqual(before)
    }
  })
})

describe('un file da importare', () => {
  test('versione 1: nessuna flashcard', async () => {
    const store = createMemoryStore()
    const text = JSON.stringify({
      format: 'matita-progress',
      version: 1,
      attempts: [attempt()],
    })
    expect(await importBackup(store, text)).toEqual({ ok: true, count: 1 })
    expect(await store.introduced()).toEqual([])
    expect(await store.flashcardReviews()).toEqual([])
  })

  test('versione 2: nessuna flashcard', async () => {
    const store = createMemoryStore()
    const text = JSON.stringify({
      format: 'matita-progress',
      version: 2,
      attempts: [],
      known: [{ skill: 'n.add-sub', markedAt: 1 }],
    })
    expect(await importBackup(store, text)).toEqual({
      ok: true,
      count: 0,
      known: 1,
    })
    expect(await store.introduced()).toEqual([])
  })

  test('versione 3 con le due liste vuote', async () => {
    const store = createMemoryStore()
    const text = JSON.stringify(v3({ introduced: [], flashcardReviews: [] }))
    const result = await importBackup(store, text)
    expect(result).toEqual({ ok: true, count: 0 })
    expect(importNotice(result)).toBe('Il backup non contiene progressi.')
  })

  test('versione 3 piena: i conti e l’avviso nominano introduzioni e voti', async () => {
    const store = createMemoryStore()
    const text = JSON.stringify(
      v3({
        attempts: [attempt()],
        introduced: [intro, { card: 'n.div-zero', introducedAt: 2 }],
        flashcardReviews: [rev],
      }),
    )
    const result = await importBackup(store, text)
    expect(result).toEqual({ ok: true, count: 1, introduced: 2, reviews: 1 })
    expect(importNotice(result)).toBe(
      'Importato 1 tentativo, 2 flashcard introdotte e 1 voto alle flashcard.',
    )
  })

  test('versione 3 esportata e reimportata in un negozio vuoto: stessi record', async () => {
    const original = createMemoryStore()
    await original.addAttempt(attempt())
    await original.putKnown([{ skill: 'n.add-sub', markedAt: 1 }])
    await original.putIntroduced([intro])
    await original.putFlashcardReviews([rev])
    const restored = createMemoryStore()
    await importBackup(restored, await exportBackup(original))
    expect(await snapshot(restored)).toEqual(await snapshot(original))
  })

  test('versione 3 importata due volte: nessun duplicato', async () => {
    const store = createMemoryStore()
    const text = JSON.stringify(v3())
    await importBackup(store, text)
    await importBackup(store, text)
    expect(await store.introduced()).toEqual([intro])
    expect(await store.flashcardReviews()).toEqual([rev])
  })

  test('campi in più su un record: non entrano nei dati', async () => {
    const store = createMemoryStore()
    const text = JSON.stringify(
      v3({
        introduced: [{ ...intro, extra: 1 }],
        flashcardReviews: [{ ...rev, extra: 1 }],
      }),
    )
    await importBackup(store, text)
    expect(await store.introduced()).toEqual([intro])
    expect(await store.flashcardReviews()).toEqual([rev])
  })

  test('versione 3 con solo record di flashcard e nessun tentativo', async () => {
    const store = createMemoryStore()
    const result = await importBackup(store, JSON.stringify(v3()))
    expect(result).toEqual({ ok: true, count: 0, introduced: 1, reviews: 1 })
    expect(importNotice(result)).toBe(
      'Importati 0 tentativi, 1 flashcard introdotta e 1 voto alle flashcard.',
    )
  })

  test('in un negozio che ha già dei record: si aggiunge, il resto resta', async () => {
    const store = createMemoryStore()
    const other = { card: 'n.div-zero', introducedAt: 9 }
    await store.putIntroduced([other])
    await importBackup(store, JSON.stringify(v3()))
    expect(await store.introduced()).toEqual([other, intro])
  })
})
