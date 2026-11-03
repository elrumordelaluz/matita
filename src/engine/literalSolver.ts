import {
  binary,
  isMulDiv,
  isPower,
  type LiteralExpression,
  type MonomialNode,
  type Operator,
} from './expression.ts'
import {
  asMonomial,
  monomialExpression,
  multiplyPolynomials,
  polynomialValue,
  type Polynomial,
} from './polynomial.ts'
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
  if (e.kind !== 'binary' || levelOf(e.op) !== level) return null
  if (!isLeaf(e.left) || !isLeaf(e.right)) return null
  const left = polynomialValue(e.left)
  const right = polynomialValue(e.right)
  if (e.op === '×') {
    const rule: Rule =
      e.left.kind === 'number' && e.right.kind === 'number'
        ? 'mul-div-left-to-right'
        : 'monomial-product'
    return reduced(rule, e, [left, right], multiplyPolynomials(left, right))
  }
  return null
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

const levels: readonly Level[] = ['power', 'mul-div', 'add-sub']

// Una riga: il primo giro che ha qualcosa da fare, svolto tutto.
function solveLevel(e: LiteralExpression): Line<LiteralStep> | null {
  const level = levels.find((l) => reduceFirst(e, l) !== null)
  if (!level) return null
  const steps: LiteralStep[] = []
  let current = e
  for (;;) {
    const reduction = reduceFirst(current, level)
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
