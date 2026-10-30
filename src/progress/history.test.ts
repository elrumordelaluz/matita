import { expect, test } from 'vitest'
import { toText } from '../engine/index.ts'
import { attempt } from './fixtures.ts'
import { latestAttempts } from './history.ts'

// Gli ultimi tentativi di un’abilità con l’esercizio ricostruito dal seme. Il
// testo di ogni seme è quello che il generatore produce oggi, scritto qui una
// volta per tutte: serve a vedere che l’esercizio mostrato è proprio quello.

test('senza tentativi l’elenco è vuoto', () => {
  expect(latestAttempts([], 'n.add-sub')).toEqual([])
  expect(
    latestAttempts([attempt({ skill: 'n.mul-div' })], 'n.add-sub'),
  ).toEqual([])
})

test('al più cinque tentativi, dal più recente', () => {
  const attempts = [3, 7, 11, 27, 42, 100].map((seed) =>
    attempt({ skill: 'n.add-sub', seed }),
  )
  expect(
    latestAttempts(attempts, 'n.add-sub').map((row) => row.attempt.seed),
  ).toEqual([100, 42, 27, 11, 7])
})

test('l’esercizio si ricostruisce dal seme', () => {
  const attempts = [
    attempt({ skill: 'n.add-sub', seed: 7 }),
    attempt({ skill: 'n.add-sub', seed: 42 }),
  ]
  expect(
    latestAttempts(attempts, 'n.add-sub').map((row) =>
      row.expression === null ? null : toText(row.expression),
    ),
  ).toEqual(['23 − 16 + 27 + 32', '4 − 3 − 1'])
})

test('un’altra versione del generatore non si può ricostruire', () => {
  // Il generatore di pow.basics oggi è alla versione 2: un tentativo della 1
  // ricostruirebbe un esercizio diverso da quello svolto.
  const stale = attempt({ skill: 'pow.basics', generatorVersion: 1 })
  const rows = latestAttempts([stale], 'pow.basics')
  expect(rows).toHaveLength(1)
  expect(rows[0]?.expression).toBeNull()
})

test('un’abilità senza generatore non si può ricostruire', () => {
  const ghost = attempt({ skill: 'x.ghost' })
  const rows = latestAttempts([ghost], 'x.ghost')
  expect(rows).toHaveLength(1)
  expect(rows[0]?.expression).toBeNull()
})

test('l’errore tipico riconosciuto porta la sua spiegazione', () => {
  const wrong = attempt({
    outcome: 'misconception',
    misconception: 'add-before-mul',
  })
  expect(latestAttempts([wrong], 'n.add-sub')[0]?.explanation).toBe(
    'Hai svolto l’addizione o la sottrazione prima della moltiplicazione o della divisione. Senza parentesi si fanno prima × e :, poi + e −.',
  )
})

test('senza errore tipico, o sconosciuto al catalogo, non c’è spiegazione', () => {
  expect(
    latestAttempts([attempt({ outcome: 'correct' })], 'n.add-sub')[0]
      ?.explanation,
  ).toBeNull()
  expect(
    latestAttempts(
      [attempt({ outcome: 'misconception', misconception: 'no-such-error' })],
      'n.add-sub',
    )[0]?.explanation,
  ).toBeNull()
})

test('a parità di data conta l’ordine con cui i tentativi arrivano', () => {
  const same = Date.UTC(2026, 8, 14, 9)
  const attempts = [
    attempt({ skill: 'n.add-sub', seed: 7, answeredAt: same }),
    attempt({ skill: 'n.add-sub', seed: 11, answeredAt: same }),
  ]
  expect(
    latestAttempts(attempts, 'n.add-sub').map((row) => row.attempt.seed),
  ).toEqual([11, 7])
})
