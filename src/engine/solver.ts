import { binary, type Expression, type Operator } from './expression.ts'
import { add, sub, type Rational } from './rational.ts'

// Il risolutore produce la soluzione come sul quaderno: una riga per livello,
// ogni riga fatta di passaggi atomici. Vedi SPEC.md, "Risolutore".

export type Rule = 'add-sub-left-to-right'

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
  }
}

// Svolge l'operazione più a sinistra fra due numeri. In una catena di + e −
// associata a sinistra è il primo nodo in fondo al ramo sinistro.
function reduceLeftmost(e: Expression): { expression: Expression; step: Step } {
  if (e.kind === 'number') throw new Error('Niente da svolgere')
  if (e.left.kind === 'number' && e.right.kind === 'number') {
    const result = apply(e.op, e.left.value, e.right.value)
    const expression: Expression = { kind: 'number', value: result }
    return {
      expression,
      step: {
        rule: 'add-sub-left-to-right',
        left: e.left.value,
        op: e.op,
        right: e.right.value,
        result,
        expression,
      },
    }
  }
  const inner = reduceLeftmost(e.left)
  const expression = binary(e.op, inner.expression, e.right)
  return { expression, step: { ...inner.step, expression } }
}

function solveLevel(e: Expression): Line {
  const steps: Step[] = []
  let current = e
  while (current.kind !== 'number') {
    const { expression, step } = reduceLeftmost(current)
    steps.push(step)
    current = expression
  }
  return { expression: current, steps }
}

export function solve(e: Expression): Solution {
  if (e.kind === 'number') return { lines: [], result: e.value }
  const line = solveLevel(e)
  const last = line.expression
  if (last.kind !== 'number') throw new Error('Livello non concluso')
  return { lines: [line], result: last.value }
}

/** L'operazione svolta in un passaggio, come espressione da rendere. */
export function stepExpression(step: Step): Expression {
  return binary(
    step.op,
    { kind: 'number', value: step.left },
    { kind: 'number', value: step.right },
  )
}
