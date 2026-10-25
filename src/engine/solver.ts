import {
  binary,
  isMulDiv,
  type Expression,
  type Operator,
} from './expression.ts'
import { add, div, mul, sub, type Rational } from './rational.ts'

// Il risolutore produce la soluzione come sul quaderno: una riga per livello,
// ogni riga fatta di passaggi atomici. Un livello è prima × e : da sinistra a
// destra, poi + e − da sinistra a destra. Vedi SPEC.md, "Risolutore".

export type Rule = 'mul-div-left-to-right' | 'add-sub-left-to-right'

export interface Step {
  readonly rule: Rule
  readonly left: Rational
  readonly op: Operator
  readonly right: Rational
  readonly result: Rational
  /** L'espressione dopo questo passaggio. */
  readonly expression: Expression
}

export interface Line {
  /** L'espressione dopo aver svolto il livello. */
  readonly expression: Expression
  readonly steps: readonly Step[]
}

export interface Solution {
  readonly lines: readonly Line[]
  readonly result: Rational
}

export function apply(op: Operator, left: Rational, right: Rational): Rational {
  switch (op) {
    case '+':
      return add(left, right)
    case '-':
      return sub(left, right)
    case '×':
      return mul(left, right)
    case ':':
      return div(left, right)
  }
}

const ruleOf = (op: Operator): Rule =>
  isMulDiv(op) ? 'mul-div-left-to-right' : 'add-sub-left-to-right'

function contains(e: Expression, accepts: (op: Operator) => boolean): boolean {
  if (e.kind === 'number') return false
  return (
    accepts(e.op) || contains(e.left, accepts) || contains(e.right, accepts)
  )
}

interface Reduction {
  readonly expression: Expression
  readonly step: Omit<Step, 'expression'>
}

// Svolge la prima operazione accettata, da sinistra, fra due numeri. In una
// catena associata a sinistra è il nodo più in fondo al ramo sinistro.
function reduceFirst(
  e: Expression,
  accepts: (op: Operator) => boolean,
): Reduction | null {
  if (e.kind === 'number') return null
  const left = reduceFirst(e.left, accepts)
  if (left)
    return { ...left, expression: binary(e.op, left.expression, e.right) }
  if (accepts(e.op) && e.left.kind === 'number' && e.right.kind === 'number') {
    const result = apply(e.op, e.left.value, e.right.value)
    return {
      expression: { kind: 'number', value: result },
      step: {
        rule: ruleOf(e.op),
        left: e.left.value,
        op: e.op,
        right: e.right.value,
        result,
      },
    }
  }
  const right = reduceFirst(e.right, accepts)
  if (right)
    return { ...right, expression: binary(e.op, e.left, right.expression) }
  return null
}

function solveLevel(e: Expression): Line {
  const accepts = contains(e, isMulDiv)
    ? isMulDiv
    : (op: Operator) => !isMulDiv(op)
  const steps: Step[] = []
  let current = e
  for (;;) {
    const reduction = reduceFirst(current, accepts)
    if (!reduction) break
    current = reduction.expression
    steps.push({ ...reduction.step, expression: current })
  }
  return { expression: current, steps }
}

export function solve(e: Expression): Solution {
  const lines: Line[] = []
  let current = e
  while (current.kind !== 'number') {
    const line = solveLevel(current)
    if (line.steps.length === 0) throw new Error('Livello senza passaggi')
    lines.push(line)
    current = line.expression
  }
  return { lines, result: current.value }
}

/** L'operazione svolta in un passaggio, come espressione da rendere. */
export function stepExpression(step: Step): Expression {
  return binary(
    step.op,
    { kind: 'number', value: step.left },
    { kind: 'number', value: step.right },
  )
}
