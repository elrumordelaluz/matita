import {
  isAddSub,
  isNegatedPower,
  type LiteralExpression,
} from './expression.ts'
import { sumTerms } from './literalSolver.ts'
import { misconceptions, type MisconceptionId } from './misconceptions.ts'
import {
  addPolynomials,
  asMonomial,
  letterPart,
  constantPolynomial,
  divideMonomials,
  equalPolynomials,
  monomialExpression,
  monomialOf,
  multiplyMonomials,
  negatePolynomial,
  polynomialOf,
  raiseMonomial,
  raisePolynomial,
  zeroPolynomial,
  type Monomial,
  type Polynomial,
} from './polynomial.ts'
import { raise } from './power.ts'
import { add, rational } from './rational.ts'

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
  /** La somma algebrica dei termini, ciascuno con il suo segno. */
  readonly sum: (terms: readonly Term[]) => Polynomial
  /** Il gruppo preceduto dal meno, −(a − b), dai termini che ha dentro. */
  readonly minusGroup: (
    terms: readonly Term[],
    sum: (terms: readonly Term[]) => Polynomial,
  ) => Polynomial
  /** Un monomio per i termini di un polinomio, con la distributiva. */
  readonly distributive: (
    factor: Monomial,
    terms: readonly Monomial[],
    product: (a: Monomial, b: Monomial) => Monomial,
  ) => Monomial[]
  /** La potenza di un polinomio di più termini, dai suoi termini. */
  readonly polynomialPower: (
    terms: readonly Monomial[],
    exponent: bigint,
  ) => Polynomial
  /** (a + b)(a − b), dai termini a e b della somma. */
  readonly sumTimesDifference: (a: Monomial, b: Monomial) => Polynomial
}

/** Un termine di una somma: il suo valore con il segno e come è scritto. */
interface Term {
  readonly value: Polynomial
  readonly written: LiteralExpression
}

const correctSum = (terms: readonly Term[]): Polynomial =>
  terms.reduce((sum, t) => addPolynomials(sum, t.value), zeroPolynomial)

const correctRules: Rules = {
  product: multiplyMonomials,
  quotient: divideMonomials,
  power: raiseMonomial,
  sum: correctSum,
  minusGroup: (terms, sum) => negatePolynomial(sum(terms)),
  distributive: (factor, terms, product) =>
    terms.map((t) => product(factor, t)),
  polynomialPower: (terms, exponent) =>
    raisePolynomial(polynomialOf(terms), exponent),
  sumTimesDifference: (a, b) =>
    polynomialOf([raiseMonomial(a, 2n), negated(raiseMonomial(b, 2n))]),
}

const negated = (m: Monomial): Monomial => ({
  ...m,
  coefficient: rational(-m.coefficient.num, m.coefficient.den),
})

// I termini a e b di (a + b)(a − b), se i due binomi sono proprio questi.
function sumAndDifference(
  p: Polynomial,
  q: Polynomial,
): readonly [Monomial, Monomial] | null {
  const [a, b, ...rest] = p.values()
  const [c, d, ...others] = q.values()
  if (!a || !b || !c || !d || rest.length > 0 || others.length > 0) return null
  const same = (m: Monomial, n: Monomial) =>
    equalPolynomials(polynomialOf([m]), polynomialOf([n]))
  return same(a, c) && same(b, negated(d)) ? [a, b] : null
}

