import {
  addPolynomials,
  areLike,
  constantPolynomial,
  monomialOf,
  multiplyPolynomials,
  negatePolynomial,
  polynomialOf,
  raisePolynomial,
  zeroPolynomial,
  type Monomial,
  type Polynomial,
} from './polynomial.ts'
import { rational, type Rational } from './rational.ts'
import type { AnswerForm, NumberRewriteReason } from './verify.ts'

// La lettura di una risposta polinomio, scritta dallo studente: `3a^2b -
// 1/2ab^2` o con le cifre ad apice. Le lettere attaccate si moltiplicano.
// La barra ha due letture: fra due numeri all'inizio di un monomio è la
// frazione del coefficiente (`1/2ab²`), dopo un monomio e seguita da un
// numero divide il coefficiente (`ab²/2`, `6a/3`). Una lettera o un gruppo
// dopo la barra non fanno un polinomio. La lettura non normalizza: ricorda
// come è scritta la risposta, per giudicarne la forma. Vedi SPEC.md,
// "Calcolo letterale", "Risposte".

/** Perché una risposta polinomio con il valore giusto va riscritta. */
export type PolynomialRewriteReason =
  | 'products'
  | 'normal-form'
  | 'coefficient-one'
  | 'exponent-one'
  | 'exponent-zero'
  | 'like-terms'

/** Il primo motivo per riscrivere, con quello che serve al messaggio. */
export interface PolynomialRewrite {
  readonly reason: PolynomialRewriteReason | NumberRewriteReason
  /** La lettera con l'esponente 0 scritto. */
  readonly letter?: string
  /** Il coefficiente da riscrivere come in Q. */
  readonly coefficient?: Rational
}

export type PolynomialReading =
  | {
      readonly ok: true
      readonly value: Polynomial
      readonly rewrite: PolynomialRewrite | null
      readonly form: AnswerForm
    }
  | { readonly ok: false; readonly message: string }

// Il coefficiente come è scritto: le cifre del numeratore, del denominatore
// e il segno al denominatore, o il decimale.
interface WrittenNumber {
  readonly value: Rational
  readonly numerator: string
  readonly denominator?: string
  readonly signAtDenominator?: boolean
  readonly decimal?: { readonly separator: string; readonly digits: string }
}

type Item =
  | { readonly kind: 'number'; readonly written: WrittenNumber }
  | {
      readonly kind: 'letter'
      readonly letter: string
      /** L'esponente scritto, nulla se non c'è. */
      readonly exponent: bigint | null
    }
  | {
      readonly kind: 'group'
      readonly sum: Sum
      readonly bracket: string
      readonly exponent: bigint | null
    }
  /** Un numero elevato: 2^3, mai in un monomio in forma normale. */
  | {
      readonly kind: 'power'
      readonly written: WrittenNumber
      readonly exponent: bigint
    }
  | { readonly kind: 'times'; readonly symbol: string }
  /** Divide il coefficiente per un numero: `/2` dopo un monomio, `: 2`. */
  | {
      readonly kind: 'divide'
      readonly symbol: string
      readonly by: WrittenNumber
    }

interface Term {
  readonly minus: boolean
  readonly items: readonly Item[]
}

type Sum = readonly Term[]

class Invalid extends Error {}

const notPolynomial = 'Non è un polinomio.'

const tokenPattern =
  /\s*(?:(\d+(?:[.,]\d+)?)|(⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)|([+\-−·×*:÷/^()[\]{}])|([a-z]))/y

const superscriptDigits = '⁰¹²³⁴⁵⁶⁷⁸⁹'

function fromSuperscript(text: string): bigint {
  const negative = text.startsWith('⁻')
  const digits = [...(negative ? text.slice(1) : text)]
    .map((c) => superscriptDigits.indexOf(c))
    .join('')
  return negative ? -BigInt(digits) : BigInt(digits)
}

function superscript(n: bigint): string {
  return [...`${n}`].map((d) => superscriptDigits[Number(d)] ?? '').join('')
}

const isSign = (t: string | undefined) => t === '+' || t === '-' || t === '−'
const isMinus = (t: string | undefined) => t === '-' || t === '−'
const closing: Record<string, string> = { '(': ')', '[': ']', '{': '}' }

