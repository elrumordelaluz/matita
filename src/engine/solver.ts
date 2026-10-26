import {
  binary,
  group,
  isAddSub,
  isMulDiv,
  isPower,
  type Expression,
  type Operator,
} from './expression.ts'
import {
  applyFirstProperty,
  powerOfPower,
  raise,
  type PropertyRule,
} from './power.ts'
import { add, div, mul, sub, type Rational } from './rational.ts'

// Il risolutore produce la soluzione come sul quaderno: una riga per livello,
// ogni riga fatta di passaggi atomici. Si lavora dentro i gruppi più interni
// (o sull'intera espressione, se non ci sono gruppi): al loro interno prima
// le proprietà delle potenze, poi le potenze, poi × e : da sinistra a
// destra, poi + e − da sinistra a destra. Quando un gruppo si riduce a un
// numero le sue parentesi cadono. Vedi SPEC.md, "Risolutore".

export type Rule =
  'mul-div-left-to-right' | 'add-sub-left-to-right' | 'power' | PropertyRule

export interface Step {
  readonly rule: Rule
  // I valori del passaggio: per una proprietà, i valori delle due potenze.
  readonly left: Rational
  readonly op: Operator
  readonly right: Rational
  readonly result: Rational
  /** Il pezzo svolto, scritto a parte: `3 × 4`, `2³`, `2⁵ × 2³`. */
  readonly operation: Expression
  /** Che cosa diventa: un numero, o una potenza se si applica una proprietà. */
  readonly outcome: Expression
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
    case '^':
      if (right.den !== 1n) throw new RangeError('Esponente non intero')
      return raise(left, right.num)
  }
}

const ruleOf = (op: Operator): Rule => {
  if (isPower(op)) return 'power'
  return isMulDiv(op) ? 'mul-div-left-to-right' : 'add-sub-left-to-right'
}

// Cerca un operatore fuori dai gruppi.
function contains(e: Expression, accepts: (op: Operator) => boolean): boolean {
  if (e.kind !== 'binary') return false
  return (
    accepts(e.op) || contains(e.left, accepts) || contains(e.right, accepts)
  )
}

interface Reduction {
  readonly expression: Expression
  readonly step: Omit<Step, 'expression'>
}

// Svolge la prima operazione accettata, da sinistra, fra due numeri, senza
// entrare nei gruppi. In una catena associata a sinistra è il nodo più in
// fondo al ramo sinistro.
function reduceFirst(
  e: Expression,
  accepts: (op: Operator) => boolean,
): Reduction | null {
  if (e.kind !== 'binary') return null
  const left = reduceFirst(e.left, accepts)
  if (left)
    return { ...left, expression: binary(e.op, left.expression, e.right) }
  if (accepts(e.op) && e.left.kind === 'number' && e.right.kind === 'number') {
    const result = apply(e.op, e.left.value, e.right.value)
    const outcome: Expression = { kind: 'number', value: result }
    return {
      expression: outcome,
      step: {
        rule: ruleOf(e.op),
        left: e.left.value,
        op: e.op,
        right: e.right.value,
        result,
        operation: e,
        outcome,
      },
    }
  }
  const right = reduceFirst(e.right, accepts)
  if (right)
    return { ...right, expression: binary(e.op, e.left, right.expression) }
  return null
}

// Un percorso dalla radice a un nodo dell'albero.
type Path = readonly ('left' | 'right' | 'inner')[]

function at(e: Expression, path: Path): Expression {
  const [head, ...rest] = path
  if (head === undefined) return e
  if (head === 'inner' && e.kind === 'group') return at(e.inner, rest)
  if (head !== 'inner' && e.kind === 'binary') return at(e[head], rest)
  throw new Error('Percorso non valido')
}

function replace(e: Expression, path: Path, node: Expression): Expression {
  const [head, ...rest] = path
  if (head === undefined) return node
  if (head === 'inner' && e.kind === 'group')
    return group(e.bracket, replace(e.inner, rest, node))
  if (e.kind === 'binary') {
    if (head === 'left')
      return binary(e.op, replace(e.left, rest, node), e.right)
    if (head === 'right')
      return binary(e.op, e.left, replace(e.right, rest, node))
  }
  throw new Error('Percorso non valido')
}

// Una potenza di potenza, (3²)³, non conta come gruppo: le sue parentesi
// cadono con la proprietà, non svolgendo il dentro.
function hasGroup(e: Expression): boolean {
  if (e.kind === 'group') return true
  if (powerOfPower(e)) return false
  return e.kind === 'binary' && (hasGroup(e.left) || hasGroup(e.right))
}

// I gruppi che non contengono altri gruppi, da sinistra a destra.
function innermostGroups(e: Expression, path: Path = []): Path[] {
  if (e.kind === 'number' || powerOfPower(e)) return []
  if (e.kind === 'group')
    return hasGroup(e.inner)
      ? innermostGroups(e.inner, [...path, 'inner'])
      : [path]
  return [
    ...innermostGroups(e.left, [...path, 'left']),
    ...innermostGroups(e.right, [...path, 'right']),
  ]
}

// Il contenuto di un gruppo che si è ridotto a un numero perde le parentesi.
function settle(e: Expression, target: Path): Expression {
  const node = at(e, target)
  return node.kind === 'group' && node.inner.kind === 'number'
    ? replace(e, target, node.inner)
    : e
}

// Il livello da svolgere in un ambito: le proprietà finché si possono
// applicare, poi le potenze, poi × e :, poi + e −.
function nextLevel(scope: Expression): (e: Expression) => Reduction | null {
  if (applyFirstProperty(scope)) return applyFirstProperty
  const accepts = [isPower, isMulDiv].find((a) => contains(scope, a))
  return (e) => reduceFirst(e, accepts ?? isAddSub)
}

// Svolge un livello dentro un ambito: un gruppo più interno o l'intera
// espressione senza gruppi.
function solveScope(e: Expression, target: Path, steps: Step[]): Expression {
  const node = at(e, target)
  const scope = node.kind === 'group' ? [...target, 'inner' as const] : target
  const reduce = nextLevel(at(e, scope))
  let current = settle(e, target)
  for (;;) {
    // Il gruppo è caduto: l'ambito non c'è più.
    if (at(current, target).kind !== node.kind) return current
    const reduction = reduce(at(current, scope))
    if (!reduction) return current
    current = settle(replace(current, scope, reduction.expression), target)
    steps.push({ ...reduction.step, expression: current })
  }
}

function solveLevel(e: Expression): Line {
  const steps: Step[] = []
  const targets = hasGroup(e) ? innermostGroups(e) : [[]]
  let current = e
  for (const target of targets) current = solveScope(current, target, steps)
  return { expression: current, steps }
}

export function solve(e: Expression): Solution {
  const lines: Line[] = []
  let current = e
  while (current.kind !== 'number') {
    const line = solveLevel(current)
    if (line.expression === current) throw new Error('Livello senza passaggi')
    // Una riga senza passaggi ha solo tolto parentesi intorno a numeri.
    if (line.steps.length > 0) lines.push(line)
    current = line.expression
  }
  return { lines, result: current.value }
}

/** L'operazione svolta in un passaggio, come espressione da rendere. */
export function stepExpression(step: Step): Expression {
  return step.operation
}
