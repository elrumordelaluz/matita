import type { Exercise, Outcome } from '../engine/index.ts'
import type { Attempt, AttemptOutcome } from './attempt.ts'

// Dall'esercizio chiuso nella pratica al tentativo da salvare.

export interface PracticeResult {
  readonly exercise: Exercise
  readonly answer: string
  readonly outcome: Outcome
  readonly hints: number
  readonly rewrites: number
  readonly durationMs: number
}

export function attemptFromPractice(
  result: PracticeResult,
  { id, answeredAt }: { id: string; answeredAt: number },
): Attempt {
  const { exercise, outcome } = result
  return {
    id,
    skill: exercise.skill,
    seed: exercise.seed,
    generatorVersion: exercise.generatorVersion,
    answer: result.answer,
    outcome: outcome.kind as AttemptOutcome,
    misconception: misconceptionId(outcome),
    hints: result.hints,
    rewrites: result.rewrites,
    durationMs: result.durationMs,
    answeredAt,
  }
}

// L'esito `misconception` del motore porta l'id dell'errore tipico in
// `misconception`. Letto senza nominare il membro, così il tipo regge anche
// prima che il motore lo esporti.
function misconceptionId(outcome: Outcome): string | null {
  const { misconception } = outcome as { misconception?: unknown }
  return typeof misconception === 'string' ? misconception : null
}