function parse(text: string): Sum {
  const tokens: string[] = []
  tokenPattern.lastIndex = 0
  while (tokenPattern.lastIndex < text.trimEnd().length) {
    const match = tokenPattern.exec(text)
    if (!match) throw new Invalid('Scrivi il risultato come polinomio.')
    tokens.push(match[1] ?? match[2] ?? match[3] ?? match[4] ?? '')
  }
  let i = 0
  const fail = () => new Invalid('Scrivi il risultato come polinomio.')

  const number = (): WrittenNumber => {
    const t = tokens[i++] ?? ''
    const decimal = /^(\d+)([.,])(\d+)$/.exec(t)
    if (decimal) {
      const [, whole = '', separator = '', digits = ''] = decimal
      return {
        value: rational(BigInt(whole + digits), 10n ** BigInt(digits.length)),
        numerator: whole,
        decimal: { separator, digits },
      }
    }
    if (!/^\d+$/.test(t)) throw fail()
    return { value: rational(BigInt(t)), numerator: t }
  }
  // Il denominatore dopo la barra: un numero intero, con il segno se c'è.
  const denominator = (): { digits: string; minus: boolean } => {
    const minus = isMinus(tokens[i])
    if (isSign(tokens[i])) i++
    const t = tokens[i]
    if (t === undefined || /^[a-z]$/.test(t) || closing[t])
      throw new Invalid(notPolynomial)
    if (!/^\d+$/.test(t)) throw fail()
    i++
    if (BigInt(t) === 0n)
      throw new Invalid('Il denominatore non può essere zero.')
    return { digits: t, minus }
  }
  const exponent = (): bigint | null => {
    const t = tokens[i] ?? ''
    if (/^⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(t)) {
      i++
      const n = fromSuperscript(t)
      if (n < 0n) throw new Invalid(notPolynomial)
      return n
    }
    if (t !== '^') return null
    i++
    if (isMinus(tokens[i])) throw new Invalid(notPolynomial)
    const digits = tokens[i++]
    if (digits === undefined || !/^\d+$/.test(digits)) throw fail()
    return BigInt(digits)
  }

  const term = (minus: boolean): Term => {
    const items: Item[] = []
    let letters = false
    for (;;) {
      const t = tokens[i]
      if (t === undefined || isSign(t) || t === ')' || t === ']' || t === '}')
        break
      if (/^[a-z]$/.test(t)) {
        i++
        letters = true
        const e = exponent()
        // a3: non si sa se è a · 3 o a³.
        if (e === null && /^\d/.test(tokens[i] ?? ''))
          throw new Invalid('Scrivi l’esponente con ^.')
        items.push({ kind: 'letter', letter: t, exponent: e })
        continue
      }
      if (closing[t]) {
        i++
        // Un numero con il segno fra tonde è la scrittura del relativo: (−2).
        if (isSign(tokens[i]) && /^\d/.test(tokens[i + 1] ?? '')) {
          const save = i
          const minus = isMinus(tokens[i])
          i++
          const n = number()
          if (tokens[i] === closing[t]) {
            i++
            items.push({
              kind: 'number',
              written: minus
                ? { ...n, value: rational(-n.value.num, n.value.den) }
                : n,
            })
            continue
          }
          i = save
        }
        const sum = expression()
        if (tokens[i++] !== closing[t]) throw fail()
        items.push({ kind: 'group', sum, bracket: t, exponent: exponent() })
        continue
      }
      if (/^\d/.test(t)) {
        const n = number()
        // Fra due numeri all'inizio di un monomio la barra è la frazione.
        if (tokens[i] === '/' && !letters && !n.decimal) {
          i++
          const den = denominator()
          const value = rational(
            BigInt(n.numerator),
            den.minus ? -BigInt(den.digits) : BigInt(den.digits),
          )
          items.push({
            kind: 'number',
            written: {
              value,
              numerator: n.numerator,
              denominator: den.digits,
              ...(den.minus ? { signAtDenominator: true } : {}),
            },
          })
        } else {
          const e = exponent()
          items.push(
            e === null
              ? { kind: 'number', written: n }
              : { kind: 'power', written: n, exponent: e },
          )
        }
        continue
      }
      if (t === '/' || t === ':' || t === '÷') {
        i++
        if (items.length === 0) throw fail()
        const den = denominator()
        const by = BigInt(den.digits)
        items.push({
          kind: 'divide',
          symbol: t,
          by: {
            value: rational(den.minus ? -by : by),
            numerator: den.digits,
          },
        })
        continue
      }
      if (t === '·' || t === '×' || t === '*') {
        i++
        items.push({ kind: 'times', symbol: t })
        continue
      }
      throw fail()
    }
    const last = items.at(-1)
    if (!last || last.kind === 'times') throw fail()
    return { minus, items }
  }

  function expression(): Sum {
    const terms: Term[] = []
    let minus = false
    if (isSign(tokens[i])) {
      minus = isMinus(tokens[i])
      i++
    }
    for (;;) {
      if (isSign(tokens[i])) throw new Invalid('Scrivi un solo segno.')
      terms.push(term(minus))
      if (!isSign(tokens[i])) return terms
      minus = isMinus(tokens[i])
      i++
    }
  }

  const sum = expression()
  if (i < tokens.length) throw fail()
  return sum
}

