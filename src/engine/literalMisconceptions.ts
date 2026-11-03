import { isAddSub, type LiteralExpression } from './expression.ts'
import { misconceptions, type MisconceptionId } from './misconceptions.ts'
import {
  addPolynomials,
  asMonomial,
  constantPolynomial,
  divideMonomials,
  equalPolynomials,
  monomialOf,
  multiplyMonomials,
  negatePolynomial,
  polynomialOf,
  raiseMonomial,
  raisePolynomial,
  type Monomial,
  type Polynomial,
} from './polynomial.ts'
import { raise } from './power.ts'
import { rational } from './rational.ts'

// Gli errori tipici del calcolo letterale. Come per i numeri, ognuno è una
// variante sbagliata di una regola del risolutore: il motore valuta
// l'esercizio con la regola sbagliata e confronta la forma normale del
// risultato con quella della risposta. Dove la regola è la stessa delle
// potenze di numeri l'errore si riusa, con la sua spiegazione. Vedi
// SPEC.md, "Calcolo letterale", "Errori tipici".

export interface LiteralMisconception {
  readonly id: MisconceptionId
  readonly explanation: string
  /** I valori che dà l'esercizio svolto con la regola sbagliata. */
  wrongResults(e: LiteralExpression): Polynomial[]
}

// Le regole con cui si svolgono le operazioni fra monomi: quelle giuste, o
// una sbagliata alla volta.
interface Rules {
  readonly product: (a: Monomial, b: Monomial) => Monomial
  /** Nulla quando il quoziente non è un monomio. */
  readonly quotient: (a: Monomial, b: Monomial) => Monomial | null
  readonly power: (m: Monomial, exponent: bigint) => Monomial
}

const correctRules: Rules = {
  product: multiplyMonomials,
  quotient: divideMonomials,
  power: raiseMonomial,
}

function product(p: Polynomial, q: Polynomial, rules: Rules): Polynomial {
  const terms: Monomial[] = []
  for (const a of p.values())
    for (const b of q.values()) terms.push(rules.product(a, b))
  return polynomialOf(terms)
}

function quotient(p: Polynomial, q: Polynomial, rules: Rules): Polynomial {
  const divisor = asMonomial(q)
  if (!divisor) throw new RangeError('Divisione per un polinomio')
  const terms: Monomial[] = []
  for (const a of p.values()) {
    const t = rules.quotient(a, divisor)
    if (!t) throw new RangeError('Il quoziente non è un monomio')
    terms.push(t)
  }
  return polynomialOf(terms)
}

function evaluate(e: LiteralExpression, rules: Rules): Polynomial {
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
      const inner = evaluate(e.inner, rules)
      return e.negated ? negatePolynomial(inner) : inner
    }
    case 'binary': {
      const left = evaluate(e.left, rules)
      if (e.op === '^') {
        if (e.right.kind !== 'number' || e.right.value.den !== 1n)
          throw new RangeError('Esponente non intero')
        const exponent = e.right.value.num
        const base = asMonomial(left)
        return base && base.letters.size > 0
          ? polynomialOf([rules.power(base, exponent)])
          : raisePolynomial(left, exponent)
      }
      const right = evaluate(e.right, rules)
      if (isAddSub(e.op))
        return addPolynomials(
          left,
          e.op === '+' ? right : negatePolynomial(right),
        )
      return e.op === '×'
        ? product(left, right, rules)
        : quotient(left, right, rules)
    }
  }
}

// Una regola sbagliata può portare a un conto impossibile: lì non c'è un
// valore da confrontare.
function attempt(e: LiteralExpression, rules: Rules): Polynomial[] {
  try {
    return [evaluate(e, { ...correctRules, ...rules })]
  } catch (error) {
    if (error instanceof RangeError) return []
    throw error
  }
}

// a² · a³ come a⁶: gli esponenti delle lettere comuni moltiplicati, e nel
// quoziente divisi, quando la divisione è esatta.
function multipliedExponents(a: Monomial, b: Monomial): Monomial {
  return monomialOf(
    multiplyMonomials(a, b).coefficient,
    [...new Set([...a.letters.keys(), ...b.letters.keys()])].map((l) => {
      const m = a.letters.get(l)
      const n = b.letters.get(l)
      return [l, m && n ? m * n : (m ?? n ?? 0n)] as const
    }),
  )
}

