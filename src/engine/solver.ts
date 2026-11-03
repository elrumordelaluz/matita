import {
  binary,
  group,
  isMulDiv,
  isNegatedPower,
  isPower,
  isSignChange,
  literal,
  type Expression,
  type LiteralExpression,
  type Operator,
} from './expression.ts'
import {
  applyFirstProperty,
  numericPower,
  powerOfPower,
  raise,
  type PropertyRule,
} from './power.ts'
import type { Polynomial } from './polynomial.ts'
import { add, div, mul, rational, sub, type Rational } from './rational.ts'

// Il risolutore produce la soluzione come sul quaderno: una riga per livello,
// ogni riga fatta di passaggi atomici. Si lavora dentro i gruppi più interni
// (o sull'intera espressione, se non ci sono gruppi): al loro interno prima
// le proprietà delle potenze, poi le potenze, poi × e : da sinistra a
// destra, poi + e − da sinistra a destra. Quando un gruppo si riduce a un
// numero le sue parentesi cadono; se il gruppo era preceduto dal meno resta
// −(−4), e il cambio di segno è un passaggio del giro di × e :, perché è la
// regola dei segni. Vedi SPEC.md, "Risolutore".

export type Rule =
  | 'mul-div-left-to-right'
  | 'add-sub-left-to-right'
  /** Il meno davanti a un numero fra parentesi: −(−4) = 4. */
  | 'change-sign'
  /** Il meno davanti a una potenza: −3² = −9, il meno resta fuori. */
  | 'minus-power'
  | 'power'
  /** La lettera prende il suo valore: a = −2. Non fa un conto. */
  | 'substitution'
  /** Un monomio scritto diventa la sua forma normale: 6a³ab = 6a⁴b. */
  | 'normal-form'
  /** Il prodotto di due monomi: 2a² · 3a³ = 6a⁵. */
  | 'monomial-product'
  /** Il quoziente di due monomi, quando è un monomio: 4a²b³ : 2b² = 2a²b. */
  | 'monomial-quotient'
  /** La potenza di un monomio, con il segno: (−3a²)³ = −27a⁶. */
  | 'monomial-power'
  | PropertyRule

/** Il valore di un operando: un numero, o nel calcolo letterale un polinomio. */
export type Value = Rational | Polynomial

/**
 * Un passaggio: un'operazione con i suoi operandi e il suo risultato, dentro
 * una riga. Nei capitoli dei numeri è un conto fra due numeri (vedi
 * `NumberStep`); nel calcolo letterale gli operandi sono monomi e polinomi,
 * e possono essere uno solo o tanti.
 */
export interface Step<V extends Value = Value> {
  readonly rule: Rule
  /** I valori su cui lavora il passaggio, nell'ordine in cui sono scritti. */
  readonly operands: readonly V[]
  readonly result: V
  /** Il pezzo svolto, com'era scritto: 3 × (−4), −(−4), 2³, 2⁵ × 2³. */
  readonly operation: LiteralExpression
  /** Quello che il pezzo è diventato: un numero, o una potenza se si applica una proprietà. */
  readonly outcome: LiteralExpression
  /** L'espressione dopo questo passaggio. */
  readonly expression: LiteralExpression
  /** Nella riga della sostituzione, la lettera che prende il valore `result`. */
  readonly letter?: string
}

/** Un conto fra due numeri, il passaggio dei capitoli 1-4. */
export interface NumberStep extends Step<Rational> {
  /**
   * I due operandi e l'operazione. Nel cambio di segno −x si legge 0 − x:
   * `left` è 0 e `op` è −; così anche −3², con `right` il valore della
   * potenza. Per una proprietà sono i valori delle due potenze.
   */
  readonly left: Rational
  readonly op: Operator
  readonly right: Rational
  readonly operands: readonly [Rational, Rational]
  readonly operation: Expression
  readonly outcome: Expression
  readonly expression: Expression
}

export interface Line<S extends Step = Step> {
  /** L'espressione dopo aver svolto il livello. */
  readonly expression: S['expression']
  readonly steps: readonly S[]
}

