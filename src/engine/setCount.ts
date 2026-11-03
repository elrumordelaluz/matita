import { binary, num, power, type Expression } from './expression.ts'
import {
  card,
  finiteSet,
  setToKatex,
  setToText,
  type FiniteSet,
} from './finiteSet.ts'
import { seededRandom, type Random } from './random.ts'
import type { SetMisconceptionId } from './setMisconceptions.ts'
import { solve, type Solution } from './solver.ts'

// Insieme delle parti e prodotto cartesiano, contati: card(℘(A)) = 2ⁿ e
// card(A × B) = card(A) × card(B). Vedi SPEC.md, "Insiemi". Elencarli dà
// risposte lunghe e scomode al telefono, e resta alla lezione.

/** Cosa si conta: gli elementi di ℘(A), o le coppie di A × B. */
export type CountTask =
  | { readonly kind: 'parts'; readonly set: FiniteSet }
  | {
      readonly kind: 'product'
      readonly left: FiniteSet
      readonly right: FiniteSet
    }

/**
 * Un esercizio che chiede quanti elementi ha un insieme costruito da altri.
 * La risposta è un numero, ma la consegna sono gli insiemi: l'espressione
 * 2ⁿ o card(A) × card(B) è la soluzione, e scriverla svelerebbe il conto.
 */
export interface CountExercise {
  readonly kind: 'count'
  readonly skill: 'set.parts-product'
  readonly seed: number
  readonly generatorVersion: number
  readonly task: CountTask
}

/** Una riga: il conto degli elementi di un insieme, o la potenza o il prodotto. */
export type CountLine =
  | { readonly kind: 'card'; readonly name: 'A' | 'B'; readonly value: bigint }
  | {
      readonly kind: 'compute'
      readonly name: '℘(A)' | 'A × B'
      /** 2ⁿ o card(A) × card(B), con i numeri al posto delle cardinalità. */
      readonly expression: Expression
      /** Le righe del risolutore del capitolo 1, con i loro passaggi. */
      readonly solution: Solution
    }

function computed(name: '℘(A)' | 'A × B', expression: Expression): CountLine {
  return { kind: 'compute', name, expression, solution: solve(expression) }
}

export function solveCount({ task }: CountExercise): CountLine[] {
  if (task.kind === 'parts') {
    const n = card(task.set)
    return [
      { kind: 'card', name: 'A', value: n },
      computed('℘(A)', power(num(2n), n)),
    ]
  }
  const a = card(task.left)
  const b = card(task.right)
  return [
    { kind: 'card', name: 'A', value: a },
    { kind: 'card', name: 'B', value: b },
    computed('A × B', binary('×', num(a), num(b))),
  ]
}

export function countResult({ task }: CountExercise): bigint {
  if (task.kind === 'parts') return 2n ** card(task.set)
  return card(task.left) * card(task.right)
}

/** I valori che danno le regole sbagliate, con l'errore che li spiega. */
export function countWrongResults({ task }: CountExercise): {
  readonly id: SetMisconceptionId
  readonly value: bigint
}[] {
  if (task.kind === 'parts')
    return [{ id: 'parts-as-double', value: 2n * card(task.set) }]
  return [{ id: 'product-as-sum', value: card(task.left) + card(task.right) }]
}

/** Gli insiemi dati, per elencazione: A = {1, 2, 3}. */
export function countGivens({ task }: CountExercise) {
  const sets =
    task.kind === 'parts'
      ? [{ name: 'A', set: task.set }]
      : [
          { name: 'A', set: task.left },
          { name: 'B', set: task.right },
        ]
  return sets.map(({ name, set }) => ({
    tex: `${name} = ${setToKatex(set)}`,
    text: `${name} = ${setToText(set)}`,
  }))
}

/** Ciò che si chiede: card(℘(A)) o card(A × B). */
export function countAsked({ task }: CountExercise) {
  return task.kind === 'parts'
    ? { tex: '\\operatorname{card}(\\wp(A))', text: 'card(℘(A))' }
    : { tex: '\\operatorname{card}(A \\times B)', text: 'card(A × B)' }
}

// La costruzione: per ℘(A) da tre a sei elementi, perché con due 2n e 2ⁿ
// coincidono e la potenza resta entro 64; per A × B da due a sei elementi
// per insieme, mai due e due, dove la somma e il prodotto coincidono.

const pool = Array.from({ length: 21 }, (_, i) => BigInt(i))

function setOfSize(random: Random, size: bigint): FiniteSet {
  const chosen = new Set<bigint>()
  while (BigInt(chosen.size) < size) chosen.add(random.pick(pool))
  return finiteSet(chosen)
}

export const countVersion = 1

export function generateCount(seed: number): CountExercise {
  const random = seededRandom(seed)
  const make = (task: CountTask): CountExercise => ({
    kind: 'count',
    skill: 'set.parts-product',
    seed,
    generatorVersion: countVersion,
    task,
  })
  if (random.pick([true, false]))
    return make({ kind: 'parts', set: setOfSize(random, random.int(3n, 6n)) })
  for (;;) {
    const a = random.int(2n, 6n)
    const b = random.int(2n, 6n)
    if (a + b === a * b) continue
    return make({
      kind: 'product',
      left: setOfSize(random, a),
      right: setOfSize(random, b),
    })
  }
}
