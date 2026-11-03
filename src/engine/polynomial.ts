import {
  binary,
  isAddSub,
  literal,
  monomial,
  type LiteralExpression,
} from './expression.ts'
import { raise } from './power.ts'
import {
  add,
  div,
  equals,
  mul,
  rational,
  sub,
  type Rational,
} from './rational.ts'

// Monomi e polinomi in forma normale: il dato del calcolo letterale, con le
// sue operazioni, tutte pure e in `bigint`. Due polinomi hanno lo stesso
// valore se hanno la stessa forma normale: il confronto è esatto. Vedi
// SPEC.md, "Calcolo letterale", "Il dato".

/**
 * Un monomio in forma normale: un solo coefficiente e lettere diverse, con
 * esponenti positivi, in ordine alfabetico. Senza lettere è un numero.
 */
export interface Monomial {
  readonly coefficient: Rational
  readonly letters: ReadonlyMap<string, bigint>
}

/**
 * Un polinomio in forma normale: dalla parte letterale di ogni termine al
 * termine, senza coefficienti nulli. I termini stanno nell'ordine in cui
 * sono comparsi, che è quello della soluzione; l'uguaglianza non lo guarda.
 */
export type Polynomial = ReadonlyMap<string, Monomial>

/** Il monomio in forma normale da un coefficiente e da lettere qualsiasi. */
export function monomialOf(
  coefficient: Rational,
  letters: Iterable<readonly [string, bigint]> = [],
): Monomial {
  const exponents = new Map<string, bigint>()
  for (const [letter, exponent] of letters)
    exponents.set(letter, (exponents.get(letter) ?? 0n) + exponent)
  const sorted = [...exponents]
    .filter(([, exponent]) => exponent !== 0n)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return { coefficient, letters: new Map(sorted) }
}

/** La parte letterale come chiave: `a2b1`; vuota per un numero. */
export function letterPart(m: Monomial): string {
  return [...m.letters].map(([l, n]) => `${l}${n}`).join('')
}

/** Due monomi simili: la stessa parte letterale. */
export function areLike(a: Monomial, b: Monomial): boolean {
  return letterPart(a) === letterPart(b)
}

/** La somma dei monomi, con i simili ridotti nell'ordine di prima comparsa. */
export function polynomialOf(terms: Iterable<Monomial>): Polynomial {
  const sum = new Map<string, Monomial>()
  for (const term of terms) {
    const key = letterPart(term)
    const previous = sum.get(key)
    sum.set(key, {
      coefficient: previous
        ? add(previous.coefficient, term.coefficient)
        : term.coefficient,
      letters: term.letters,
    })
  }
  for (const [key, term] of sum)
    if (term.coefficient.num === 0n) sum.delete(key)
  return sum
}

/** Il polinomio nullo. */
export const zeroPolynomial: Polynomial = new Map()

export function constantPolynomial(r: Rational): Polynomial {
  return polynomialOf([monomialOf(r)])
}

export function addPolynomials(p: Polynomial, q: Polynomial): Polynomial {
  return polynomialOf([...p.values(), ...q.values()])
}

export function negatePolynomial(p: Polynomial): Polynomial {
  return polynomialOf(
    [...p.values()].map((m) => ({
      ...m,
      coefficient: sub(rational(0n), m.coefficient),
    })),
  )
}

export function subtractPolynomials(p: Polynomial, q: Polynomial): Polynomial {
  return addPolynomials(p, negatePolynomial(q))
}

export function multiplyMonomials(a: Monomial, b: Monomial): Monomial {
  return monomialOf(mul(a.coefficient, b.coefficient), [
    ...a.letters,
    ...b.letters,
  ])
}

export function multiplyPolynomials(p: Polynomial, q: Polynomial): Polynomial {
  const products: Monomial[] = []
  for (const a of p.values())
    for (const b of q.values()) products.push(multiplyMonomials(a, b))
  return polynomialOf(products)
}

/** Il monomio elevato a un naturale: si eleva il coefficiente, gli esponenti si moltiplicano. */
export function raiseMonomial(m: Monomial, exponent: bigint): Monomial {
  if (exponent < 0n) throw new RangeError('Esponente negativo')
  return monomialOf(
    raise(m.coefficient, exponent),
    [...m.letters].map(([l, n]) => [l, n * exponent] as const),
  )
}

