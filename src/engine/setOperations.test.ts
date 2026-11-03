import { expect, test } from 'vitest'
import { finiteSet, setToText } from './finiteSet.ts'
import { generate } from './generators.ts'
import { solveSet, type SetExercise } from './setExercise.ts'
import {
  binarySet,
  complementOf,
  named,
  setExpressionToKatex,
  setExpressionToText,
  type SetExpression,
  type SetName,
} from './setOperations.ts'
import { verify } from './verify.ts'

// Unione, intersezione, differenza e complementare su insiemi dati per
// elencazione (SPEC.md, "Insiemi", "Il dato" e "Risolutore").

const a = named('A')
const b = named('B')
const c = named('C')

function operations(
  sets: Partial<Record<SetName, readonly bigint[]>>,
  expression: SetExpression,
  universe?: readonly bigint[],
): SetExercise {
  return {
    kind: 'set',
    skill: 'set.operations',
    seed: 1,
    generatorVersion: 1,
    task: {
      kind: 'operations',
      sets: Object.entries(sets).map(([name, elements]) => ({
        name: name as SetName,
        set: finiteSet(elements),
      })),
      ...(universe && { universe: finiteSet(universe) }),
      expression,
    },
  }
}

// C3 5.58, con le lettere al posto dei numeri (a = 1, b = 2, …, t = 20):
// S = {a, b, c, e, f, s, t}, T = {a, c, g, h, l, s}, U = {b, c, d, g, s, t}.
const c3 = operations(
  {
    A: [1n, 2n, 3n, 5n, 6n, 19n, 20n],
    B: [1n, 3n, 7n, 8n, 12n, 19n],
    C: [2n, 3n, 4n, 7n, 19n, 20n],
  },
  binarySet('∩', binarySet('∩', a, b), c),
)

const two = operations(
  { A: [1n, 3n, 5n, 7n], B: [2n, 3n, 5n] },
  binarySet('∪', a, b),
)

function rows(exercise: SetExercise) {
  return solveSet(exercise).lines.map((line) => {
    if (line.kind !== 'operation') throw new Error('Non è un’operazione')
    return `${setExpressionToText(line.label)} = ${setToText(line.result)}`
  })
}

test('più di un’operazione ha sempre le parentesi', () => {
  expect(setExpressionToText(binarySet('∩', binarySet('∪', a, b), c))).toBe(
    '(A ∪ B) ∩ C',
  )
  expect(setExpressionToText(binarySet('−', a, binarySet('∪', b, c)))).toBe(
    'A − (B ∪ C)',
  )
  expect(setExpressionToText(binarySet('∩', complementOf(a), b))).toBe('Ā ∩ B')
  expect(setExpressionToKatex(binarySet('∩', complementOf(a), b))).toBe(
    '\\overline{A} \\cap B',
  )
})

test('una riga per operazione, dal gruppo più interno', () => {
  expect(rows(c3)).toEqual(['A ∩ B = {1, 3, 19}', '(A ∩ B) ∩ C = {3, 19}'])
  expect(rows(two)).toEqual(['A ∪ B = {1, 2, 3, 5, 7}'])
})

test('il passaggio porta gli elementi che entrano', () => {
  const minus = operations(
    { A: [1n, 3n, 5n, 7n], B: [2n, 3n, 5n] },
    binarySet('−', a, b),
  )
  const [line] = solveSet(minus).lines
  if (line?.kind !== 'operation') throw new Error('Manca la riga')
  expect(line.op).toBe('−')
  expect(setToText(line.entering)).toBe('{1, 7}')
})

test('il complementare si prende rispetto all’universo dato', () => {
  const ex = operations(
    { A: [1n, 2n, 3n], B: [2n, 4n, 6n] },
    binarySet('∩', complementOf(a), b),
    [1n, 2n, 3n, 4n, 5n, 6n],
  )
  expect(rows(ex)).toEqual(['Ā = {4, 5, 6}', 'Ā ∩ B = {4, 6}'])
})

test('il risultato si verifica come insieme', () => {
  expect(verify('{3, 19}', c3)).toEqual({ kind: 'correct' })
  expect(verify('{19, 3}', c3)).toEqual({ kind: 'correct' })
  expect(verify('{1, 3, 19}', c3)).toEqual({ kind: 'wrong' })
})

test('∪ scambiata con ∩ è un errore tipico', () => {
  expect(verify('{3, 5}', two)).toMatchObject({
    kind: 'misconception',
    misconception: 'union-intersection-swapped',
  })
  // In C3 5.58 basta scambiarne una: (A ∪ B) ∩ C.
  expect(verify('{2, 3, 7, 19, 20}', c3)).toMatchObject({
    misconception: 'union-intersection-swapped',
  })
})

test('B − A al posto di A − B è un errore tipico', () => {
  const minus = operations(
    { A: [1n, 3n, 5n, 7n], B: [2n, 3n, 5n] },
    binarySet('−', a, b),
  )
  expect(verify('{2}', minus)).toMatchObject({
    kind: 'misconception',
    misconception: 'difference-reversed',
  })
})

test('dove la risposta è ∅, {0} è un errore tipico', () => {
  const disjoint = operations(
    { A: [1n, 2n], B: [3n, 4n] },
    binarySet('∩', a, b),
  )
  expect(verify('∅', disjoint)).toEqual({ kind: 'correct' })
  expect(verify('{0}', disjoint)).toMatchObject({
    misconception: 'empty-set-has-elements',
  })
})

test('il generatore di set.operations rispetta i vincoli', () => {
  for (let seed = 0; seed < 300; seed++) {
    const exercise = generate('set.operations', seed)
    const { task } = exercise
    if (task.kind !== 'operations') throw new Error('Non è un’operazione')
    const text = setExpressionToText(task.expression)
    const names = new Set(task.sets.map((s) => s.name))
    expect(names.size, text).toBe(task.sets.length)
    // Un complementare vuole l'universo, e ogni insieme ci sta dentro.
    if (text.includes('̄') || text.includes('Ā'))
      expect(task.universe, text).toBeDefined()
    for (const { set } of task.sets)
      expect(set.elements.length, text).toBeGreaterThanOrEqual(2)
    const { lines, result } = solveSet(exercise)
    expect(lines.length, text).toBeGreaterThanOrEqual(1)
    expect(lines.length, text).toBeLessThanOrEqual(2)
    expect(result.elements.length, text).toBeLessThanOrEqual(8)
  }
})
