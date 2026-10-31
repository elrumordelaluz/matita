import {
  binary,
  group,
  parseExpression,
  toText,
  type Expression,
} from './expression.ts'
import { equals, type Rational } from './rational.ts'
import { solve, type Step } from './solver.ts'
import { readAnswer } from './verify.ts'

// Il controllo riga per riga della pratica "Passo passo". Vedi SPEC.md,
// "Pratica / Passo passo": una riga va bene se si ottiene dalla precedente
// sostituendo con il loro risultato, una o più alla volta, i passaggi che il
// risolutore farebbe adesso su quella riga. Così l'ordine delle operazioni è
// quello del quaderno: prima il dentro delle parentesi, poi le potenze, poi
// × e :, poi + e −, da sinistra a destra. Il tipo di parentesi non conta.
//
// Il giudizio non valuta mai la riga dello studente: la prossima riga del
// risolutore si chiede solo alla precedente, e una riga scritta con una
// divisione per zero è una riga rifiutata, non un errore.

/** Il rifiuto di una riga: che cosa controllare. */
export interface LineRefusal {
  readonly accepted: false
  /** Perché la riga è rifiutata: l'ordine delle operazioni o il valore. */
  readonly wrong: 'order' | 'value'
  /** L'operazione da controllare, come testo. */
  readonly operation: string
}

export type LineCheck =
  | { readonly accepted: true }
  | LineRefusal
  | {
      /** La riga copiata: non è né giusta né sbagliata, non c'è nulla da correggere. */
      readonly accepted: false
      readonly wrong: 'unchanged'
    }

/** Il conto svolto in forma breve: `3 × 4 = 12`. */
export interface StepEntry {
  /** Il conto, come lo ha scritto lo studente. */
  readonly operation: Expression
  /** Il risultato scritto dopo l'uguale. */
  readonly result: Rational
}

export type OperationCheck =
  { readonly accepted: true; readonly line: Expression } | LineRefusal

/** Il suggerimento sulla riga dello studente: il prossimo passaggio. */
export interface StepHint {
  /** L'operazione da svolgere, come testo. */
  readonly operation: string
  /**
   * Il risultato dell'operazione, se si può mostrare: manca sull'ultimo
   * passaggio, quello che dà il risultato dell'esercizio.
   */
  readonly result: string | null
}

// Un percorso dalla radice a un nodo dell'albero.
type Path = readonly ('left' | 'right' | 'inner')[]

function samePath(a: Path, b: Path): boolean {
  return a.length === b.length && a.every((p, i) => p === b[i])
}

function at(e: Expression, path: Path): Expression | null {
  let node = e
  for (const step of path) {
    if (step === 'inner') {
      if (node.kind !== 'group') return null
      node = node.inner
    } else {
      if (node.kind !== 'binary') return null
      node = node[step]
    }
  }
  return node
}

function replace(
  e: Expression,
  path: Path,
  node: Expression,
): Expression | null {
  const [head, ...rest] = path
  if (head === undefined) return node
  if (head === 'inner' && e.kind === 'group') {
    const inner = replace(e.inner, rest, node)
    return inner && group(e.bracket, inner, { negated: e.negated === true })
  }
  if (e.kind === 'binary') {
    if (head === 'left') {
      const left = replace(e.left, rest, node)
      return left && binary(e.op, left, e.right)
    }
    if (head === 'right') {
      const right = replace(e.right, rest, node)
      return right && binary(e.op, e.left, right)
    }
  }
  return null
}

// Un gruppo senza meno intorno a un solo numero è solo il modo di scrivere
// quel numero: (7) è 7, e ((7)) pure.
function unwrapped(e: Expression): Expression {
  if (e.kind !== 'group' || e.negated) return e
  const inner = unwrapped(e.inner)
  return inner.kind === 'number' ? inner : e
}

// Il confronto strutturale fra espressioni: i numeri per valore, i gruppi
// senza guardare il tipo di parentesi.
function same(a: Expression, b: Expression): boolean {
  a = unwrapped(a)
  b = unwrapped(b)
  if (a.kind === 'number')
    return b.kind === 'number' && equals(a.value, b.value)
  if (b.kind === 'number') return false
  if (a.kind === 'binary' && b.kind === 'binary')
    return a.op === b.op && same(a.left, b.left) && same(a.right, b.right)
  if (a.kind === 'group' && b.kind === 'group')
    return a.negated === b.negated && same(a.inner, b.inner)
  return false
}

