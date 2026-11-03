import { setEquals, type FiniteSet } from './finiteSet.ts'
import { seededRandom, type Random } from './random.ts'
import { readSetAnswer, setRewriteMessages } from './setAnswer.ts'
import { setExplanation, type SetMisconceptionId } from './setMisconceptions.ts'
import {
  acceptsRoster,
  buildProperty,
  rosterOf,
  rosterWrongResults,
  type Property,
} from './setRoster.ts'
import type { Outcome } from './verify.ts'

// Gli esercizi che chiedono un insieme (SPEC.md, "Insiemi"): la consegna, la
// soluzione per righe, la verifica della risposta e i generatori.

/** Un esercizio la cui risposta è un insieme, scritto per elencazione. */
export interface SetExercise {
  readonly kind: 'set'
  readonly skill: SetSkill
  readonly seed: number
  readonly generatorVersion: number
  readonly task: SetTask
}

/** La consegna: la proprietà caratteristica da elencare. */
export type SetTask = { readonly kind: 'roster'; readonly property: Property }

/** Una riga della soluzione di un esercizio di insiemi. */
export type SetLine = {
  readonly kind: 'roster'
  /** L'insieme per elencazione, in ordine crescente. */
  readonly result: FiniteSet
}

export interface SetSolution {
  readonly lines: readonly SetLine[]
  readonly result: FiniteSet
}

export function solveSet(exercise: SetExercise): SetSolution {
  const result = rosterOf(exercise.task.property)
  return { lines: [{ kind: 'roster', result }], result }
}

// Gli insiemi che danno le regole sbagliate sull'esercizio, dal più preciso.
function wrongResults(
  exercise: SetExercise,
): { readonly id: SetMisconceptionId; readonly value: FiniteSet }[] {
  return rosterWrongResults(exercise.task.property)
}

export function verifySet(answer: string, exercise: SetExercise): Outcome {
  const reading = readSetAnswer(answer)
  if (!reading.ok) return { kind: 'invalid', message: reading.message }
  const { result } = solveSet(exercise)
  if (!reading.withEmpty && setEquals(reading.value, result)) {
    if (reading.rewrite === null) return { kind: 'correct' }
    return {
      kind: 'rewrite',
      reason: reading.rewrite,
      message: setRewriteMessages[reading.rewrite],
    }
  }
  const id = recognise(reading.value, reading.withEmpty, exercise, result)
  if (id)
    return {
      kind: 'misconception',
      misconception: id,
      explanation: setExplanation(id),
    }
  return { kind: 'wrong' }
}

function recognise(
  value: FiniteSet,
  withEmpty: boolean,
  exercise: SetExercise,
  result: FiniteSet,
): SetMisconceptionId | null {
  // Dove la risposta giusta è ∅: {0}, {∅} e 0 hanno un elemento.
  if (result.elements.length === 0) {
    const zero = !withEmpty && value.elements.join() === '0'
    const emptyInside = withEmpty && value.elements.length === 0
    if (zero || emptyInside) return 'empty-set-has-elements'
  }
  if (withEmpty) return null
  return (
    wrongResults(exercise).find((w) => setEquals(w.value, value))?.id ?? null
  )
}

interface SetGenerator {
  readonly version: number
  build(random: Random): SetTask | null
}

const maxAttempts = 1000

export const setGenerators = {
  'set.roster': {
    version: 1,
    build(random) {
      const property = buildProperty(random)
      return acceptsRoster(property) ? { kind: 'roster', property } : null
    },
  },
} satisfies Record<string, SetGenerator>

/** Le abilità i cui esercizi chiedono un insieme. */
export type SetSkill = keyof typeof setGenerators

export function isSetSkill(skill: string): skill is SetSkill {
  return Object.hasOwn(setGenerators, skill)
}

// Costruisce finché la consegna rispetta i vincoli: lo stesso seme scarta
// sempre le stesse.
export function generateSet(skill: SetSkill, seed: number): SetExercise {
  const generator: SetGenerator = setGenerators[skill]
  const random = seededRandom(seed)
  for (let i = 0; i < maxAttempts; i++) {
    const task = generator.build(random)
    if (task)
      return {
        kind: 'set',
        skill,
        seed,
        generatorVersion: generator.version,
        task,
      }
  }
  throw new Error('Nessun esercizio valido')
}
