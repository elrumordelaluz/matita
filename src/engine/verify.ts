import type { Exercise } from './generators.ts'
import { recognise, type MisconceptionId } from './misconceptions.ts'
import { equals, isInteger, rational, type Rational } from './rational.ts'
import { solve } from './solver.ts'

// Il giudizio su una risposta. Vedi SPEC.md, "Verifica" e "Politica delle
// risposte": una risposta con il valore giusto in una forma non canonica non
// è né giusta né sbagliata, va riscritta.

/** Perché una risposta con il valore giusto va riscritta. */
export type RewriteReason =
  'sign-at-denominator' | 'integer-as-fraction' | 'not-reduced' | 'decimal'

export type Outcome =
  | { readonly kind: 'correct' }
  | {
      readonly kind: 'rewrite'
      readonly reason: RewriteReason
      readonly message: string
    }
  | {
      readonly kind: 'misconception'
      readonly misconception: MisconceptionId
      readonly explanation: string
    }
  | { readonly kind: 'wrong' }
  | { readonly kind: 'invalid'; readonly message: string }

type Reading =
  | {
      readonly ok: true
      readonly value: Rational
      /** Il motivo per riscriverla, se la forma non è canonica. */
      readonly rewrite: RewriteReason | null
    }
  | { readonly ok: false; readonly message: string }

const sign = '([+\\-−]?)'
const integerPattern = new RegExp(`^${sign}(\\d+)$`)
const fractionPattern = new RegExp(`^${sign}(\\d+)\\s*/\\s*${sign}(\\d+)$`)
const decimalPattern = new RegExp(`^${sign}(\\d+)[.,](\\d+)$`)
const mixedPattern = new RegExp(`^${sign}\\d+\\s+\\d+\\s*/\\s*\\d+$`)

const isMinus = (s: string | undefined) => s === '-' || s === '−'

function signed(magnitude: bigint, s: string | undefined): bigint {
  return isMinus(s) ? -magnitude : magnitude
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b]
  return a
}

export function readAnswer(answer: string): Reading {
  const text = answer.trim()
  if (text === '') return { ok: false, message: 'Scrivi il risultato.' }
  if (/^[+\-−]{2,}/.test(text))
    return { ok: false, message: 'Scrivi un solo segno.' }

  const integer = integerPattern.exec(text)
  if (integer) {
    const value = rational(signed(BigInt(integer[2] ?? ''), integer[1]))
    return { ok: true, value, rewrite: null }
  }

  const fraction = fractionPattern.exec(text)
  if (fraction) {
    const num = BigInt(fraction[2] ?? '')
    const den = BigInt(fraction[4] ?? '')
    if (den === 0n)
      return { ok: false, message: 'Il denominatore non può essere zero.' }
    const value = rational(signed(num, fraction[1]), signed(den, fraction[3]))
    // Il primo motivo che si vede, nell'ordine in cui lo si corregge.
    const rewrite: RewriteReason | null = fraction[3]
      ? 'sign-at-denominator'
      : num % den === 0n
        ? 'integer-as-fraction'
        : gcd(num, den) > 1n
          ? 'not-reduced'
          : null
    return { ok: true, value, rewrite }
  }

  const decimal = decimalPattern.exec(text)
  if (decimal) {
    const digits = decimal[3] ?? ''
    const magnitude = BigInt(`${decimal[2] ?? ''}${digits}`)
    const value = rational(
      signed(magnitude, decimal[1]),
      10n ** BigInt(digits.length),
    )
    return { ok: true, value, rewrite: 'decimal' }
  }

  if (mixedPattern.test(text))
    return { ok: false, message: 'Scrivi il risultato come frazione.' }
  return { ok: false, message: 'Scrivi il risultato come numero.' }
}

function rewriteMessage(reason: RewriteReason, value: Rational): string {
  switch (reason) {
    case 'sign-at-denominator':
      return 'Il segno va davanti alla frazione.'
    case 'integer-as-fraction':
      return 'Il risultato è un numero intero.'
    case 'not-reduced':
      return 'Riduci ai minimi termini.'
    case 'decimal':
      // 2,0 non va scritto come frazione: è un intero.
      return isInteger(value)
        ? 'Il risultato è un numero intero.'
        : 'Scrivi il risultato come frazione.'
  }
}

export function verify(answer: string, exercise: Exercise): Outcome {
  const reading = readAnswer(answer)
  if (!reading.ok) return { kind: 'invalid', message: reading.message }
  const { result } = solve(exercise.expression)
  if (equals(reading.value, result)) {
    if (reading.rewrite === null) return { kind: 'correct' }
    return {
      kind: 'rewrite',
      reason: reading.rewrite,
      message: rewriteMessage(reading.rewrite, result),
    }
  }
  const misconception = recognise(reading.value, exercise.expression, result)
  if (misconception)
    return {
      kind: 'misconception',
      misconception: misconception.id,
      explanation: misconception.explanation,
    }
  return { kind: 'wrong' }
}