/** La soluzione di un'espressione di numeri. */
export interface Solution {
  readonly lines: readonly Line<NumberStep>[]
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

// Il giro di un livello: prima le potenze, poi × e : (con i cambi di segno),
// poi + e −.
type Level = 'power' | 'mul-div' | 'add-sub'

const levelOf = (op: Operator): Level => {
  if (isPower(op)) return 'power'
  return isMulDiv(op) ? 'mul-div' : 'add-sub'
}

const ruleOf = (op: Operator): Rule => {
  if (isPower(op)) return 'power'
  return isMulDiv(op) ? 'mul-div-left-to-right' : 'add-sub-left-to-right'
}

// Cerca un'operazione del livello fuori dai gruppi.
function contains(e: Expression, level: Level): boolean {
  if (isSignChange(e)) return level === 'mul-div'
  if (isNegatedPower(e) && e.kind === 'group') return contains(e.inner, level)
  if (e.kind !== 'binary') return false
  return (
    levelOf(e.op) === level ||
    contains(e.left, level) ||
    contains(e.right, level)
  )
}

interface Reduction {
  readonly expression: Expression
  readonly step: Omit<NumberStep, 'expression' | 'operands'>
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
  // −3² si svolge in un passaggio solo, nel giro delle potenze: la potenza
  // e il meno che resta davanti.
  if (isNegatedPower(e) && e.kind === 'group') {
    const p = numericPower(e.inner)
    if (level !== 'power' || !p) return null
    const value = raise(p.base, p.exponent)
    const zero = rational(0n)
    return reduced(e, 'minus-power', zero, '-', value, sub(zero, value))
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

// Un gruppo da svolgere: −(−4) non lo è più, è un numero da cambiare di
// segno; −3² non lo è mai, è un meno davanti a una potenza.
function isOpenGroup(e: Expression): boolean {
  return e.kind === 'group' && !isSignChange(e) && !isNegatedPower(e)
}

// Una potenza di potenza, (3²)³, non conta come gruppo: le sue parentesi
// cadono con la proprietà, non svolgendo il dentro. Il meno davanti a una
// potenza è trasparente: conta quello che ha dentro.
function hasGroup(e: Expression): boolean {
  if (isNegatedPower(e) && e.kind === 'group') return hasGroup(e.inner)
  if (e.kind === 'group') return isOpenGroup(e)
  if (powerOfPower(e)) return false
  return e.kind === 'binary' && (hasGroup(e.left) || hasGroup(e.right))
}

// I gruppi che non contengono altri gruppi, da sinistra a destra.
function innermostGroups(e: Expression, path: Path = []): Path[] {
  if (e.kind === 'number' || powerOfPower(e)) return []
  if (isNegatedPower(e))
    return innermostGroups(at(e, ['inner']), [...path, 'inner'])
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

// Il livello da svolgere in un ambito: le proprietà finché si possono
// applicare, poi le potenze, poi × e :, poi + e −.
function nextLevel(scope: Expression): (e: Expression) => Reduction | null {
  if (applyFirstProperty(scope)) return applyFirstProperty
  const levels: readonly Level[] = ['power', 'mul-div']
  const level = levels.find((l) => contains(scope, l)) ?? 'add-sub'
  return (e) => reduceFirst(e, level)
}

// Svolge un livello dentro un ambito: un gruppo più interno o l'intera
// espressione senza gruppi.
function solveScope(
  e: Expression,
  target: Path,
  steps: NumberStep[],
): Expression {
  const inGroup = isOpenGroup(at(e, target))
  const scope = inGroup ? [...target, 'inner' as const] : target
  const reduce = nextLevel(at(e, scope))
  let current = settle(e, target)
  for (;;) {
    // Il gruppo è caduto o si è ridotto a −(n): l'ambito non c'è più.
    if (inGroup && !isOpenGroup(at(current, target))) return current
    const reduction = reduce(at(current, scope))
    if (!reduction) return current
    current = settle(replace(current, scope, reduction.expression), target)
    const { left, right } = reduction.step
    steps.push({
      ...reduction.step,
      operands: [left, right],
      expression: current,
    })
  }
}

function solveLevel(e: Expression): Line<NumberStep> {
  const steps: NumberStep[] = []
  const targets = hasGroup(e) ? innermostGroups(e) : [[]]
  let current = e
  for (const target of targets) current = solveScope(current, target, steps)
  return { expression: current, steps }
}

export function solve(e: Expression): Solution {
  const lines: Line<NumberStep>[] = []
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
export function stepExpression(step: Step): LiteralExpression {
  return step.operation
}
