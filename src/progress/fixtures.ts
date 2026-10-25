import type { Attempt } from './attempt.ts'

// Tentativi per i test: ogni chiamata ha un id nuovo e arriva un minuto dopo
// la precedente, salvo che il test dica altrimenti.

let counter = 0

export function attempt(overrides: Partial<Attempt> = {}): Attempt {
  counter++
  return {
    id: `attempt-${counter}`,
    skill: 'n.add-sub',
    seed: counter,
    generatorVersion: 1,
    answer: '6',
    outcome: 'correct',
    misconception: null,
    hints: 0,
    rewrites: 0,
    durationMs: 20_000,
    answeredAt: Date.UTC(2026, 8, 14, 9) + counter * 60_000,
    ...overrides,
  }
}
