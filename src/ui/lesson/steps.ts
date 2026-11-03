import {
  binary,
  equals,
  group,
  isNegatedPower,
  num,
  powerOfPower,
  toKatex,
  type Bracket,
  type LiteralExpression,
  type Line,
  type Step,
} from '../../engine/index.ts'

// Dove cade ogni passaggio di una soluzione: il nodo dell'espressione di
// partenza che il passaggio svolge, trovato confrontando l'espressione prima
// e dopo. Serve alla lezione per evidenziare a matita l'operazione svolta.

type Direction = 'left' | 'right' | 'inner'

export interface MarkedStep {
  readonly step: Step
  /** L'espressione prima del passaggio. */
  readonly before: LiteralExpression
  /** Il pezzo di `before` che il passaggio svolge. */
  readonly target: LiteralExpression
  /** `before` in KaTeX, con `target` dentro `\htmlClass`. */
  readonly tex: string
  /** La parentesi dentro cui si lavora, se c'è. */
  readonly bracket: Bracket | null
  /** Vero se il gruppo si riduce a un numero e le sue parentesi cadono. */
  readonly settles: boolean
}

// Le classi del segno a matita: stanno qui perché Tailwind le veda.
export const markClass =
  'rounded-md bg-pencil-soft px-1 text-pencil-ink ring-1 ring-pencil'

function child(e: LiteralExpression, d: Direction): LiteralExpression {
  if (d === 'inner' && e.kind === 'group') return e.inner
  if (d !== 'inner' && e.kind === 'binary') return e[d]
  throw new Error('Percorso non valido')
}

// Il primo nodo, in ordine da sinistra, in cui le due espressioni divergono.
function changed(
  a: LiteralExpression,
  b: LiteralExpression,
): Direction[] | null {
  if (a.kind === 'number' && b.kind === 'number')
    return equals(a.value, b.value) ? null : []
  if (a.kind === 'monomial' && b.kind === 'monomial')
    return toKatex(a) === toKatex(b) ? null : []
  if (a.kind === 'binary' && b.kind === 'binary' && a.op === b.op) {
    // Una potenza di potenza che diventa una potenza cambia tutta: (3²)³ è
    // diventata 3⁶, non è cambiata solo la base.
    if (powerOfPower(a) && !powerOfPower(b)) return []
    const left = changed(a.left, b.left)
    if (left) return ['left', ...left]
    const right = changed(a.right, b.right)
    return right && ['right', ...right]
  }
  if (
    a.kind === 'group' &&
    b.kind === 'group' &&
    a.bracket === b.bracket &&
    a.negated === b.negated
  ) {
    const inner = changed(a.inner, b.inner)
    return inner && ['inner', ...inner]
  }
  return []
}

function put(
  e: LiteralExpression,
  [head, ...rest]: readonly Direction[],
  node: LiteralExpression,
): LiteralExpression {
  if (head === undefined) return node
  if (head === 'inner' && e.kind === 'group')
    return group(e.bracket, put(e.inner, rest, node), {
      negated: e.negated === true,
    })
  if (head === 'left' && e.kind === 'binary')
    return binary(e.op, put(e.left, rest, node), e.right)
  if (head === 'right' && e.kind === 'binary')
    return binary(e.op, e.left, put(e.right, rest, node))
  throw new Error('Percorso non valido')
}

// Un numero che nessun esercizio contiene: tiene il posto del pezzo da
// evidenziare, così la resa resta quella del motore.
const hole = num(10n ** 30n)

function mark(before: LiteralExpression, step: Step): MarkedStep {
  // La sostituzione mette il valore in ogni posto della lettera: il pezzo
  // svolto è tutta l'espressione.
  // Quando il passaggio cambia la forma della somma intorno, il motore dice
  // dove ha lavorato.
  const path =
    step.rule === 'substitution'
      ? []
      : (step.path ?? changed(before, step.expression))
  if (!path) throw new Error('Passaggio senza cambiamenti')
  let bracket: Bracket | null = null
  let target = before
  // Se il pezzo sta all'inizio di tutto o di un gruppo: decide se un numero
  // negativo va fra parentesi.
  let leading = true
  for (const d of path) {
    // Il meno davanti a una potenza non disegna parentesi.
    if (target.kind === 'group' && !isNegatedPower(target))
      bracket = target.bracket
    target = child(target, d)
    if (d !== 'left') leading = d === 'inner'
  }
  // Nel cambio di segno, −(−4), le parentesi spariscono con il meno: non si
  // lavora dentro di loro, e così davanti a un polinomio, −(2a − b). In −3²
  // le parentesi non ci sono.
  const settles =
    target.kind === 'group' &&
    step.rule !== 'change-sign' &&
    step.rule !== 'minus-group' &&
    step.rule !== 'minus-power'
  if (settles && target.kind === 'group') bracket = target.bracket
  const tex = toKatex(put(before, path, hole)).replace(
    toKatex(hole),
    () =>
      `\\mathord{\\htmlClass{${markClass}}{${toKatex(target, { leading })}}}`,
  )
  return { step, before, target, tex, bracket, settles }
}

/** I passaggi di ogni riga, ciascuno con il pezzo che svolge. */
export function markedSteps(
  start: LiteralExpression,
  lines: readonly Line[],
): MarkedStep[][] {
  let before = start
  return lines.map((line) => {
    const marked = line.steps.map((step) => {
      const marked = mark(before, step)
      before = step.expression
      return marked
    })
    // Una riga può finire togliendo parentesi senza un passaggio, come dopo
    // il più: la riga dopo parte dalla riga scritta.
    before = line.expression
    return marked
  })
}
