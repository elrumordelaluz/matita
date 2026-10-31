import {
  literal,
  parseExpression,
  toText,
  type Expression,
} from './expression.ts'
import { equals, type Rational } from './rational.ts'
import { solve, type Step } from './solver.ts'

// Il controllo di una riga scritta dallo studente in modalità "Passo passo":
// una funzione pura che giudica la riga rispetto alla precedente. Vedi
// SPEC.md, "Pratica / Passo passo".
//
// Una riga va bene quando si ottiene dalla precedente sostituendo, al posto
// giusto, operazioni i cui operandi sono già numeri con il loro risultato:
// una o più alla volta, nell'ordine in cui il risolutore le svolge. Le
// parentesi non contano: cambia il conto fatto, non la riga.

/** Perché una riga è rifiutata. `copy`: la riga è identica alla precedente. */
export type StepRefusalReason = 'order' | 'value' | 'copy' | 'zero-divisor'

export type StepCheck =
  | { readonly ok: true }
  | {
      readonly ok: false
      readonly reason: StepRefusalReason
      /** Il conto da controllare, come si scrive sul quaderno. */
      readonly operation: Expression | undefined
    }

/** Il modulo di una riga scritta come conto: `3 × 7 = 21`. */
export interface OperationLine {
  readonly operation: Expression
  readonly result: Rational
}

/** Legge `3 × 7 = 21` (anche `3*7=21`); nulla se non è un conto. */
export function parseOperationLine(text: string): OperationLine | null {
  const [written, outcome, ...rest] = text.split('=')
  if (written === undefined || outcome === undefined || rest.length > 0)
    return null
  try {
    const operation = parseExpression(written)
    const result = parseExpression(outcome)
    if (result.kind !== 'number') return null
    return { operation, result: result.value }
  } catch {
    return null
  }
}

// Un percorso dalla radice a un nodo dell'albero.

type Path = readonly ('left' | 'right' | 'inner')[]

function replace(e: Expression, path: Path, node: Expression): Expression {
  const [head, ...rest] = path
  if (head === undefined) return node
  if (head === 'inner' && e.kind === 'group')
    return { ...e, inner: replace(e.inner, rest, node) }
  if (e.kind === 'binary') {
    if (head === 'left') return { ...e, left: replace(e.left, rest, node) }
    if (head === 'right') return { ...e, right: replace(e.right, rest, node) }
  }
  throw new Error('Percorso non valido')
}

// Due espressioni con la stessa forma: stessi numeri, stesse operazioni.
// Il tipo di parentesi non conta, e nemmeno il segno scritto (+4, 4).
function sameShape(a: Expression, b: Expression): boolean {
  if (a.kind === 'number' && b.kind === 'number')
    return equals(a.value, b.value)
  if (a.kind === 'group' && b.kind === 'group')
    return a.negated === b.negated && sameShape(a.inner, b.inner)
  return (
    a.kind === 'binary' &&
    b.kind === 'binary' &&
    a.op === b.op &&
    sameShape(a.left, b.left) &&
    sameShape(a.right, b.right)
  )
}

// La prima occorrenza di `target` nell'albero, da sinistra.
function findPath(
  e: Expression,
  target: Expression,
  path: Path = [],
): Path | null {
  if (sameShape(e, target)) return path
  if (e.kind === 'group') return findPath(e.inner, target, [...path, 'inner'])
  if (e.kind === 'binary')
    return (
      findPath(e.left, target, [...path, 'left']) ??
      findPath(e.right, target, [...path, 'right'])
    )
  return null
}

// Dove due espressioni diverse differiscono: il posto del conto svolto.
function diffPath(a: Expression, b: Expression, path: Path = []): Path | null {
  if (sameShape(a, b)) return null
  if (a.kind === 'binary' && b.kind === 'binary' && a.op === b.op) {
    return (
      diffPath(a.left, b.left, [...path, 'left']) ??
      diffPath(a.right, b.right, [...path, 'right'])
    )
  }
  if (a.kind === 'group' && b.kind === 'group' && a.negated === b.negated)
    return diffPath(a.inner, b.inner, [...path, 'inner'])
  return path
}

// La prima divisione per zero: è quella che blocca la riga.
function zeroDivisor(e: Expression): Expression | null {
  if (e.kind === 'binary') {
    if (
      e.op === ':' &&
      e.right.kind === 'number' &&
      equals(e.right.value, { num: 0n, den: 1n })
    )
      return e
    return zeroDivisor(e.left) ?? zeroDivisor(e.right)
  }
  if (e.kind === 'group') return zeroDivisor(e.inner)
  return null
}

// I conti che si possono fare sulla riga: i passaggi della prima riga della
// soluzione, ciascuno al suo posto nell'albero.
interface Context {
  readonly allowed: ReadonlyMap<string, Step>
  /** Il primo conto da fare: è quello che si nomina quando l'ordine è sbagliato. */
  readonly first: Expression | undefined
  /** La divisione per zero che impedisce di giudicare la riga, se c'è. */
  readonly zero: Expression | undefined
}

