import {
  complement,
  difference,
  finiteSet,
  intersection,
  setEquals,
  union,
  type FiniteSet,
} from './finiteSet.ts'
import type { Random } from './random.ts'
import type { SetMisconceptionId } from './setMisconceptions.ts'

// Le espressioni di insiemi: foglie gli insiemi nominati dall'esercizio,
// operazioni ∪ ∩ − e il complementare rispetto all'universo U. Vedi SPEC.md,
// "Insiemi", "Il dato": fra ∪ e ∩ non c'è un ordine delle operazioni, quindi
// un'operazione dentro un'altra va sempre fra parentesi. Il complementare si
// scrive con la barra sopra, Ā, e non chiede parentesi.

export type SetName = 'A' | 'B' | 'C'
export type SetOperator = '∪' | '∩' | '−'

export type SetExpression =
  | { readonly kind: 'name'; readonly name: SetName }
  | {
      readonly kind: 'binary'
      readonly op: SetOperator
      readonly left: SetExpression
      readonly right: SetExpression
    }
  | { readonly kind: 'complement'; readonly operand: SetExpression }

export interface NamedSet {
  readonly name: SetName
  readonly set: FiniteSet
}

/** La consegna: gli insiemi per elencazione, l'universo se serve, il calcolo. */
export interface OperationsTask {
  readonly kind: 'operations'
  readonly sets: readonly NamedSet[]
  /** L'universo U, dato quando c'è un complementare. */
  readonly universe?: FiniteSet
  readonly expression: SetExpression
}

export const named = (name: SetName): SetExpression => ({ kind: 'name', name })

export function binarySet(
  op: SetOperator,
  left: SetExpression,
  right: SetExpression,
): SetExpression {
  return { kind: 'binary', op, left, right }
}

export function complementOf(operand: SetExpression): SetExpression {
  return { kind: 'complement', operand }
}

const katexOperator: Record<SetOperator, string> = {
  '∪': '\\cup',
  '∩': '\\cap',
  '−': '-',
}

function render(e: SetExpression, katex: boolean, inner: boolean): string {
  switch (e.kind) {
    case 'name':
      return e.name
    case 'complement': {
      const operand = render(e.operand, katex, false)
      if (katex) return `\\overline{${operand}}`
      // La barra è il macron che si combina con la lettera: Ā.
      const wrapped = e.operand.kind === 'name' ? operand : `(${operand})`
      return `${wrapped}̄`.normalize('NFC')
    }
    case 'binary': {
      const op = katex ? katexOperator[e.op] : e.op
      const text = `${render(e.left, katex, true)} ${op} ${render(e.right, katex, true)}`
      return inner ? `(${text})` : text
    }
  }
}

export function setExpressionToText(e: SetExpression): string {
  return render(e, false, false)
}

export function setExpressionToKatex(e: SetExpression): string {
  return render(e, true, false)
}

/** Una riga della soluzione: un'operazione svolta, con il suo passaggio. */
export interface SetOperationLine {
  readonly kind: 'operation'
  /** L'operazione come è scritta: A ∩ B, (A ∩ B) ∩ C, Ā. */
  readonly label: SetExpression
  readonly op: SetOperator | 'complement'
  /** I valori degli operandi; nel complementare, l'insieme e l'universo. */
  readonly left: FiniteSet
  readonly right: FiniteSet
  /**
   * Gli elementi che entrano nel risultato, il perché della riga: in A ∩ B
   * quelli comuni, in A − B quelli di A che non stanno in B.
   */
  readonly entering: FiniteSet
  readonly result: FiniteSet
}

// Le regole con cui si svolge l'espressione: quella giusta o una sbagliata,
// che tocca un solo nodo.
interface Rules {
  /** Il nodo in cui ∪ e ∩ si scambiano. */
  readonly swapped?: SetExpression
  /** Il nodo − in cui gli operandi si scambiano. */
  readonly reversed?: SetExpression
}

function operate(
  op: SetOperator,
  left: FiniteSet,
  right: FiniteSet,
): FiniteSet {
  switch (op) {
    case '∪':
      return union(left, right)
    case '∩':
      return intersection(left, right)
    case '−':
      return difference(left, right)
  }
}

function setOf(task: OperationsTask, name: SetName): FiniteSet {
  const found = task.sets.find((s) => s.name === name)
  if (!found) throw new RangeError(`Insieme non dato: ${name}`)
  return found.set
}

function universeOf(task: OperationsTask): FiniteSet {
  if (!task.universe) throw new RangeError('Universo non dato')
  return task.universe
}

// Svolge l'espressione dal gruppo più interno, da sinistra a destra, e
// scrive una riga per operazione.
function evaluate(
  task: OperationsTask,
  e: SetExpression,
  rules: Rules,
  lines: SetOperationLine[],
): FiniteSet {
  if (e.kind === 'name') return setOf(task, e.name)
  if (e.kind === 'complement') {
    const operand = evaluate(task, e.operand, rules, lines)
    const u = universeOf(task)
    const result = complement(operand, u)
    lines.push({
      kind: 'operation',
      label: e,
      op: 'complement',
      left: operand,
      right: u,
      entering: result,
      result,
    })
    return result
  }
  let left = evaluate(task, e.left, rules, lines)
  let right = evaluate(task, e.right, rules, lines)
  let op = e.op
  if (e === rules.swapped) op = op === '∪' ? '∩' : '∪'
  if (e === rules.reversed) [left, right] = [right, left]
  const result = operate(op, left, right)
  lines.push({
    kind: 'operation',
    label: e,
    op,
    left,
    right,
    entering: result,
    result,
  })
  return result
}

