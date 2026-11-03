import { describe, expect, test } from 'vitest'
import {
  hasLetters,
  type LiteralExpression,
  type MonomialNode,
} from './expression.ts'
import { generate, type PolynomialSkill } from './generators.ts'
import { isVisibleLiteral } from './literalMisconceptions.ts'
import { solveLiteral } from './literalSolver.ts'
import { isVisible, type MisconceptionId } from './misconceptions.ts'
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

// I monomi di un'espressione, per controllare coefficienti ed esponenti scritti.
function monomials(e: LiteralExpression): MonomialNode[] {
  if (e.kind === 'monomial') return [e]
  if (e.kind === 'number') return []
  if (e.kind === 'group') return monomials(e.inner)
  return [...monomials(e.left), ...monomials(e.right)]
}

function expectLiteralLimits(skill: PolynomialSkill) {
  for (const seed of seeds) {
    const { expression } = generate(skill, seed)
    expect(letters(expression).size, `seme ${seed}`).toBeLessThanOrEqual(3)
    for (const m of monomials(expression)) {
      expect(m.coefficient.den).toBeLessThanOrEqual(12n)
      for (const l of m.letters) expect(l.exponent).toBeLessThanOrEqual(5n)
    }
    const { lines, result } = solveLiteral(expression)
    const values = [
      ...lines.flatMap((l) => l.steps.map((s) => s.result)),
      result,
    ].flatMap((p) => [...p.values()])
    for (const m of values) {
      expect(m.coefficient.den, `seme ${seed}`).toBeLessThanOrEqual(36n)
      expect(magnitude(m.coefficient.num), `seme ${seed}`).toBeLessThanOrEqual(
        60n,
      )
      for (const n of m.letters.values()) expect(n).toBeLessThanOrEqual(12n)
    }
  }
}

describe('mono.normal-form', () => {
  test('stesso seme, stesso esercizio, con la risposta polinomio', () => {
    expect(generate('mono.normal-form', 42)).toEqual(
      generate('mono.normal-form', 42),
    )
    expect(generate('mono.normal-form', 42).kind).toBe('polynomial')
  })

  test('il monomio resta com’è scritto, e non è già in forma normale', () => {
    for (const seed of seeds) {
      const { expression } = generate('mono.normal-form', seed)
      const { lines } = solveLiteral(expression)
      expect(lines, `seme ${seed}`).toHaveLength(1)
      // Il risultato è un monomio solo.
      expect(solveLiteral(expression).result.size).toBe(1)
    }
  })

  test('a volte una lettera ripetuta in un monomio, a volte un prodotto', () => {
    const rules = new Set(
      seeds.flatMap((seed) =>
        solveLiteral(
          generate('mono.normal-form', seed).expression,
        ).lines.flatMap((l) => l.steps.map((s) => s.rule)),
      ),
    )
    expect(rules).toEqual(new Set(['normal-form', 'monomial-product']))
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('mono.normal-form')
  })
})

function expectVisibleLiteral(
  skill: PolynomialSkill,
  ids: readonly MisconceptionId[],
) {
  for (const seed of seeds) {
    const { expression } = generate(skill, seed)
    const { result } = solveLiteral(expression)
    for (const id of ids)
      expect(
        isVisibleLiteral(id, expression, result),
        `${id}, seme ${seed}`,
      ).toBe(true)
  }
}

const rulesOf = (skill: PolynomialSkill) =>
  new Set(
    seeds.flatMap((seed) =>
      solveLiteral(generate(skill, seed).expression).lines.flatMap((l) =>
        l.steps.map((s) => s.rule),
      ),
    ),
  )

describe('mono.mul-div', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('mono.mul-div', 42)).toEqual(generate('mono.mul-div', 42))
  })

  test('prodotti e quozienti, sempre possibili, in una riga', () => {
    for (const seed of seeds) {
      const { lines } = solveLiteral(generate('mono.mul-div', seed).expression)
      expect(lines, `seme ${seed}`).toHaveLength(1)
    }
    expect(rulesOf('mono.mul-div')).toEqual(
      new Set(['monomial-product', 'monomial-quotient']),
    )
  })

  test('gli esponenti moltiplicati cambiano sempre il risultato', () => {
    expectVisibleLiteral('mono.mul-div', ['same-base-multiplies-exponents'])
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('mono.mul-div')
  })
})

describe('mono.power', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('mono.power', 42)).toEqual(generate('mono.power', 42))
  })

  test('il coefficiente non elevato e gli esponenti sommati cambiano sempre il risultato', () => {
    expectVisibleLiteral('mono.power', [
      'coefficient-not-raised',
      'power-of-power-adds-exponents',
    ])
  })

  test('a volte il segno della base negativa, a volte il meno davanti', () => {
    const exercises = seeds.map((seed) => generate('mono.power', seed))
    expect(
      exercises.some((e) =>
        isVisibleLiteral(
          'negative-base-sign-kept',
          e.expression,
          solveLiteral(e.expression).result,
        ),
      ),
    ).toBe(true)
    expect(
      exercises.some(
        (e) => e.expression.kind === 'group' && e.expression.negated,
      ),
    ).toBe(true)
  })

  test('la potenza è un passaggio solo', () => {
    expect(rulesOf('mono.power')).toContain('monomial-power')
    expect(rulesOf('mono.power')).not.toContain('power-of-power')
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('mono.power')
  })
})
