import { isMulDiv, type Expression, type Operator } from './expression.ts'
import { equals, type Rational } from './rational.ts'
import { apply } from './solver.ts'

// Gli errori tipici. Ognuno è una variante sbagliata di una regola del
// risolutore: il motore valuta l'esercizio con la regola sbagliata e
// confronta il risultato con la risposta. Vedi SPEC.md, "Errori tipici".

export type MisconceptionId =
  | 'add-before-mul'
  | 'add-sub-right-to-left'
  | 'mul-div-right-to-left'
  | 'ignored-group'

export interface Misconception {
  readonly id: MisconceptionId
  /** Il testo per lo studente, in italiano. */
  readonly explanation: string
  /** I valori che dà l'esercizio svolto con la regola sbagliata. */
  wrongResults(e: Expression): Rational[]
}

// Le regole con cui si svolge un'espressione: quella giusta è prima × e :,
// tutte e due le priorità da sinistra a destra, ogni gruppo prima di ciò che
// lo circonda.
interface Rules {
  readonly first: 'mul-div' | 'add-sub'
  readonly mulDiv: 'left-to-right' | 'right-to-left'
  readonly addSub: 'left-to-right' | 'right-to-left'
  /** Un gruppo letto come se le sue parentesi non ci fossero. */
  readonly ignored?: Expression
}

const correctRules: Rules = {
  first: 'mul-div',
  mulDiv: 'left-to-right',
  addSub: 'left-to-right',
}

// L'espressione letta come la scrive lo studente: numeri e operatori in fila,
// con ogni gruppo già ridotto al suo valore.
interface Chain {
  readonly operands: Rational[]
  readonly ops: Operator[]
}

function flatten(e: Expression, rules: Rules, chain: Chain): void {
  if (e.kind === 'number') {
    chain.operands.push(e.value)
    return
  }
  if (e.kind === 'group') {
    if (e === rules.ignored) flatten(e.inner, rules, chain)
    else chain.operands.push(evaluate(e.inner, rules))
    return
  }
  flatten(e.left, rules, chain)
  chain.ops.push(e.op)
  flatten(e.right, rules, chain)
}

function reducePriority(
  { operands, ops }: Chain,
  accepts: (op: Operator) => boolean,
  direction: Rules['addSub'],
): void {
  const next = () => {
    if (direction === 'left-to-right') return ops.findIndex(accepts)
    return ops.findLastIndex(accepts)
  }
  for (let i = next(); i >= 0; i = next()) {
    const [op] = ops.splice(i, 1)
    const [left, right] = operands.splice(i, 2)
    if (op === undefined || left === undefined || right === undefined)
      throw new Error('Catena malformata')
    operands.splice(i, 0, apply(op, left, right))
  }
}

function evaluate(e: Expression, rules: Rules): Rational {
  const chain: Chain = { operands: [], ops: [] }
  flatten(e, rules, chain)
  const isAddSub = (op: Operator) => !isMulDiv(op)
  const levels = [
    () => reducePriority(chain, isMulDiv, rules.mulDiv),
    () => reducePriority(chain, isAddSub, rules.addSub),
  ]
  if (rules.first === 'add-sub') levels.reverse()
  for (const level of levels) level()
  const [result] = chain.operands
  if (result === undefined) throw new Error('Catena vuota')
  return result
}

// Una regola sbagliata può portare a dividere per zero: lì non c'è un
// valore da confrontare.
function attempt(e: Expression, rules: Rules): Rational[] {
  try {
    return [evaluate(e, rules)]
  } catch (error) {
    if (error instanceof RangeError) return []
    throw error
  }
}

function groups(e: Expression): Expression[] {
  if (e.kind === 'number') return []
  if (e.kind === 'group') return [e, ...groups(e.inner)]
  return [...groups(e.left), ...groups(e.right)]
}

export const misconceptions: readonly Misconception[] = [
  {
    id: 'add-before-mul',
    explanation:
      'Hai svolto l’addizione o la sottrazione prima della moltiplicazione o della divisione. Senza parentesi si fanno prima × e :, poi + e −.',
    wrongResults: (e) => attempt(e, { ...correctRules, first: 'add-sub' }),
  },
  {
    id: 'add-sub-right-to-left',
    explanation:
      'Hai svolto addizioni e sottrazioni partendo da destra. + e − hanno la stessa priorità: si svolgono nell’ordine in cui compaiono, da sinistra a destra.',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, addSub: 'right-to-left' }),
  },
  {
    id: 'mul-div-right-to-left',
    explanation:
      'Hai svolto moltiplicazioni e divisioni partendo da destra. × e : hanno la stessa priorità: si svolgono nell’ordine in cui compaiono, da sinistra a destra.',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, mulDiv: 'right-to-left' }),
  },
  {
    id: 'ignored-group',
    explanation:
      'Hai svolto i calcoli come se una parentesi non ci fosse. Le parentesi dicono che cosa calcolare per primo: si parte dal gruppo più interno.',
    // Un valore per ogni gruppo ignorato, uno alla volta.
    wrongResults: (e) =>
      groups(e).flatMap((ignored) => attempt(e, { ...correctRules, ignored })),
  },
]

/** L'errore tipico che spiega una risposta sbagliata, se ce n'è uno. */
export function recognise(
  answer: Rational,
  e: Expression,
  correct: Rational,
): Misconception | undefined {
  if (equals(answer, correct)) return undefined
  return misconceptions.find((m) =>
    m.wrongResults(e).some((wrong) => equals(wrong, answer)),
  )
}

/**
 * Vero se nell'esercizio l'errore si vede: la regola sbagliata dà sempre un
 * valore diverso da quello giusto.
 */
export function isVisible(
  id: MisconceptionId,
  e: Expression,
  correct: Rational,
): boolean {
  const misconception = misconceptions.find((m) => m.id === id)
  const wrong = misconception?.wrongResults(e) ?? []
  return wrong.length > 0 && wrong.every((w) => !equals(w, correct))
}
