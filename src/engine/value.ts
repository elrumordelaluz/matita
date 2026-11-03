import {
  binary,
  group,
  hasLetters,
  monomial,
  negatedPower,
  power,
  type Expression,
  type LetterPower,
  type LiteralExpression,
  type MonomialNode,
} from './expression.ts'
import { rational, type Rational } from './rational.ts'
import { solve, type Line, type Step } from './solver.ts'

// Il valore numerico di un'espressione letterale (`mono.value`). La prima
// riga è la sostituzione, una delle due righe senza conto del quaderno: ogni
// lettera prende il suo valore, e un valore negativo va fra tonde. Da lì è
// un'espressione di numeri, e la svolge il risolutore di sempre. Vedi
// SPEC.md, "Calcolo letterale", "Risolutore".

/** Il valore dato a una lettera: a = −2. */
export interface Assignment {
  readonly letter: string
  readonly value: Rational
}

/** La soluzione di un esercizio sul valore numerico: il risultato è un numero. */
export interface ValueSolution {
  readonly lines: readonly Line<Step<Rational>>[]
  readonly result: Rational
}

// Il numero che prende il posto della lettera: ricorda da quale lettera
// viene, per l'errore tipico della sostituzione senza tonde.
const substituted = (value: Rational, letter: string): Expression => ({
  kind: 'number',
  value,
  letter,
})

const isOne = (r: Rational) => r.num === 1n && r.den === 1n
const abs = (r: Rational) => (r.num < 0n ? rational(-r.num, r.den) : r)
const opposite = (r: Rational) => rational(-r.num, r.den)

// Il meno del coefficiente −1 davanti al primo fattore del prodotto: −a² per
// a = −3 dà −(−3)², −a per a = −3 dà −(−3), per a = 3 dà −3.
function negate(factor: LiteralExpression): LiteralExpression {
  if (factor.kind === 'number')
    return factor.value.num > 0n
      ? { kind: 'number', value: opposite(factor.value) }
      : group('round', factor, { negated: true })
  if (factor.kind === 'monomial')
    return { ...factor, coefficient: opposite(factor.coefficient) }
  return negatedPower(factor)
}

// Un monomio scritto con la lettera al posto del valore: diventa il prodotto
// del coefficiente, dei valori e delle lettere che restano, nell'ordine
// scritto. Le lettere che restano vicine stanno in un monomio solo.
function substituteMonomial(
  m: MonomialNode,
  letter: string,
  value: Rational,
): LiteralExpression {
  if (!m.letters.some((l) => l.letter === letter)) return m
  const factors: LiteralExpression[] = []
  let coefficient: Rational | null = isOne(abs(m.coefficient))
    ? null
    : abs(m.coefficient)
  let rest: LetterPower[] = []
  const flush = () => {
    if (rest.length > 0)
      factors.push(
        monomial(
          coefficient ?? rational(1n),
          rest.map((l) => [l.letter, l.exponent]),
        ),
      )
    else if (coefficient) factors.push({ kind: 'number', value: coefficient })
    coefficient = null
    rest = []
  }
  for (const l of m.letters) {
    if (l.letter !== letter) {
      rest.push(l)
      continue
    }
    flush()
    const leaf = substituted(value, letter)
    factors.push(l.exponent === 1n ? leaf : power(leaf, l.exponent))
  }
  flush()
  const [first, ...others] = factors
  if (!first) throw new Error('Monomio senza fattori')
  const signed = m.coefficient.num < 0n ? negate(first) : first
  return others.reduce<LiteralExpression>(
    (product, factor) => binary('×', product, factor),
    signed,
  )
}

// Un prodotto dove il monomio legava più di : o era la base di una potenza
// va fra tonde: 6 : 2a per a = 3 è 6 : (2 × 3), non 6 : 2 × 3.
const enclosed = (e: LiteralExpression): LiteralExpression =>
  e.kind === 'binary' ? group('round', e) : e

function substituteLetter(
  e: LiteralExpression,
  letter: string,
  value: Rational,
): LiteralExpression {
  switch (e.kind) {
    case 'number':
      return e
    case 'monomial':
      return substituteMonomial(e, letter, value)
    case 'group':
      return group(e.bracket, substituteLetter(e.inner, letter, value), {
        negated: e.negated === true,
      })
    case 'binary': {
      const left = substituteLetter(e.left, letter, value)
      const right = substituteLetter(e.right, letter, value)
      return binary(
        e.op,
        e.op === '^' && left !== e.left ? enclosed(left) : left,
        e.op === ':' && right !== e.right ? enclosed(right) : right,
      )
    }
  }
}

function hasLetter(e: LiteralExpression, letter: string): boolean {
  if (e.kind === 'monomial') return e.letters.some((l) => l.letter === letter)
  if (e.kind === 'number') return false
  if (e.kind === 'group') return hasLetter(e.inner, letter)
  return hasLetter(e.left, letter) || hasLetter(e.right, letter)
}

// Dopo la sostituzione non restano lettere: l'albero è di soli numeri.
function numeric(e: LiteralExpression): Expression {
  if (hasLetters(e)) throw new RangeError('Una lettera non ha valore')
  return e as Expression
}

/** L'espressione con ogni lettera al posto del suo valore. */
export function substitute(
  e: LiteralExpression,
  substitution: readonly Assignment[],
): Expression {
  return numeric(
    substitution.reduce(
      (tree, { letter, value }) => substituteLetter(tree, letter, value),
      e,
    ),
  )
}

/**
 * La soluzione per righe: la sostituzione, con un passaggio per lettera,
 * poi le righe del risolutore. Senza lettere non c'è la sostituzione.
 */
export function solveWithValues(
  e: LiteralExpression,
  substitution: readonly Assignment[],
): ValueSolution {
  const steps: Step<Rational>[] = []
  let current = e
  for (const { letter, value } of substitution) {
    if (!hasLetter(current, letter)) continue
    current = substituteLetter(current, letter, value)
    steps.push({
      rule: 'substitution',
      operands: [],
      result: value,
      operation: monomial(rational(1n), [[letter, 1n]]),
      outcome: substituted(value, letter),
      expression: current,
      letter,
    })
  }
  const start = numeric(current)
  const { lines, result } = solve(start)
  if (steps.length === 0) return { lines, result }
  return { lines: [{ expression: start, steps }, ...lines], result }
}
