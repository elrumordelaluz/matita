import {
  binary,
  group,
  isMulDiv,
  isSignChange,
  literal,
  type Expression,
  type Operator,
} from './expression.ts'
import { add, div, mul, rational, sub, type Rational } from './rational.ts'

// Il risolutore produce la soluzione come sul quaderno: una riga per livello,
// ogni riga fatta di passaggi atomici. Si lavora dentro i gruppi più interni
// (o sull'intera espressione, se non ci sono gruppi): al loro interno prima ×
// e : da sinistra a destra, poi + e − da sinistra a destra. Quando un gruppo
// si riduce a un numero le sue parentesi cadono; se il gruppo era preceduto
// dal meno resta −(−4), e il cambio di segno è un passaggio del giro di × e
// :, perché è la regola dei segni. Vedi SPEC.md, "Risolutore".

export type Rule =
  | 'mul-div-left-to-right'
  | 'add-sub-left-to-right'
  /** Il meno davanti a un numero fra parentesi: −(−4) = 4. */
  | 'change-sign'

export interface Step {
  readonly rule: Rule
  /** Nel cambio di segno −x si legge 0 − x: `left` è 0 e `op` è −. */
  readonly left: Rational
  readonly op: Operator
  readonly right: Rational
  readonly result: Rational
  /** Il pezzo svolto, com'era scritto: 3 × (−4), −(−4). */
  readonly operation: Expression
  /** Quello che il pezzo è diventato. */
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
  }
}

// Il giro di un livello: prima × e : (con i cambi di segno), poi + e −.
type Level = 'mul-div' | 'add-sub'

const levelOf = (op: Operator): Level => (isMulDiv(op) ? 'mul-div' : 'add-sub')

const ruleOf = (op: Operator): Rule =>
  isMulDiv(op) ? 'mul-div-left-to-right' : 'add-sub-left-to-right'

// Cerca un'operazione del livello fuori dai gruppi.
function contains(e: Expression, level: Level): boolean {
  if (isSignChange(e)) return level === 'mul-div'
  if (e.kind !== 'binary') return false
  return (
    levelOf(e.op) === level ||
    contains(e.left, level) ||
    contains(e.right, level)
  )
}

interface Reduction {
  readonly expression: Expression
  readonly step: Omit<Step, 'expression'>
}

function reduced(
  operation: Expression,
  rule: Rule,
  left: Rational,
  op: Operator,
  right: Rational,
  result: Rational,
): Reduction {
  const outcome = literal(result)
  return {
    expression: outcome,
    step: { rule, left, op, right, result, operation, outcome },
  }
}

// Svolge la prima operazione del livello, da sinistra, fra due numeri, senza
// entrare nei gruppi. In una catena associata a sinistra è il nodo più in
// fondo al ramo sinistro.
function reduceFirst(e: Expression, level: Level): Reduction | null {
  if (e.kind === 'group' && e.inner.kind === 'number' && isSignChange(e)) {
    if (level !== 'mul-div') return null
    const { value } = e.inner
    const zero = rational(0n)
    return reduced(e, 'change-sign', zero, '-', value, sub(zero, value))
  }
  if (e.kind !== 'binary') return null
  const left = reduceFirst(e.left, level)
  if (left)
    return { ...left, expression: binary(e.op, left.expression, e.right) }
  if (
    levelOf(e.op) === level &&
    e.left.kind === 'number' &&
    e.right.kind === 'number'
  ) {
    const result = apply(e.op, e.left.value, e.right.value)
    return reduced(e, ruleOf(e.op), e.left.value, e.op, e.right.value, result)
  }
  const right = reduceFirst(e.right, level)
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
    return group(e.bracket, replace(e.inner, rest, node), {
      negated: e.negated === true,
    })
  if (e.kind === 'binary') {
    if (head === 'left')
      return binary(e.op, replace(e.left, rest, node), e.right)
    if (head === 'right')
      return binary(e.op, e.left, replace(e.right, rest, node))
  }
  throw new Error('Percorso non valido')
}

// Un gruppo da svolgere: −(−4) non lo è più, è un numero da cambiare di segno.
function isOpenGroup(e: Expression): boolean {
  return e.kind === 'group' && !isSignChange(e)
}

function hasGroup(e: Expression): boolean {
  if (e.kind === 'group') return isOpenGroup(e)
  return e.kind === 'binary' && (hasGroup(e.left) || hasGroup(e.right))
}

// I gruppi che non contengono altri gruppi, da sinistra a destra.
function innermostGroups(e: Expression, path: Path = []): Path[] {
  if (e.kind === 'number') return []
  if (e.kind === 'group') {
    if (!isOpenGroup(e)) return []
    return hasGroup(e.inner)
      ? innermostGroups(e.inner, [...path, 'inner'])
      : [path]
  }
  return [
    ...innermostGroups(e.left, [...path, 'left']),
    ...innermostGroups(e.right, [...path, 'right']),
  ]
}

// Il contenuto di un gruppo che si è ridotto a un numero perde le parentesi.
// Davanti a un gruppo preceduto dal meno le parentesi restano: −(−4).
function settle(e: Expression, target: Path): Expression {
  const node = at(e, target)
  return node.kind === 'group' && node.inner.kind === 'number' && !node.negated
    ? replace(e, target, node.inner)
    : e
}

// Svolge un livello dentro un ambito: un gruppo più interno o l'intera
// espressione senza gruppi.
function solveScope(e: Expression, target: Path, steps: Step[]): Expression {
  const inGroup = isOpenGroup(at(e, target))
  const scope = inGroup ? [...target, 'inner' as const] : target
  const level = contains(at(e, scope), 'mul-div') ? 'mul-div' : 'add-sub'
  let current = settle(e, target)
  for (;;) {
    // Il gruppo è caduto o si è ridotto a −(n): l'ambito non c'è più.
    if (inGroup && !isOpenGroup(at(current, target))) return current
    const reduction = reduceFirst(at(current, scope), level)
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
