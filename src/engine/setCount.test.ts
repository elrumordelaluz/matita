import { expect, test } from 'vitest'
import { toText } from './expression.ts'
import { finiteSet } from './finiteSet.ts'
import { generate } from './generators.ts'
import {
  countResult,
  solveCount,
  type CountExercise,
  type CountTask,
} from './setCount.ts'
import { verify } from './verify.ts'

// Insieme delle parti e prodotto cartesiano, contati e mai elencati
// (SPEC.md, "Insiemi"): card(℘(A)) = 2ⁿ, card(A × B) = card(A) × card(B).

function count(task: CountTask): CountExercise {
  return {
    kind: 'count',
    skill: 'set.parts-product',
    seed: 1,
    generatorVersion: 1,
    task,
  }
}

// C3 5.47: A = {x ∈ N | 1 ≤ x < 3} = {1, 2}, e ℘(A) ha 4 elementi.
const c3 = count({ kind: 'parts', set: finiteSet([1n, 2n]) })
const parts3 = count({ kind: 'parts', set: finiteSet([1n, 4n, 9n]) })
const product = count({
  kind: 'product',
  left: finiteSet([1n, 2n, 3n]),
  right: finiteSet([4n, 5n]),
})

function rows(exercise: CountExercise) {
  return solveCount(exercise).map((line) =>
    line.kind === 'card'
      ? `card(${line.name}) = ${line.value}`
      : `card(${line.name}) = ${toText(line.expression)} = ${line.solution.lines
          .map((l) => toText(l.expression))
          .join(' = ')}`,
  )
}

test('si contano gli elementi, poi la potenza o il prodotto', () => {
  expect(rows(c3)).toEqual(['card(A) = 2', 'card(℘(A)) = 2² = 4'])
  expect(rows(product)).toEqual([
    'card(A) = 3',
    'card(B) = 2',
    'card(A × B) = 3 × 2 = 6',
  ])
})

test('la potenza la svolge il risolutore, con il suo passaggio', () => {
  const last = solveCount(parts3).at(-1)
  if (last?.kind !== 'compute') throw new Error('Manca il conto')
  expect(last.solution.lines[0]?.steps[0]?.rule).toBe('power')
  expect(countResult(parts3)).toBe(8n)
})

test('la risposta è un numero, con la politica dei numeri', () => {
  expect(verify('4', c3)).toEqual({ kind: 'correct' })
  expect(verify('8/2', c3)).toMatchObject({
    kind: 'rewrite',
    reason: 'integer-as-fraction',
  })
  expect(verify('quattro', c3)).toMatchObject({ kind: 'invalid' })
  expect(verify('5', c3)).toEqual({ kind: 'wrong' })
})

test('2n al posto di 2ⁿ è un errore tipico, dove si vede', () => {
  expect(verify('6', parts3)).toMatchObject({
    kind: 'misconception',
    misconception: 'parts-as-double',
  })
  // Con due elementi 2n e 2ⁿ coincidono: 4 è giusto.
  expect(verify('4', c3)).toEqual({ kind: 'correct' })
})

test('card(A) + card(B) per A × B è un errore tipico', () => {
  expect(verify('5', product)).toMatchObject({
    kind: 'misconception',
    misconception: 'product-as-sum',
  })
})

test('il generatore fa vedere l’errore e tiene i conti piccoli', () => {
  for (let seed = 0; seed < 300; seed++) {
    const exercise = generate('set.parts-product', seed)
    const { task } = exercise
    const result = countResult(exercise)
    if (task.kind === 'parts') {
      const n = BigInt(task.set.elements.length)
      expect(n).toBeGreaterThanOrEqual(3n)
      expect(result).toBeLessThanOrEqual(64n)
      expect(verify(String(2n * n), exercise).kind).toBe('misconception')
    } else {
      const a = BigInt(task.left.elements.length)
      const b = BigInt(task.right.elements.length)
      expect(a + b).not.toBe(a * b)
      expect(result).toBeLessThanOrEqual(36n)
    }
  }
})