export function solveOperations(task: OperationsTask): {
  readonly lines: readonly SetOperationLine[]
  readonly result: FiniteSet
} {
  const lines: SetOperationLine[] = []
  const result = evaluate(task, task.expression, {}, lines)
  return { lines, result }
}

function nodes(e: SetExpression): SetExpression[] {
  if (e.kind === 'name') return [e]
  if (e.kind === 'complement') return [e, ...nodes(e.operand)]
  return [e, ...nodes(e.left), ...nodes(e.right)]
}

/**
 * Gli insiemi che dà l'espressione svolta con una regola sbagliata, un nodo
 * alla volta, con l'errore che li spiega. Solo quelli diversi dal giusto.
 */
export function operationsWrongResults(
  task: OperationsTask,
): { readonly id: SetMisconceptionId; readonly value: FiniteSet }[] {
  const all = nodes(task.expression)
  const binaries = all.filter((n) => n.kind === 'binary')
  const rules: [SetMisconceptionId, Rules][] = [
    ...binaries
      .filter((n) => n.op !== '−')
      .map((n): [SetMisconceptionId, Rules] => [
        'union-intersection-swapped',
        { swapped: n },
      ]),
    ...binaries
      .filter((n) => n.op === '−')
      .map((n): [SetMisconceptionId, Rules] => [
        'difference-reversed',
        { reversed: n },
      ]),
  ]
  const { result } = solveOperations(task)
  return rules
    .map(([id, r]) => ({ id, value: evaluate(task, task.expression, r, []) }))
    .filter(({ value }) => !setEquals(value, result))
}

// Le forme dell'esercizio: una o due operazioni, al più tre insiemi. Le
// forme con il complementare sono una su quattro.
type Shape = (random: Random) => SetExpression

const binaryOp = (random: Random) => random.pick(['∪', '∩', '−'] as const)
const a = named('A')
const b = named('B')
const c = named('C')

const one: Shape = (r) => binarySet(binaryOp(r), a, b)
const groupFirst: Shape = (r) =>
  binarySet(binaryOp(r), binarySet(binaryOp(r), a, b), c)
const groupSecond: Shape = (r) =>
  binarySet(binaryOp(r), a, binarySet(binaryOp(r), b, c))

const shapes: readonly Shape[] = [
  one,
  one,
  groupFirst,
  groupFirst,
  groupSecond,
  groupSecond,
  (r) => binarySet(binaryOp(r), complementOf(a), b),
  (r) => binarySet(binaryOp(r), a, complementOf(b)),
]

function namesIn(e: SetExpression): SetName[] {
  return nodes(e).flatMap((n) => (n.kind === 'name' ? [n.name] : []))
}

function hasComplement(e: SetExpression): boolean {
  return nodes(e).some((n) => n.kind === 'complement')
}

// Un insieme di 3-6 elementi scelti fra quelli dati.
function subsetOf(random: Random, pool: readonly bigint[]): FiniteSet {
  const size = Number(random.int(3n, 6n))
  const chosen = new Set<bigint>()
  while (chosen.size < size) chosen.add(random.pick(pool))
  return finiteSet(chosen)
}

const pool = Array.from({ length: 15 }, (_, i) => BigInt(i + 1))

/** Una consegna di operazioni: i vincoli li controlla `acceptsOperations`. */
export function buildOperations(random: Random): OperationsTask {
  const expression = random.pick(shapes)(random)
  const withUniverse = hasComplement(expression)
  const universe = withUniverse
    ? finiteSet(pool.slice(0, Number(random.int(8n, 10n))))
    : undefined
  const from = universe ? universe.elements : pool
  const sets = [...new Set(namesIn(expression))]
    .sort()
    .map((name) => ({ name, set: subsetOf(random, from) }))
  return {
    kind: 'operations',
    sets,
    ...(universe && { universe }),
    expression,
  }
}

/**
 * Insiemi diversi fra loro, un risultato di al più otto elementi, e un
 * errore tipico che si vede. Il vuoto come risultato finale va bene una
 * volta ogni tanto, come risultato intermedio no.
 */
export function acceptsOperations(task: OperationsTask): boolean {
  const sets = task.sets.map((s) => s.set)
  const distinct = sets.every((s, i) =>
    sets.slice(i + 1).every((t) => !setEquals(s, t)),
  )
  const { lines, result } = solveOperations(task)
  return (
    distinct &&
    result.elements.length <= 8 &&
    lines.slice(0, -1).every((l) => l.result.elements.length > 0) &&
    operationsWrongResults(task).length > 0
  )
}