// Il valore, con le regole giuste.

function itemsValue(items: readonly Item[]): Polynomial {
  let coefficient = rational(1n)
  const letters: [string, bigint][] = []
  let product = constantPolynomial(rational(1n))
  for (const item of items) {
    switch (item.kind) {
      case 'number':
        product = multiplyPolynomials(
          product,
          constantPolynomial(item.written.value),
        )
        break
      case 'power':
        product = multiplyPolynomials(
          product,
          raisePolynomial(
            constantPolynomial(item.written.value),
            item.exponent,
          ),
        )
        break
      case 'letter':
        letters.push([item.letter, item.exponent ?? 1n])
        break
      case 'group':
        product = multiplyPolynomials(
          product,
          raisePolynomial(sumValue(item.sum), item.exponent ?? 1n),
        )
        break
      case 'divide':
        coefficient = rational(
          coefficient.num * item.by.value.den,
          coefficient.den * item.by.value.num,
        )
        break
      case 'times':
        break
    }
  }
  return multiplyPolynomials(
    product,
    polynomialOf([monomialOf(coefficient, letters)]),
  )
}

function termValue(term: Term): Polynomial {
  const value = itemsValue(term.items)
  return term.minus ? negatePolynomial(value) : value
}

function sumValue(sum: Sum): Polynomial {
  return sum.reduce(
    (total, t) => addPolynomials(total, termValue(t)),
    zeroPolynomial,
  )
}

// La forma: il primo motivo per riscrivere, nell'ordine in cui si corregge.

function hasGroup(sum: Sum): boolean {
  return sum.some((t) => t.items.some((item) => item.kind === 'group'))
}

// Un monomio in forma normale ha al più un numero, davanti, o una barra
// con un numero dopo le lettere; nessun segno di prodotto e lettere diverse.
function inNormalForm({ items }: Term): boolean {
  const letters = items.flatMap((item) =>
    item.kind === 'letter' ? [item.letter] : [],
  )
  return (
    new Set(letters).size === letters.length &&
    items.every((item, j) => {
      switch (item.kind) {
        case 'letter':
          return true
        case 'number':
          return j === 0
        case 'divide':
          return (
            item.symbol === '/' &&
            j === items.length - 1 &&
            items[j - 1]?.kind === 'letter'
          )
        default:
          return false
      }
    })
  )
}

// Il coefficiente come lo giudica Q: la frazione scritta, o il numero
// davanti diviso per quello dopo la barra.
function writtenCoefficient(term: Term): WrittenNumber | null {
  const first = term.items[0]
  const last = term.items.at(-1)
  const leading = first?.kind === 'number' ? first.written : null
  if (last?.kind === 'divide' && last !== first) {
    const numerator = leading?.numerator ?? '1'
    return {
      value: rational(BigInt(numerator), BigInt(last.by.numerator)),
      numerator,
      denominator: last.by.numerator,
    }
  }
  return leading
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b]
  return a < 0n ? -a : a
}

function coefficientReason(n: WrittenNumber): NumberRewriteReason | null {
  if (n.signAtDenominator) return 'sign-at-denominator'
  if (n.decimal) return 'decimal'
  if (n.denominator === undefined) return null
  const num = BigInt(n.numerator)
  const den = BigInt(n.denominator)
  if (num % den === 0n) return 'integer-as-fraction'
  return gcd(num, den) > 1n ? 'not-reduced' : null
}

