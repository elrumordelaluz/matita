import { describe, expect, test } from 'vitest'
import { hasLetters, type LiteralExpression } from './expression.ts'
import { generate } from './generators.ts'
import { isVisible } from './misconceptions.ts'
import { solveWithValues, substitute } from './value.ts'

// I generatori del calcolo letterale. SPEC.md, "Calcolo letterale",
// "Generatori".

const seeds = Array.from({ length: 300 }, (_, i) => i * 7919 + 1)

function letters(e: LiteralExpression): Set<string> {
  if (e.kind === 'monomial') return new Set(e.letters.map((l) => l.letter))
  if (e.kind === 'number') return new Set()
  if (e.kind === 'group') return letters(e.inner)
  return new Set([...letters(e.left), ...letters(e.right)])
}

const magnitude = (n: bigint) => (n < 0n ? -n : n)

describe('mono.value', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('mono.value', 42)).toEqual(generate('mono.value', 42))
  })

  test('chiede un numero: un’espressione letterale e i valori delle lettere', () => {
    for (const seed of seeds.slice(0, 50)) {
      const exercise = generate('mono.value', seed)
      expect(exercise.kind).toBe('number')
      expect(hasLetters(exercise.expression)).toBe(true)
      const used = letters(exercise.expression)
      expect(used.size).toBeLessThanOrEqual(3)
      expect(exercise.substitution?.map((a) => a.letter).sort()).toEqual(
        [...used].sort(),
      )
    }
  })

  test('il negativo sostituito senza tonde cambia sempre il risultato', () => {
    for (const seed of seeds) {
      const { expression, substitution = [] } = generate('mono.value', seed)
      const { result } = solveWithValues(expression, substitution)
      expect(
        isVisible(
          'negative-substituted-without-brackets',
          substitute(expression, substitution),
          result,
        ),
        `seme ${seed}`,
      ).toBe(true)
    }
  })

  test('i conti restano nel calcolo mentale', () => {
    for (const seed of seeds) {
      const { expression, substitution = [] } = generate('mono.value', seed)
      const { lines, result } = solveWithValues(expression, substitution)
      for (const step of lines.flatMap((l) => l.steps)) {
        expect(step.result.den).toBeLessThanOrEqual(36n)
        expect(magnitude(step.result.num)).toBeLessThanOrEqual(100n)
      }
      expect(result.den).toBeLessThanOrEqual(12n)
      expect(magnitude(result.num)).toBeLessThanOrEqual(60n)
    }
  })
})
