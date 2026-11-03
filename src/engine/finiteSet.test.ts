import { expect, test } from 'vitest'
import {
  card,
  complement,
  difference,
  finiteSet,
  intersection,
  isSubset,
  setEquals,
  setToKatex,
  setToText,
  union,
} from './finiteSet.ts'

// L'insieme del capitolo 5 (SPEC.md, "Il dato"): naturali senza ripetizioni,
// in un ordine qualsiasi. Uguale vuol dire stessi elementi.

test('l’ordine e i doppioni non cambiano l’insieme', () => {
  // C3, Def. 5.1: {1, 2, 3, 5} = {2, 1, 5, 3}.
  expect(
    setEquals(finiteSet([1n, 2n, 3n, 5n]), finiteSet([2n, 1n, 5n, 3n])),
  ).toBe(true)
  expect(finiteSet([3n, 1n, 3n]).elements).toEqual([1n, 3n])
  expect(setEquals(finiteSet([1n]), finiteSet([1n, 2n]))).toBe(false)
})

test('si scrive per elencazione in ordine crescente, il vuoto con ∅', () => {
  expect(setToText(finiteSet([4n, 2n, 3n]))).toBe('{2, 3, 4}')
  expect(setToText(finiteSet([]))).toBe('∅')
  expect(setToKatex(finiteSet([2n, 3n]))).toBe('\\{2, 3\\}')
  expect(setToKatex(finiteSet([]))).toBe('\\varnothing')
})

test('unione, intersezione, differenza e complementare', () => {
  const a = finiteSet([1n, 3n, 5n, 7n])
  const b = finiteSet([2n, 3n, 5n])
  expect(setToText(union(a, b))).toBe('{1, 2, 3, 5, 7}')
  expect(setToText(intersection(a, b))).toBe('{3, 5}')
  expect(setToText(difference(a, b))).toBe('{1, 7}')
  expect(setToText(difference(b, a))).toBe('{2}')
  const u = finiteSet([1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n])
  expect(setToText(complement(a, u))).toBe('{2, 4, 6, 8}')
})

test('sottoinsieme e cardinalità', () => {
  const a = finiteSet([1n, 2n, 3n])
  expect(isSubset(finiteSet([2n]), a)).toBe(true)
  expect(isSubset(a, a)).toBe(true)
  expect(isSubset(finiteSet([2n, 9n]), a)).toBe(false)
  expect(card(a)).toBe(3n)
  expect(card(finiteSet([]))).toBe(0n)
})