function firstRewrite(sum: Sum): PolynomialRewrite | null {
  if (hasGroup(sum)) return { reason: 'products' }
  if (!sum.every(inNormalForm)) return { reason: 'normal-form' }
  const letterItems = sum.flatMap((t) =>
    t.items.flatMap((item) => (item.kind === 'letter' ? [item] : [])),
  )
  if (
    sum.some((t) => {
      const c = writtenCoefficient(t)
      return (
        c !== null &&
        c.denominator === undefined &&
        !c.decimal &&
        c.numerator === '1' &&
        t.items.length > 1
      )
    })
  )
    return { reason: 'coefficient-one' }
  if (letterItems.some((l) => l.exponent === 1n))
    return { reason: 'exponent-one' }
  const zero = letterItems.find((l) => l.exponent === 0n)
  if (zero) return { reason: 'exponent-zero', letter: zero.letter }
  const monomials = sum
    .map((t) => [...termValue(t).values()][0])
    .filter((m): m is Monomial => m !== undefined)
  if (
    monomials.some((m, j) => monomials.slice(0, j).some((p) => areLike(p, m)))
  )
    return { reason: 'like-terms' }
  for (const t of sum) {
    const c = writtenCoefficient(t)
    const reason = c && coefficientReason(c)
    if (c && reason) return { reason, coefficient: c.value }
  }
  return null
}

// L'anteprima: la risposta come è scritta, con i glifi delle formule.

function numberForm(n: WrittenNumber, tex: boolean): string {
  if (n.decimal)
    return `${n.numerator}${tex && n.decimal.separator === ',' ? '{,}' : n.decimal.separator}${n.decimal.digits}`
  const sign = n.value.num < 0n && !n.signAtDenominator ? (tex ? '-' : '−') : ''
  if (n.denominator === undefined)
    return n.value.num < 0n ? `(${sign}${n.numerator})` : n.numerator
  const den = `${n.signAtDenominator ? (tex ? '-' : '−') : ''}${n.denominator}`
  return tex ? `\\frac{${n.numerator}}{${den}}` : `${n.numerator}/${den}`
}

function sumForm(sum: Sum, tex: boolean): string {
  return sum
    .map((t, j) => {
      const sign = t.minus ? (tex ? '-' : '−') : '+'
      const body = t.items.map((item) => itemForm(item, tex)).join('')
      if (j === 0) return t.minus ? `${sign}${body}` : body
      return ` ${sign} ${body}`
    })
    .join('')
}

function power(base: string, exponent: bigint | null, tex: boolean): string {
  if (exponent === null) return base
  return tex ? `${base}^{${exponent}}` : `${base}${superscript(exponent)}`
}

function itemForm(item: Item, tex: boolean): string {
  switch (item.kind) {
    case 'number':
      return numberForm(item.written, tex)
    case 'power':
      return power(numberForm(item.written, tex), item.exponent, tex)
    case 'letter':
      return power(item.letter, item.exponent, tex)
    case 'group': {
      const open = tex && item.bracket === '{' ? '\\{' : item.bracket
      const close = closing[item.bracket] ?? ')'
      const end = tex && close === '}' ? '\\}' : close
      return power(`${open}${sumForm(item.sum, tex)}${end}`, item.exponent, tex)
    }
    case 'times':
      return tex ? ' \\cdot ' : ' · '
    case 'divide':
      return `${item.symbol === '/' ? '/' : tex ? ' \\mathbin{:} ' : ' : '}${item.by.numerator}`
  }
}

/** Legge una risposta polinomio, o dice perché non si legge. */
export function readPolynomialAnswer(answer: string): PolynomialReading {
  const text = answer.trim()
  if (text === '') return { ok: false, message: 'Scrivi il risultato.' }
  if (/^[+\-−]{2,}/.test(text))
    return { ok: false, message: 'Scrivi un solo segno.' }
  try {
    const sum = parse(text)
    return {
      ok: true,
      value: sumValue(sum),
      rewrite: firstRewrite(sum),
      form: { text: sumForm(sum, false), tex: sumForm(sum, true) },
    }
  } catch (error) {
    if (error instanceof Invalid) return { ok: false, message: error.message }
    if (error instanceof RangeError)
      return { ok: false, message: 'Scrivi il risultato come polinomio.' }
    throw error
  }
}