// Il confronto esatto, tipo di parentesi compreso: riconosce la riga copiata.
function identical(a: Expression, b: Expression): boolean {
  if (a.kind === 'number')
    return b.kind === 'number' && equals(a.value, b.value)
  if (a.kind === 'binary')
    return (
      b.kind === 'binary' &&
      a.op === b.op &&
      identical(a.left, b.left) &&
      identical(a.right, b.right)
    )
  return (
    b.kind === 'group' &&
    a.bracket === b.bracket &&
    a.negated === b.negated &&
    identical(a.inner, b.inner)
  )
}

// Le parentesi intorno a un numero cadono, come sul quaderno; quelle
// precedute dal meno restano, −(−4).
function settled(e: Expression): Expression {
  if (e.kind === 'group') {
    const inner = settled(e.inner)
    return !e.negated && inner.kind === 'number'
      ? inner
      : group(e.bracket, inner, { negated: e.negated === true })
  }
  return e.kind === 'binary'
    ? binary(e.op, settled(e.left), settled(e.right))
    : e
}

// Un passaggio del risolutore nella posizione in cui lo svolge.
interface Positioned {
  readonly step: Step
  readonly path: Path
}

// I percorsi dei sottoalberi uguali a `target`, dalla radice verso destra.
function paths(e: Expression, target: Expression, path: Path = []): Path[] {
  const here = same(e, target) ? [path] : []
  if (e.kind === 'binary')
    return [
      ...here,
      ...paths(e.left, target, [...path, 'left']),
      ...paths(e.right, target, [...path, 'right']),
    ]
  return e.kind === 'group'
    ? [...here, ...paths(e.inner, target, [...path, 'inner'])]
    : here
}

// La posizione di un passaggio nella riga `before`: la prima, da sinistra,
// la cui sostituzione ridà la riga che il risolutore ha scritto dopo. Fra
// più operazioni uguali non è la prima che capita, ma quella svolta.
function located(before: Expression, step: Step): Path | null {
  for (const path of paths(before, step.operation)) {
    const done = replace(before, path, step.outcome)
    if (done && same(done, step.expression)) return path
  }
  return null
}

// I passaggi della prossima riga del risolutore, ciascuno nella posizione in
// cui lo svolge.
function nextSteps(e: Expression): readonly Positioned[] {
  const steps = solve(e).lines[0]?.steps ?? []
  const found: Positioned[] = []
  let before = e
  for (const step of steps) {
    const path = located(before, step)
    if (path) found.push({ step, path })
    before = step.expression
  }
  return found
}

// Il passaggio svolto sulla riga dello studente, se lì l'operazione è pronta.
function applyAt(line: Expression, positioned: Positioned): Expression | null {
  const operation = at(line, positioned.path)
  if (!operation || !same(operation, positioned.step.operation)) return null
  const done = replace(line, positioned.path, positioned.step.outcome)
  return done && settled(done)
}

// La riga scritta si ottiene dalla precedente sostituendo un sottoinsieme,
// anche di uno solo, dei passaggi del risolutore, nel loro ordine.
function reaches(
  line: Expression,
  steps: readonly Positioned[],
  target: Expression,
): boolean {
  const [head, ...rest] = steps
  if (!head) return same(line, target)
  if (reaches(line, rest, target)) return true
  const done = applyAt(line, head)
  return done !== null && reaches(done, rest, target)
}

/**
 * Una riga che si legge come un numero solo, anche fra parentesi: (14) come
 * 14. È la risposta finale, non una riga della soluzione.
 */
export function readsAsNumber(e: Expression): boolean {
  return unwrapped(e).kind === 'number'
}

export function checkLine(previous: Expression, next: Expression): LineCheck {
  if (identical(previous, next)) return { accepted: false, wrong: 'unchanged' }
  // Il tipo di parentesi non conta: una riga uguale alla precedente, a parte
  // le parentesi, va bene.
  if (same(previous, next)) return { accepted: true }
  const steps = nextSteps(previous)
  if (reaches(previous, steps, next)) return { accepted: true }
  return diagnose(previous, next, steps)
}