function context(previous: Expression): Context {
  try {
    const [line] = solve(previous).lines
    if (!line) return { allowed: new Map(), first: undefined, zero: undefined }
    const allowed = new Map<string, Step>()
    let current = previous
    for (const step of line.steps) {
      const path = diffPath(current, step.expression)
      if (!path) break
      allowed.set(path.join(), step)
      current = step.expression
    }
    return {
      allowed,
      first: line.steps[0]?.operation,
      zero: undefined,
    }
  } catch (error) {
    if (error instanceof RangeError)
      return {
        allowed: new Map(),
        first: undefined,
        zero: zeroDivisor(previous) ?? undefined,
      }
    throw error
  }
}

// Il confronto ricorsivo fra la riga precedente e quella scritta.

type Verdict =
  | { readonly status: 'same' }
  | { readonly status: 'resolved' }
  | {
      readonly status: 'refused'
      readonly reason: StepRefusalReason
      readonly operation: Expression | undefined
    }

const refusedOrder = (ctx: Context): Verdict => ({
  status: 'refused',
  reason: 'order',
  operation: ctx.first,
})

function isRefused(
  v: Verdict,
): v is Extract<Verdict, { readonly status: 'refused' }> {
  return v.status === 'refused'
}

// Il numero dentro parentesi tonde, se la riga è solo quello: (14).
function bareNumber(e: Expression): Expression | null {
  return e.kind === 'group' && !e.negated && e.inner.kind === 'number'
    ? e.inner
    : null
}

function match(
  previous: Expression,
  next: Expression,
  path: Path,
  ctx: Context,
): Verdict {
  const unwrapped = bareNumber(next)
  if (unwrapped) return match(previous, unwrapped, path, ctx)
  if (previous.kind === 'number') {
    if (next.kind === 'number')
      return equals(previous.value, next.value)
        ? { status: 'same' }
        : refusedOrder(ctx)
    return refusedOrder(ctx)
  }
  if (previous.kind === 'group') {
    if (next.kind === 'group') {
      if (previous.negated !== next.negated) return refusedOrder(ctx)
      return match(previous.inner, next.inner, [...path, 'inner'], ctx)
    }
    // Un gruppo che diventa un numero: il conto è quello che sta dentro,
    // oppure il cambio di segno, che ha per operazione il gruppo stesso.
    if (next.kind === 'number') {
      const step = ctx.allowed.get(path.join())
      if (step)
        return equals(step.result, next.value)
          ? { status: 'resolved' }
          : { status: 'refused', reason: 'value', operation: step.operation }
      if (!previous.negated)
        return match(previous.inner, next, [...path, 'inner'], ctx)
    }
    return refusedOrder(ctx)
  }
  // Un'operazione con i due numeri può diventare il suo risultato.
  if (next.kind === 'number') {
    const step = ctx.allowed.get(path.join())
    if (step)
      return equals(step.result, next.value)
        ? { status: 'resolved' }
        : { status: 'refused', reason: 'value', operation: step.operation }
    return refusedOrder(ctx)
  }
  if (next.kind !== 'binary' || previous.op !== next.op)
    return refusedOrder(ctx)
  const left = match(previous.left, next.left, [...path, 'left'], ctx)
  const right = match(previous.right, next.right, [...path, 'right'], ctx)
  const refusals = [left, right].filter(isRefused)
  if (refusals.length > 0) {
    // Un operando cambiato senza conto è ordine sbagliato: vince sul conto
    // sbagliato che sta dall'altra parte, come in 2 + 3 + 4 → 2 + 7.
    return (
      refusals.find((v) => v.reason === 'order') ??
      (refusals[0] as Extract<Verdict, { readonly status: 'refused' }>)
    )
  }
  return left.status === 'resolved' || right.status === 'resolved'
    ? { status: 'resolved' }
    : { status: 'same' }
}

/**
 * Giudica la riga `next` rispetto alla riga `previous`: va bene quando si
 * ottiene sostituendo uno o più conti già possibili con il loro risultato.
 * Le parentesi, di qualunque tipo, non contano.
 */
export function checkStep(previous: Expression, next: Expression): StepCheck {
  const ctx = context(previous)
  if (ctx.zero && !sameShape(previous, next))
    return { ok: false, reason: 'zero-divisor', operation: ctx.zero }
  const verdict = match(previous, next, [], ctx)
  if (verdict.status === 'refused')
    return { ok: false, reason: verdict.reason, operation: verdict.operation }
  if (verdict.status === 'same')
    return toText(previous) === toText(next)
      ? { ok: false, reason: 'copy', operation: undefined }
      : { ok: true }
  return { ok: true }
}

/**
 * Applica alla riga `previous` un conto scritto come `3 × 7 = 21`: la prima
 * occorrenza dell'operazione diventa il risultato scritto. La riga che ne
 * esce è giudicata come una riga intera.
 */
export function operationStep(
  previous: Expression,
  written: OperationLine,
):
  | { readonly ok: true; readonly line: Expression }
  | {
      readonly ok: false
      readonly reason: StepRefusalReason
      readonly operation: Expression | undefined
    } {
  const ctx = context(previous)
  if (ctx.zero)
    return { ok: false, reason: 'zero-divisor', operation: ctx.zero }
  const path = findPath(previous, written.operation)
  if (!path) return { ok: false, reason: 'order', operation: ctx.first }
  const line = replace(previous, path, literal(written.result))
  const check = checkStep(previous, line)
  return check.ok ? { ok: true, line } : check
}
