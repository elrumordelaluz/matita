import type { LiteralExpression } from './expression.ts'
import {
  unknownKind,
  type Exercise,
  type NumberExercise,
  type PolynomialExercise,
} from './generators.ts'
import { solveLiteral } from './literalSolver.ts'
import { recognise, type MisconceptionId } from './misconceptions.ts'
import { equalPolynomials } from './polynomial.ts'
import {
  readPolynomialAnswer,
  type PolynomialRewrite,
  type PolynomialRewriteReason,
} from './polynomialAnswer.ts'
import { equals, isInteger, rational, type Rational } from './rational.ts'
import { solveWithValues, substitute } from './value.ts'

// Il giudizio su una risposta. Vedi SPEC.md, "Verifica" e "Politica delle
// risposte": una risposta con il valore giusto in una forma non canonica non
// è né giusta né sbagliata, va riscritta.

/** Perché una risposta numero con il valore giusto va riscritta. */
export type NumberRewriteReason =
  'sign-at-denominator' | 'integer-as-fraction' | 'not-reduced' | 'decimal'

/** Perché una risposta con il valore giusto va riscritta. */
export type RewriteReason = NumberRewriteReason | PolynomialRewriteReason

/** La risposta come l'ha scritta lo studente, senza normalizzarla. */
export interface AnswerForm {
  /** Il TeX dell'anteprima, con i glifi di `toKatex`. */
  readonly tex: string
  /** Il nome accessibile dell'anteprima, con i glifi di `toText`. */
  readonly text: string
}

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
      readonly rewrite: NumberRewriteReason | null
      /** La risposta come scritta, per l'anteprima. */
      readonly form: AnswerForm
    }
  | { readonly ok: false; readonly message: string }

const sign = '([+\\-−]?)'
const integerPattern = new RegExp(`^${sign}(\\d+)$`)
const fractionPattern = new RegExp(`^${sign}(\\d+)\\s*/\\s*${sign}(\\d+)$`)
const decimalPattern = new RegExp(`^${sign}(\\d+)([.,])(\\d+)$`)
const mixedPattern = new RegExp(`^${sign}\\d+\\s+\\d+\\s*/\\s*\\d+$`)

const isMinus = (s: string | undefined) => s === '-' || s === '−'

function signed(magnitude: bigint, s: string | undefined): bigint {
  return isMinus(s) ? -magnitude : magnitude
}

// Il segno scritto ricompare nell'anteprima: il meno con i glifi delle
// formule, trattino in TeX (`toKatex`) e meno tipografico nel testo (`toText`).
function writtenSign(s: string | undefined, minus: string): string {
  return !s ? '' : isMinus(s) ? minus : '+'
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
    const [, s, digits = ''] = integer
    const value = rational(signed(BigInt(digits), s))
    return {
      ok: true,
      value,
      rewrite: null,
      form: {
        tex: `${writtenSign(s, '-')}${digits}`,
        text: `${writtenSign(s, '−')}${digits}`,
      },
    }
  }

  const fraction = fractionPattern.exec(text)
  if (fraction) {
    const [, s, numDigits = '', denS, denDigits = ''] = fraction
    const num = BigInt(numDigits)
    const den = BigInt(denDigits)
    if (den === 0n)
      return { ok: false, message: 'Il denominatore non può essere zero.' }
    const value = rational(signed(num, s), signed(den, denS))
    // Il primo motivo che si vede, nell'ordine in cui lo si corregge.
    const rewrite: NumberRewriteReason | null = denS
      ? 'sign-at-denominator'
      : num % den === 0n
        ? 'integer-as-fraction'
        : gcd(num, den) > 1n
          ? 'not-reduced'
          : null
    return {
      ok: true,
      value,
      rewrite,
      form: {
        // Il segno del numeratore davanti, quello del denominatore resta lì.
        tex: `${writtenSign(s, '-')}\\frac{${numDigits}}{${writtenSign(denS, '-')}${denDigits}}`,
        text: `${writtenSign(s, '−')}${numDigits}/${writtenSign(denS, '−')}${denDigits}`,
      },
    }
  }

  const decimal = decimalPattern.exec(text)
  if (decimal) {
    const [, s, digits = '', separator = '', decimals = ''] = decimal
    const magnitude = BigInt(`${digits}${decimals}`)
    const value = rational(signed(magnitude, s), 10n ** BigInt(decimals.length))
    return {
      ok: true,
      value,
      rewrite: 'decimal',
      form: {
        // Il separatore resta quello scritto: la virgola vuole le graffe.
        tex: `${writtenSign(s, '-')}${digits}${separator === ',' ? '{,}' : '.'}${decimals}`,
        text: `${writtenSign(s, '−')}${digits}${separator}${decimals}`,
      },
    }
  }

  if (mixedPattern.test(text))
    return { ok: false, message: 'Scrivi il risultato come frazione.' }
  return { ok: false, message: 'Scrivi il risultato come numero.' }
}

