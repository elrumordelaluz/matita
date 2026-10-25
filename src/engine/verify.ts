import type { Exercise } from './generators.ts'
import { equals, rational, type Rational } from './rational.ts'
import { solve } from './solver.ts'

// Il giudizio su una risposta. Vedi SPEC.md, "Verifica" e "Politica delle
// risposte". Gli esiti `rewrite` e `misconception` arrivano con le slice che
// li usano.

export type Outcome =
  | { readonly kind: 'correct' }
  | { readonly kind: 'wrong' }
  | { readonly kind: 'invalid'; readonly message: string }

type Reading =
  | { readonly ok: true; readonly value: Rational }
  | { readonly ok: false; readonly message: string }

export function readAnswer(answer: string): Reading {
  const text = answer.trim()
  if (text === '') return { ok: false, message: 'Scrivi il risultato.' }
  if (/^[+\-−]{2,}/.test(text))
    return { ok: false, message: 'Scrivi un solo segno.' }
  const match = /^([+\-−]?)(\d+)$/.exec(text)
  if (!match) return { ok: false, message: 'Scrivi il risultato come numero.' }
  const magnitude = BigInt(match[2] ?? '')
  const negative = match[1] === '-' || match[1] === '−'
  return { ok: true, value: rational(negative ? -magnitude : magnitude) }
}

export function verify(answer: string, exercise: Exercise): Outcome {
  const reading = readAnswer(answer)
  if (!reading.ok) return { kind: 'invalid', message: reading.message }
  const { result } = solve(exercise.expression)
  return equals(reading.value, result) ? { kind: 'correct' } : { kind: 'wrong' }
}
