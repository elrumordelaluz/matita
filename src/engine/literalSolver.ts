import {
  binary,
  group,
  isMulDiv,
  literal,
  isNegatedPower,
  isPower,
  type LiteralExpression,
  type MonomialNode,
  type Operator,
} from './expression.ts'
import {
  addPolynomials,
  asMonomial,
  letterPart,
  monomialExpression,
  multiplyPolynomials,
  negatePolynomial,
  polynomialValue,
  zeroPolynomial,
  type Polynomial,
} from './polynomial.ts'
import { rational } from './rational.ts'
import type { Line, Rule, Step } from './solver.ts'

// Il risolutore del calcolo letterale. L'ordine è quello dei capitoli dei
// numeri, esteso: dentro un ambito prima le potenze (e la forma normale dei
// monomi scritti), poi × e : da sinistra a destra, poi la riduzione dei
// termini simili. Un'operazione fra monomi è un passaggio solo, come un
// conto fra frazioni in Q. Il risultato è un polinomio in forma normale.
// Vedi SPEC.md, "Calcolo letterale", "Risolutore".

/** Un passaggio del calcolo letterale: operandi e risultato sono polinomi. */
export type LiteralStep = Step<Polynomial>

export interface LiteralSolution {
  readonly lines: readonly Line<LiteralStep>[]
  readonly result: Polynomial
}

type Level = 'power' | 'mul-div' | 'add-sub'

const levelOf = (op: Operator): Level => {
  if (isPower(op)) return 'power'
  return isMulDiv(op) ? 'mul-div' : 'add-sub'
}

interface Reduction {
  readonly expression: LiteralExpression
  readonly step: Omit<LiteralStep, 'expression'>
}

/** Un valore già scritto: un numero o un monomio. */
const isLeaf = (e: LiteralExpression) =>
  e.kind === 'number' || e.kind === 'monomial'

// Il polinomio come lo scrive il quaderno: un monomio in forma normale, con
// le lettere in ordine alfabetico, o un numero.
function written(p: Polynomial): LiteralExpression {
  const m = asMonomial(p)
  if (!m) throw new RangeError('Il risultato non è un monomio')
  return monomialExpression(m)
}

function reduced(
  rule: Rule,
  operation: LiteralExpression,
  operands: readonly Polynomial[],
  result: Polynomial,
): Reduction {
  const outcome = written(result)
  return {
    expression: outcome,
    step: { rule, operands, result, operation, outcome },
  }
}

// Un monomio scritto con una lettera ripetuta non è in forma normale. Le
// lettere in un altro ordine sì: la forma normale non è l'ordine.
function inNormalForm(m: MonomialNode): boolean {
  const letters = m.letters.map((l) => l.letter)
  return new Set(letters).size === letters.length
}

// Il passaggio che svolge proprio questo nodo nel giro `level`, se c'è.
function reduceHere(e: LiteralExpression, level: Level): Reduction | null {
  if (e.kind === 'monomial') {
    if (level !== 'power' || inNormalForm(e)) return null
    const value = polynomialValue(e)
    return reduced('normal-form', e, [value], value)
  }
  // Il meno davanti alla potenza resta fuori e si applica nello stesso
  // passaggio, come in −3² = −9: −(−3a³)³ = 27a⁹.
  if (isNegatedPower(e) && e.kind === 'group') {
    const p = e.inner
    if (level !== 'power' || p.kind !== 'binary' || !isLeaf(p.left)) return null
    const base = p.left
    const rule: Rule = base.kind === 'number' ? 'minus-power' : 'monomial-power'
    const value = polynomialValue(e)
    return reduced(rule, e, [polynomialValue(base)], value)
  }
  if (e.kind !== 'binary' || levelOf(e.op) !== level) return null
  if (!isLeaf(e.left) || !isLeaf(e.right)) return null
  const numbers = e.left.kind === 'number' && e.right.kind === 'number'
  const left = polynomialValue(e.left)
  const right = polynomialValue(e.right)
  switch (e.op) {
    case '^':
      // Un'operazione fra monomi è un passaggio solo: (−3a²)³ = −27a⁶, senza
      // la riga della potenza di potenza.
      return reduced(
        e.left.kind === 'number' ? 'power' : 'monomial-power',
        e,
        [left],
        polynomialValue(e),
      )
    case '×':
      return reduced(
        numbers ? 'mul-div-left-to-right' : 'monomial-product',
        e,
        [left, right],
        multiplyPolynomials(left, right),
      )
    case ':':
      // polynomialValue rifiuta il quoziente che non è un monomio.
      return reduced(
        numbers ? 'mul-div-left-to-right' : 'monomial-quotient',
        e,
        [left, right],
        polynomialValue(e),
      )
    default:
      return null
  }
}

// Svolge il primo passaggio del giro, da sinistra, senza entrare nei gruppi.
function reduceFirst(e: LiteralExpression, level: Level): Reduction | null {
  if (e.kind !== 'binary') return reduceHere(e, level)
  const left = reduceFirst(e.left, level)
  if (left)
    return { ...left, expression: binary(e.op, left.expression, e.right) }
  const here = reduceHere(e, level)
  if (here) return here
  const right = reduceFirst(e.right, level)
  if (right)
    return { ...right, expression: binary(e.op, e.left, right.expression) }
  return null
}