/** La forma scritta della risposta, o nulla quando non si legge. */
export function answerForm(answer: string): AnswerForm | null {
  const reading = readAnswer(answer)
  return reading.ok ? reading.form : null
}

function rewriteMessage(reason: NumberRewriteReason, value: Rational): string {
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

/** Il giudizio su una risposta, secondo il tipo di risposta dell'esercizio. */
export function verify(answer: string, exercise: Exercise): Outcome {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return verifyNumber(answer, exercise)
    case 'polynomial':
      return verifyPolynomial(answer, exercise)
    default:
      return unknownKind(exercise)
  }
}

function verifyNumber(
  answer: string,
  exercise: NumberExercise<LiteralExpression>,
): Outcome {
  const reading = readAnswer(answer)
  if (!reading.ok) return { kind: 'invalid', message: reading.message }
  // Nel valore numerico gli errori si cercano dopo la sostituzione: è lì che
  // l'espressione diventa di numeri.
  const substitution = exercise.substitution ?? []
  const { result } = solveWithValues(exercise.expression, substitution)
  const numeric = substitute(exercise.expression, substitution)
  if (equals(reading.value, result)) {
    if (reading.rewrite === null) return { kind: 'correct' }
    return {
      kind: 'rewrite',
      reason: reading.rewrite,
      message: rewriteMessage(reading.rewrite, result),
    }
  }
  const misconception = recognise(reading.value, numeric, result)
  if (misconception)
    return {
      kind: 'misconception',
      misconception: misconception.id,
      explanation: misconception.explanation,
    }
  return { kind: 'wrong' }
}

function polynomialMessage(rewrite: PolynomialRewrite): string {
  switch (rewrite.reason) {
    case 'products':
      return 'Svolgi i prodotti.'
    case 'normal-form':
      return 'Scrivi ogni monomio in forma normale.'
    case 'coefficient-one':
      return 'Il coefficiente 1 non si scrive.'
    case 'exponent-one':
      return 'L’esponente 1 non si scrive.'
    case 'exponent-zero':
      return `${rewrite.letter ?? 'a'}⁰ vale 1.`
    case 'like-terms':
      return 'Somma i monomi simili.'
    default:
      // Il coefficiente si riscrive con le regole di Q.
      return rewriteMessage(rewrite.reason, rewrite.coefficient ?? rational(1n))
  }
}

// La risposta polinomio: il valore è la forma normale, confrontata con il
// risultato della soluzione. Vedi SPEC.md, "Calcolo letterale", "Risposte".
function verifyPolynomial(
  answer: string,
  exercise: PolynomialExercise,
): Outcome {
  const reading = readPolynomialAnswer(answer)
  if (!reading.ok) return { kind: 'invalid', message: reading.message }
  const { result } = solveLiteral(exercise.expression)
  if (!equalPolynomials(reading.value, result)) return { kind: 'wrong' }
  if (reading.rewrite === null) return { kind: 'correct' }
  return {
    kind: 'rewrite',
    reason: reading.rewrite.reason,
    message: polynomialMessage(reading.rewrite),
  }
}