/** Il polinomio elevato a un naturale; un numero anche a un intero negativo. */
export function raisePolynomial(p: Polynomial, exponent: bigint): Polynomial {
  const single = asMonomial(p)
  if (single && single.letters.size === 0)
    return constantPolynomial(raise(single.coefficient, exponent))
  if (exponent < 0n) throw new RangeError('Esponente negativo')
  let result = constantPolynomial(rational(1n))
  for (let i = 0n; i < exponent; i++) result = multiplyPolynomials(result, p)
  return result
}

/**
 * Il quoziente fra monomi, quando è un monomio: il dividendo deve avere
 * tutte le lettere del divisore con esponente maggiore o uguale.
 */
export function divideMonomials(a: Monomial, b: Monomial): Monomial | null {
  if (b.coefficient.num === 0n) throw new RangeError('Divisione per zero')
  const letters: [string, bigint][] = [...a.letters]
  for (const [letter, exponent] of b.letters) {
    const own = a.letters.get(letter) ?? 0n
    if (own < exponent) return null
    letters.push([letter, -exponent])
  }
  return monomialOf(div(a.coefficient, b.coefficient), letters)
}

/** Il polinomio diviso per un monomio, quando ogni termine si divide. */
export function dividePolynomial(
  p: Polynomial,
  m: Monomial,
): Polynomial | null {
  const quotients: Monomial[] = []
  for (const term of p.values()) {
    const q = divideMonomials(term, m)
    if (!q) return null
    quotients.push(q)
  }
  return polynomialOf(quotients)
}

/** L'unico termine, se il polinomio è un monomio non nullo. */
export function asMonomial(p: Polynomial): Monomial | null {
  if (p.size !== 1) return null
  const [m] = p.values()
  return m ?? null
}

/** Uguali se hanno gli stessi termini, in qualunque ordine. */
export function equalPolynomials(p: Polynomial, q: Polynomial): boolean {
  if (p.size !== q.size) return false
  for (const [key, m] of p) {
    const other = q.get(key)
    if (!other || !equals(m.coefficient, other.coefficient)) return false
  }
  return true
}

// La resa: le lettere in ordine alfabetico, i termini in ordine, con + e −
// fra monomi positivi come sul libro.

/** Il monomio come monomio scritto, o come numero se non ha lettere. */
export function monomialExpression(m: Monomial): LiteralExpression {
  return m.letters.size === 0
    ? literal(m.coefficient)
    : monomial(m.coefficient, [...m.letters])
}

const positive = (m: Monomial): Monomial =>
  m.coefficient.num < 0n
    ? { ...m, coefficient: sub(rational(0n), m.coefficient) }
    : m

/** Il polinomio come somma di monomi scritti; lo zero è il numero 0. */
export function polynomialExpression(p: Polynomial): LiteralExpression {
  const [first, ...rest] = p.values()
  if (!first) return literal(rational(0n))
  return rest.reduce<LiteralExpression>(
    (sum, m) =>
      binary(
        m.coefficient.num < 0n ? '-' : '+',
        sum,
        monomialExpression(positive(m)),
      ),
    monomialExpression(first),
  )
}

/**
 * Il valore di un'espressione letterale, calcolato con le regole giuste: la
 * forma normale del suo risultato.
 */
export function polynomialValue(e: LiteralExpression): Polynomial {
  switch (e.kind) {
    case 'number':
      return constantPolynomial(e.value)
    case 'monomial':
      return polynomialOf([
        monomialOf(
          e.coefficient,
          e.letters.map((l) => [l.letter, l.exponent] as const),
        ),
      ])
    case 'group': {
      const inner = polynomialValue(e.inner)
      return e.negated ? negatePolynomial(inner) : inner
    }
    case 'binary': {
      const left = polynomialValue(e.left)
      if (e.op === '^') {
        if (e.right.kind !== 'number' || e.right.value.den !== 1n)
          throw new RangeError('Esponente non intero')
        return raisePolynomial(left, e.right.value.num)
      }
      const right = polynomialValue(e.right)
      if (isAddSub(e.op))
        return e.op === '+'
          ? addPolynomials(left, right)
          : subtractPolynomials(left, right)
      if (e.op === '×') return multiplyPolynomials(left, right)
      const divisor = asMonomial(right)
      if (!divisor) throw new RangeError('Divisione per un polinomio')
      const quotient = dividePolynomial(left, divisor)
      if (!quotient) throw new RangeError('Il quoziente non è un polinomio')
      return quotient
    }
  }
}