function product(p: Polynomial, q: Polynomial, rules: Rules): Polynomial {
  // Un monomio per un polinomio, da una parte o dall'altra.
  const [factor, other] = p.size === 1 ? [p, q] : [q, p]
  const single = asMonomial(factor)
  if (single && other.size > 1)
    return polynomialOf(
      rules.distributive(single, [...other.values()], rules.product),
    )
  const sumDifference = sumAndDifference(p, q)
  if (sumDifference) return rules.sumTimesDifference(...sumDifference)
  const terms: Monomial[] = []
  for (const a of p.values())
    for (const b of q.values()) terms.push(rules.product(a, b))
  // Fra i prodotti di due polinomi ci sono dei simili, e la loro riduzione
  // è una somma come le altre: (x + 3y)(2x − 4y) = 2x² − 4xy + 6xy − 12y².
  const product = polynomialOf(terms)
  if (product.size === terms.length) return product
  return rules.sum(
    terms.map((m) => ({
      value: polynomialOf([m]),
      written: monomialExpression(m),
    })),
  )
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

// Un gruppo di più termini preceduto dal meno: dopo il − di una somma, o con
// il meno suo all'inizio, −(a − b).
function afterMinus(
  minus: boolean,
  node: LiteralExpression,
): node is Extract<LiteralExpression, { kind: 'group' }> {
  return (
    node.kind === 'group' &&
    !isNegatedPower(node) &&
    minus !== (node.negated === true) &&
    sumTerms(node.inner).length > 1
  )
}

// I termini di una somma, ciascuno con il suo segno.
function termsOf(e: LiteralExpression, rules: Rules): Term[] {
  return sumTerms(e).map(({ minus, node }) => {
    if (afterMinus(minus, node))
      return {
        value: rules.minusGroup(termsOf(node.inner, rules), rules.sum),
        written: node,
      }
    const value = evaluate(node, rules)
    // Dopo il meno anche un prodotto o una potenza che diventa un polinomio
    // va fra parentesi: 5x − 2x(x + 3) = 5x − (2x² + 6x). I suoi termini li
    // scrive il risolutore, già ridotti: si sommano con la regola giusta.
    if (minus && value.size > 1)
      return {
        value: rules.minusGroup(
          [...value.values()].map((m) => ({
            value: polynomialOf([m]),
            written: monomialExpression(m),
          })),
          correctSum,
        ),
        written: node,
      }
    return { value: minus ? negatePolynomial(value) : value, written: node }
  })
}

// 2x(3y + 5x²) come 6xy + 5x²: il monomio moltiplica solo il primo termine.
function firstTermOnly(
  factor: Monomial,
  terms: readonly Monomial[],
  product: (a: Monomial, b: Monomial) => Monomial,
): Monomial[] {
  const [first, ...rest] = terms
  return first ? [product(factor, first), ...rest] : []
}

// (a + b)² come a² + b²: la potenza distribuita sui termini.
function powerOfSum(terms: readonly Monomial[], exponent: bigint): Polynomial {
  return polynomialOf(terms.map((t) => raiseMonomial(t, exponent)))
}

// (a − b)² come a² − 2ab − b²: nel quadrato di una differenza il meno
// anche all'ultimo quadrato.
function differenceSquareSign(
  terms: readonly Monomial[],
  exponent: bigint,
): Polynomial {
  const [a, b, ...rest] = terms
  const square = raisePolynomial(polynomialOf(terms), exponent)
  if (!a || !b || rest.length > 0 || exponent !== 2n || b.coefficient.num > 0n)
    return square
  return addPolynomials(
    square,
    polynomialOf([
      negated(raiseMonomial(b, 2n)),
      negated(raiseMonomial(b, 2n)),
    ]),
  )
}

// (a + b)(a − b) come a² + b².
function sumTimesDifferencePlus(a: Monomial, b: Monomial): Polynomial {
  return polynomialOf([raiseMonomial(a, 2n), raiseMonomial(b, 2n)])
}

// −(a − b) come −a − b: il meno tocca solo il primo termine.
function signsKept(
  terms: readonly Term[],
  sum: (terms: readonly Term[]) => Polynomial,
): Polynomial {
  const [first, ...rest] = terms
  if (!first) return zeroPolynomial
  return sum([{ ...first, value: negatePolynomial(first.value) }, ...rest])
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
      if (isAddSub(e.op)) return rules.sum(termsOf(e, rules))
      const left = evaluate(e.left, rules)
      if (e.op === '^') {
        if (e.right.kind !== 'number' || e.right.value.den !== 1n)
          throw new RangeError('Esponente non intero')
        const exponent = e.right.value.num
        const base = asMonomial(left)
        if (left.size > 1)
          return rules.polynomialPower([...left.values()], exponent)
        return base && base.letters.size > 0
          ? polynomialOf([rules.power(base, exponent)])
          : raisePolynomial(left, exponent)
      }
      const right = evaluate(e.right, rules)
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

// I monomi dei termini, ciascuno con il suo segno.
const monomialsOf = (terms: readonly Term[]): Monomial[] =>
  terms.flatMap((t) => [...t.value.values()])

// 2a² + 3a² come 5a⁴: fra simili si sommano anche gli esponenti. Il termine
// senza simili resta com'è.
function exponentsAdded(terms: readonly Term[]): Polynomial {
  const groups = new Map<string, Monomial[]>()
  for (const m of monomialsOf(terms)) {
    const key = letterPart(m)
    groups.set(key, [...(groups.get(key) ?? []), m])
  }
  return polynomialOf(
    [...groups.values()].flatMap((like) =>
      like.length === 1 || like[0]?.letters.size === 0
        ? like
        : [
            monomialOf(
              like.reduce((c, m) => add(c, m.coefficient), rational(0n)),
              like.flatMap((m) => [...m.letters]),
            ),
          ],
    ),
  )
}

// 3a + 2b come 5ab: dopo aver ridotto i simili, i termini che restano si
// sommano lo stesso, sommando i coefficienti e moltiplicando le parti
// letterali.
function conjoined(terms: readonly Term[]): Polynomial {
  const reduced = [...correctSum(terms).values()]
  if (reduced.length < 2) return polynomialOf(reduced)
  return polynomialOf([
    monomialOf(
      reduced.reduce((c, m) => add(c, m.coefficient), rational(0n)),
      reduced.flatMap((m) => [...m.letters]),
    ),
  ])
}

// 9x + 5x − 10x + x come 4x: il coefficiente che non si scrive vale zero.
function implicitCoefficientZero(terms: readonly Term[]): Polynomial {
  return correctSum(
    terms.filter(
      ({ written }) =>
        !(
          written.kind === 'monomial' &&
          written.coefficient.den === 1n &&
          (written.coefficient.num === 1n || written.coefficient.num === -1n)
        ),
    ),
  )
}

const explanationOfNumbers = (id: MisconceptionId): string =>
  misconceptions.find((m) => m.id === id)?.explanation ?? ''

export const literalMisconceptions: readonly LiteralMisconception[] = [
  {
    id: 'minus-group-signs-kept',
    explanation: explanationOfNumbers('minus-group-signs-kept'),
    wrongResults: (e) => attempt(e, { ...correctRules, minusGroup: signsKept }),
  },
  {
    id: 'power-of-sum',
    explanation: explanationOfNumbers('power-of-sum'),
    wrongResults: (e) =>
      attempt(e, { ...correctRules, polynomialPower: powerOfSum }),
  },
  {
    id: 'square-of-difference-sign',
    explanation:
      'Nel quadrato di una differenza hai dato il meno anche all’ultimo termine. Un quadrato è sempre positivo, e il meno va solo al doppio prodotto: (a − b)² = a² − 2ab + b².',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, polynomialPower: differenceSquareSign }),
  },
  {
    id: 'sum-times-difference-plus',
    explanation:
      'Nella somma per differenza hai sommato i quadrati. La somma di due termini per la loro differenza dà la differenza dei quadrati: (a + b)(a − b) = a² − b².',
    wrongResults: (e) =>
      attempt(e, {
        ...correctRules,
        sumTimesDifference: sumTimesDifferencePlus,
      }),
  },
  {
    id: 'distributive-first-term-only',
    explanation:
      'Hai moltiplicato il monomio solo per il primo termine della parentesi. Con la distributiva il monomio moltiplica ogni termine: 2x(3y + 5x²) = 6xy + 10x³, non 6xy + 5x².',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, distributive: firstTermOnly }),
  },
  {
    id: 'implicit-coefficient-zero',
    explanation:
      'Hai contato zero un coefficiente che non si vede. Davanti a una lettera da sola il coefficiente è 1, o −1 con il meno: in 9x + 5x − 10x + x l’ultimo termine vale 1x, e il risultato è 5x.',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, sum: implicitCoefficientZero }),
  },
  {
    id: 'like-terms-exponents-added',
    explanation:
      'Fra monomi simili hai sommato anche gli esponenti. Si sommano solo i coefficienti, la parte letterale resta la stessa: 2a² + 3a² = 5a², non 5a⁴.',
    wrongResults: (e) => attempt(e, { ...correctRules, sum: exponentsAdded }),
  },
  {
    id: 'unlike-terms-conjoined',
    explanation:
      'Hai sommato monomi che non sono simili. Si sommano solo i monomi con la stessa parte letterale: 3a + 2b resta 3a + 2b, non diventa 5ab.',
    wrongResults: (e) => attempt(e, { ...correctRules, sum: conjoined }),
  },
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
