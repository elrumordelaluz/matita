import { expect, test } from 'vitest'
import { correctSymbol, generate, verify } from '../engine/index.ts'
import { latestAttempts } from './history.ts'
import { attemptFromPractice } from './record.ts'

// Il tentativo delle scritture (SPEC.md, "Insiemi", "Risposte"): la risposta
// sono i quattro simboli nell'ordine degli oggetti, l'errore tipico quello
// della prima scrittura sbagliata. Dal tentativo l'esercizio si ricostruisce,
// e la stessa risposta riceve lo stesso esito.

const exercise = generate('set.relations', 5)
const right = exercise.objects.map((o) => correctSymbol(o, exercise.set))

// La prima scrittura con appartenenza e inclusione scambiate.
const swapped: Record<string, string> = {
  '∈': '⊂',
  '∉': '⊄',
  '⊂': '∈',
  '=': '∈',
  '⊄': '∉',
}

function record(answer: string) {
  const outcome = verify(answer, exercise)
  return {
    outcome,
    attempt: attemptFromPractice(
      { exercise, answer, outcome, hints: 0, rewrites: 0, durationMs: 1 },
      { id: answer, answeredAt: 1 },
    ),
  }
}

test('la risposta giusta si salva come i quattro simboli in ordine', () => {
  const { attempt } = record(right.join(','))
  expect(attempt.outcome).toBe('correct')
  expect(attempt.answer).toBe(right.join(','))
  expect(attempt.answer.split(',')).toHaveLength(4)
})

test('l’errore della prima scrittura sbagliata va e torna', () => {
  const [first = '∈', ...rest] = right
  const answer = [swapped[first], ...rest].join(',')
  const { outcome, attempt } = record(answer)
  expect(outcome.kind).toBe('misconception')
  expect(['element-as-subset', 'subset-as-element']).toContain(
    attempt.misconception,
  )

  const [entry] = latestAttempts([attempt], 'set.relations')
  if (!entry?.exercise) throw new Error('Esercizio non ricostruito')
  expect(entry.exercise).toEqual(exercise)
  expect(verify(entry.attempt.answer, entry.exercise)).toEqual(outcome)
  expect(entry.explanation).toMatch(/^Hai usato/)
})