function dividedExponents(a: Monomial, b: Monomial): Monomial | null {
  const correct = divideMonomials(a, b)
  if (!correct) return null
  return monomialOf(
    correct.coefficient,
    [...a.letters].map(([l, m]) => {
      const n = b.letters.get(l)
      return [l, n && m % n === 0n ? m / n : n ? m - n : m] as const
    }),
  )
}

// (a³)² come a⁵: per le lettere che hanno già un esponente, esponenti
// sommati invece che moltiplicati.
function addedExponents(m: Monomial, exponent: bigint): Monomial {
  return monomialOf(
    raise(m.coefficient, exponent),
    [...m.letters].map(
      ([l, n]) => [l, n > 1n ? n + exponent : n * exponent] as const,
    ),
  )
}

// (−2a)² come −4a²: il segno del coefficiente resta, qualunque sia
// l'esponente.
function signKept(m: Monomial, exponent: bigint): Monomial {
  const raised = raiseMonomial(m, exponent)
  if (m.coefficient.num > 0n || raised.coefficient.num < 0n) return raised
  return {
    ...raised,
    coefficient: rational(-raised.coefficient.num, raised.coefficient.den),
  }
}

// (3a²)² come 3a⁴: si eleva solo la parte letterale. Con un coefficiente
// negativo il segno resta com'è scritto, (−3a²)² come −3a⁴, oppure segue la
// regola dei segni, come 3a⁴: sono due letture dello stesso errore.
function coefficientNotRaised(m: Monomial, exponent: bigint): Monomial {
  return { ...raiseMonomial(m, exponent), coefficient: m.coefficient }
}

function coefficientNotRaisedSigned(m: Monomial, exponent: bigint): Monomial {
  const raised = raiseMonomial(m, exponent)
  const { num, den } = m.coefficient
  const magnitude = num < 0n ? -num : num
  return {
    ...raised,
    coefficient: rational(
      raised.coefficient.num < 0n ? -magnitude : magnitude,
      den,
    ),
  }
}

const explanationOfNumbers = (id: MisconceptionId): string =>
  misconceptions.find((m) => m.id === id)?.explanation ?? ''

export const literalMisconceptions: readonly LiteralMisconception[] = [
  {
    id: 'coefficient-not-raised',
    explanation:
      'Hai elevato solo la parte letterale. La potenza vale per tutto il monomio, coefficiente compreso: (3a²)² = 3² · a⁴ = 9a⁴, non 3a⁴.',
    wrongResults: (e) => [
      ...attempt(e, { ...correctRules, power: coefficientNotRaised }),
      ...attempt(e, { ...correctRules, power: coefficientNotRaisedSigned }),
    ],
  },
  {
    id: 'negative-base-sign-kept',
    explanation: explanationOfNumbers('negative-base-sign-kept'),
    wrongResults: (e) => attempt(e, { ...correctRules, power: signKept }),
  },
  {
    id: 'power-of-power-adds-exponents',
    explanation: explanationOfNumbers('power-of-power-adds-exponents'),
    wrongResults: (e) => attempt(e, { ...correctRules, power: addedExponents }),
  },
  {
    id: 'same-base-multiplies-exponents',
    explanation: explanationOfNumbers('same-base-multiplies-exponents'),
    wrongResults: (e) =>
      attempt(e, {
        ...correctRules,
        product: multipliedExponents,
        quotient: dividedExponents,
      }),
  },
]

/** L'errore tipico che spiega una risposta polinomio sbagliata, se c'è. */
export function recogniseLiteral(
  answer: Polynomial,
  e: LiteralExpression,
  correct: Polynomial,
): LiteralMisconception | undefined {
  if (equalPolynomials(answer, correct)) return undefined
  return literalMisconceptions.find((m) =>
    m.wrongResults(e).some((wrong) => equalPolynomials(wrong, answer)),
  )
}

/** Vero se la regola sbagliata dà sempre un risultato diverso da quello giusto. */
export function isVisibleLiteral(
  id: MisconceptionId,
  e: LiteralExpression,
  correct: Polynomial,
): boolean {
  const wrong =
    literalMisconceptions.find((m) => m.id === id)?.wrongResults(e) ?? []
  return wrong.length > 0 && wrong.every((w) => !equalPolynomials(w, correct))
}

/** La spiegazione di un errore tipico, dei numeri o del calcolo letterale. */
export function misconceptionExplanation(id: string): string | undefined {
  return (
    literalMisconceptions.find((m) => m.id === id)?.explanation ??
    misconceptions.find((m) => m.id === id)?.explanation
  )
}
