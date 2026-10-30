import { toText, type Expression } from './expression.ts'
import { equals } from './rational.ts'
import { solve, type Step } from './solver.ts'

// Il controllo riga per riga della pratica "Passo passo". Vedi SPEC.md,
// "Pratica / Passo passo": una riga va bene se si ottiene dalla precedente
// sostituendo con il loro risultato, una o più alla volta, i passaggi che il
// risolutore farebbe adesso su quella riga. Così l'ordine delle operazioni
// è quello del quaderno: prima il dentro delle parentesi, poi le potenze,
// poi × e :, poi + e −, da sinistra. Il tipo di parentesi non conta.

/** Perché una riga è rifiutata: l'ordine delle operazioni o il valore. */
export type LineWrong = 'order' | 'value'

export type LineCheck =
  | { readonly accepted: true }
  | {
      readonly accepted: false
      readonly wrong: LineWrong
      /** L'operazione da controllare, come testo. */
      readonly operation: string
    }

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

// Un gruppo senza meno intorno a un solo numero è solo il modo di scrivere
// quel numero: (7) è 7.
function unwrapped(e: Expression): Expression {
  return e.kind === 'group' && !e.negated && e.inner.kind === 'number'
    ? e.inner
    : e
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

// Un percorso dalla radice a un nodo dell'albero.
type Path = readonly ('left' | 'right' | 'inner')[]

function find(e: Expression, target: Expression, path: Path = []): Path | null {
  if (same(e, target)) return path
  if (e.kind === 'binary')
    return (
      find(e.left, target, [...path, 'left']) ??
      find(e.right, target, [...path, 'right'])
    )
  if (e.kind === 'group') return find(e.inner, target, [...path, 'inner'])
  return null
}

function replace(e: Expression, path: Path, node: Expression): Expression {
  const [head, ...rest] = path
  if (head === undefined) return node
  if (head === 'inner' && e.kind === 'group')
    return { ...e, inner: replace(e.inner, rest, node) }
  if (head === 'left' && e.kind === 'binary')
    return { ...e, left: replace(e.left, rest, node) }
  if (head === 'right' && e.kind === 'binary')
    return { ...e, right: replace(e.right, rest, node) }
  throw new Error('Percorso non valido')
}

function applyStep(e: Expression, step: Step): Expression | null {
  const path = find(e, step.operation)
  return path ? replace(e, path, step.outcome) : null
}

// Le righe che si possono scrivere dopo `e`: ogni sottoinsieme non vuoto dei
// passaggi della prossima riga del risolutore, applicati in ordine. I
// passaggi indipendenti (2 × 3 + 4 × 5) si possono svolto uno, l'altro o
// entrambi; quelli in catena (2 + 3 + 4) solo dal primo.
function successors(e: Expression, steps: readonly Step[]): Expression[] {
  let results: Expression[] = [e]
  for (const step of steps) {
    results = results.flatMap((r) => {
      const next = applyStep(r, step)
      return next ? [r, next] : [r]
    })
  }
  return results.slice(1)
}

// Il confronto fra la riga scritta e quella attesa, per nominare
// l'operazione da controllare: un'operazione pronta sostituita da un numero
// sbagliato, o un operando cambiato sotto un'operazione rimasta al suo
// posto. Se invece la struttura cambia, lo studente ha svolto un'operazione
// dove non toccava: è l'ordine, e l'operazione da controllare è la prossima
// del risolutore.
interface Diff {
  wrongOperation: Expression | null
}

function diff(
  previous: Expression,
  next: Expression,
  steps: readonly Step[],
  enclosing: Expression | null,
  acc: Diff,
): void {
  if (previous.kind === 'number' && next.kind === 'number') {
    if (!equals(previous.value, next.value) && !acc.wrongOperation)
      acc.wrongOperation = enclosing
    return
  }
  if (
    previous.kind === 'binary' &&
    next.kind === 'binary' &&
    previous.op === next.op
  ) {
    diff(previous.left, next.left, steps, previous, acc)
    diff(previous.right, next.right, steps, previous, acc)
    return
  }
  if (
    previous.kind === 'group' &&
    next.kind === 'group' &&
    previous.negated === next.negated
  ) {
    diff(previous.inner, next.inner, steps, previous, acc)
    return
  }
  // Un pezzo dell'albero è diventato un numero: se è un'operazione pronta
  // con un risultato sbagliato, è lì che controllare.
  if (
    next.kind === 'number' &&
    steps.some((s) => same(s.operation, previous))
  ) {
    if (!equals(solve(previous).result, next.value) && !acc.wrongOperation)
      acc.wrongOperation = previous
  }
}

export function checkLine(previous: Expression, next: Expression): LineCheck {
  // Il tipo di parentesi non conta: una riga uguale alla precedente, a parte
  // le parentesi, è accettata.
  if (same(previous, next)) return { accepted: true }
  const steps = solve(previous).lines[0]?.steps ?? []
  if (successors(previous, steps).some((s) => same(s, next)))
    return { accepted: true }
  const acc: Diff = { wrongOperation: null }
  diff(previous, next, steps, null, acc)
  // Il valore di una sostituzione legale non cambia: righe a valore diverso
  // sono errori di conto, le altre errori d'ordine. L'operazione da
  // controllare: quella svolta male, se c'è, altrimenti la prossima da fare.
  const first = steps[0]
  const sameValue = equals(solve(previous).result, solve(next).result)
  if (acc.wrongOperation && !sameValue)
    return {
      accepted: false,
      wrong: 'value',
      operation: toText(acc.wrongOperation),
    }
  return {
    accepted: false,
    wrong: 'order',
    operation: first ? toText(first.operation) : toText(previous),
  }
}

export function nextStepHint(current: Expression): StepHint | null {
  const solution = solve(current)
  const step = solution.lines[0]?.steps[0]
  if (!step) return null
  // L'ultimo passaggio è quello che dà il risultato: si nomina l'operazione
  // ma non si scrive il numero.
  const last =
    solution.lines.length === 1 && (solution.lines[0]?.steps.length ?? 0) === 1
  return {
    operation: toText(step.operation),
    result: last ? null : toText(step.outcome),
  }
}