// La riduzione dei termini simili. Non è "+ e − da sinistra a destra":
// mette insieme termini lontani. Un passaggio per ogni gruppo di simili, con
// tanti operandi quanti sono i simili, e il risultato al posto del primo
// termine del gruppo; i gruppi vanno nell'ordine di prima comparsa.

/** Un termine di una somma con il segno che lo precede. */
export interface SignedTerm {
  readonly minus: boolean
  readonly node: LiteralExpression
}

/** I termini di una somma algebrica, nell'ordine scritto. */
export function sumTerms(e: LiteralExpression): SignedTerm[] {
  if (e.kind === 'binary' && (e.op === '+' || e.op === '-'))
    return [...sumTerms(e.left), { minus: e.op === '-', node: e.right }]
  return [{ minus: false, node: e }]
}

// Il valore di un termine con il suo segno.
const signedValue = ({ minus, node }: SignedTerm): Polynomial => {
  const value = polynomialValue(node)
  return minus ? negatePolynomial(value) : value
}

// Un monomio o un numero con il suo segno, come termine: −2a diventa il
// meno davanti a 2a, perché fra i termini ci sono solo monomi positivi.
function termOf(value: Polynomial): SignedTerm | null {
  const m = asMonomial(value)
  if (!m) return null
  const minus = m.coefficient.num < 0n
  const coefficient = minus
    ? rational(-m.coefficient.num, m.coefficient.den)
    : m.coefficient
  return { minus, node: monomialExpression({ ...m, coefficient }) }
}

/**
 * La somma scritta come sul libro: + e − fra i termini, e il primo con il
 * suo segno. Senza termini è lo zero.
 */
export function sumOf(terms: readonly SignedTerm[]): LiteralExpression {
  const [first, ...rest] = terms
  if (!first) return literal(rational(0n))
  const leading = first.minus ? negated(first.node) : first.node
  return rest.reduce<LiteralExpression>(
    (sum, t) => binary(t.minus ? '-' : '+', sum, t.node),
    leading,
  )
}

// Il primo termine con il meno davanti: un monomio o un numero cambia segno,
// un gruppo ricorda il meno.
function negated(node: LiteralExpression): LiteralExpression {
  if (node.kind === 'number')
    return literal(rational(-node.value.num, node.value.den))
  if (node.kind === 'monomial')
    return {
      ...node,
      coefficient: rational(-node.coefficient.num, node.coefficient.den),
    }
  return group('round', node, { negated: true })
}

function likeKey(t: SignedTerm): string | null {
  if (!isLeaf(t.node)) return null
  const m = asMonomial(polynomialValue(t.node))
  return m ? letterPart(m) : null
}

// Il primo gruppo di simili, ridotto a un termine solo.
function reduceLikeTerms(e: LiteralExpression): Reduction | null {
  const terms = sumTerms(e)
  const keys = terms.map(likeKey)
  const first = keys.findIndex(
    (k, i) => k !== null && keys.indexOf(k, i + 1) !== -1,
  )
  if (first === -1) return null
  const members = keys.flatMap((k, i) => (k === keys[first] ? [i] : []))
  const like = members.flatMap((i) => terms[i] ?? [])
  const operands = like.map(signedValue)
  const result = operands.reduce(addPolynomials, zeroPolynomial)
  const reducedTerm = termOf(result)
  const rest = terms.flatMap((t, i) => {
    if (i === first) return reducedTerm ? [reducedTerm] : []
    return members.includes(i) ? [] : [t]
  })
  const outcome = reducedTerm ? sumOf([reducedTerm]) : literal(rational(0n))
  return {
    expression: sumOf(rest),
    step: {
      rule: 'like-terms',
      operands,
      result,
      operation: sumOf(like),
      outcome,
    },
  }
}

const levels: readonly Level[] = ['power', 'mul-div', 'add-sub']

// Il primo passaggio del giro, da sinistra.
function reduceLevel(e: LiteralExpression, level: Level): Reduction | null {
  return level === 'add-sub' ? reduceLikeTerms(e) : reduceFirst(e, level)
}

// Una riga: il primo giro che ha qualcosa da fare, svolto tutto.
function solveLevel(e: LiteralExpression): Line<LiteralStep> | null {
  const level = levels.find((l) => reduceLevel(e, l) !== null)
  if (!level) return null
  const steps: LiteralStep[] = []
  let current = e
  for (;;) {
    const reduction = reduceLevel(current, level)
    if (!reduction) return { expression: current, steps }
    current = reduction.expression
    steps.push({ ...reduction.step, expression: current })
  }
}

/** La soluzione per righe di un'espressione letterale. */
export function solveLiteral(e: LiteralExpression): LiteralSolution {
  const lines: Line<LiteralStep>[] = []
  let current = e
  for (let line = solveLevel(current); line; line = solveLevel(current)) {
    lines.push(line)
    current = line.expression
  }
  return { lines, result: polynomialValue(current) }
}