interface Diagnosis {
  /** Un passaggio pronto sostituito da un numero che non è il suo risultato. */
  value: Expression | null
  /** La riga cambia forma dove non c'era niente da sostituire. */
  order: boolean
}

// Il perché una riga è rifiutata, con l'operazione da controllare: quella
// svolta con il conto sbagliato, se c'è; altrimenti lo studente ha svolto
// un'operazione fuori ordine e tocca alla prossima del risolutore.
function diagnose(
  previous: Expression,
  next: Expression,
  steps: readonly Positioned[],
): LineCheck {
  const acc: Diagnosis = { value: null, order: false }
  inspect(previous, next, [], null)
  if (acc.value !== null && !acc.order)
    return { accepted: false, wrong: 'value', operation: toText(acc.value) }
  const first = steps[0]?.step
  return {
    accepted: false,
    wrong: 'order',
    operation: toText(first?.operation ?? previous),
  }

  // `parent`, quando c'è, è l'operazione pronta più vicina dentro cui si
  // guarda: un suo operando è cambiato, e il conto da rifare è il suo.
  function inspect(
    p: Expression,
    n: Expression,
    path: Path,
    parent: Expression | null,
  ): void {
    const a = unwrapped(p)
    const b = unwrapped(n)
    if (a.kind === 'number' && b.kind === 'number') {
      if (equals(a.value, b.value)) return
      if (parent) acc.value ??= parent
      else acc.order = true
      return
    }
    if (a.kind === 'binary' && b.kind === 'binary' && a.op === b.op) {
      const enclosing = readyAt(path) ? a : null
      inspect(a.left, b.left, [...path, 'left'], enclosing)
      inspect(a.right, b.right, [...path, 'right'], enclosing)
      return
    }
    if (a.kind === 'group' && b.kind === 'group' && a.negated === b.negated) {
      inspect(a.inner, b.inner, [...path, 'inner'], parent)
      return
    }
    // La forma cambia. Se al posto di un passaggio pronto c'è un numero, il
    // conto da rifare è quello; le parentesi cadute non contano.
    if (b.kind === 'number') {
      const ready =
        readyAt(path) ??
        (a.kind === 'group' && !a.negated ? readyAt([...path, 'inner']) : null)
      if (ready) {
        if (!equals(ready.step.result, b.value))
          acc.value ??= ready.step.operation
        return
      }
    }
    acc.order = true
  }

  // Il passaggio pronto che sta in quella posizione della riga precedente.
  function readyAt(path: Path): Positioned | null {
    const node = at(previous, path)
    return node === null
      ? null
      : (steps.find(
          (s) => samePath(s.path, path) && same(node, s.step.operation),
        ) ?? null)
  }
}

export function parseStepEntry(text: string): StepEntry | null {
  const [left = '', right = '', ...more] = text.split('=')
  if (more.length > 0) return null
  let operation: Expression
  try {
    operation = parseExpression(left)
  } catch {
    return null
  }
  const reading = readAnswer(right)
  return reading.ok ? { operation, result: reading.value } : null
}

export function applyOperation(
  previous: Expression,
  entry: StepEntry,
): OperationCheck {
  const steps = nextSteps(previous)
  const ready = steps.find((s) => same(s.step.operation, entry.operation))
  const first = steps[0]?.step
  const order = {
    accepted: false as const,
    wrong: 'order' as const,
    operation: toText(first?.operation ?? previous),
  }
  if (!ready) return order
  if (!equals(ready.step.result, entry.result))
    return {
      accepted: false,
      wrong: 'value',
      operation: toText(ready.step.operation),
    }
  const line = applyAt(previous, ready)
  return line ? { accepted: true, line } : order
}

export function nextStepHint(current: Expression): StepHint | null {
  const solution = solve(current)
  const line = solution.lines[0]
  const step = line?.steps[0]
  if (!line || !step) return null
  // L'ultimo passaggio è quello che dà il risultato: si nomina l'operazione
  // ma non si scrive il numero.
  const last = solution.lines.length === 1 && line.steps.length === 1
  return {
    operation: toText(step.operation),
    result: last ? null : toText(step.outcome),
  }
}
