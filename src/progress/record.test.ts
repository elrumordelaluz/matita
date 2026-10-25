import { expect, test } from 'vitest'
import { generate, type Outcome } from '../engine/index.ts'
import { attemptFromPractice } from './record.ts'

const exercise = generate('n.add-sub', 42)

test('un esercizio chiuso diventa un tentativo', () => {
  const attempt = attemptFromPractice(
    {
      exercise,
      answer: '6',
      outcome: { kind: 'correct' },
      hints: 1,
      rewrites: 0,
      durationMs: 31_000,
    },
    { id: 'a1', answeredAt: 1_000 },
  )
  expect(attempt).toEqual({
    id: 'a1',
    skill: 'n.add-sub',
    seed: 42,
    generatorVersion: exercise.generatorVersion,
    answer: '6',
    outcome: 'correct',
    misconception: null,
    hints: 1,
    rewrites: 0,
    durationMs: 31_000,
    answeredAt: 1_000,
  })
})

test('un errore tipico salva il suo id', () => {
  // L'esito `misconception` arriva dal motore con #2: qui lo si costruisce a
  // mano con la forma che avrà.
  const outcome = {
    kind: 'misconception',
    misconception: 'add-sub-right-to-left',
    explanation: 'Addizioni e sottrazioni si svolgono da sinistra a destra.',
  } as unknown as Outcome
  const attempt = attemptFromPractice(
    { exercise, answer: '2', outcome, hints: 0, rewrites: 0, durationMs: 1 },
    { id: 'a2', answeredAt: 2_000 },
  )
  expect(attempt.outcome).toBe('misconception')
  expect(attempt.misconception).toBe('add-sub-right-to-left')
})
