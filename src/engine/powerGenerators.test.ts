import { describe, expect, test } from 'vitest'
import { isNegatedPower, type Expression } from './expression.ts'
import { generate, type GeneratedSkill } from './generators.ts'
import { isVisible } from './misconceptions.ts'
import { numericPower, powerOfPower } from './power.ts'
import { compare, isInteger, rational } from './rational.ts'
import { solve, type Rule } from './solver.ts'

const seeds = Array.from({ length: 500 }, (_, i) => i * 7919 + 1)

// Tutti i nodi dell'albero, per cercare potenze e proprietà.
function nodes(e: Expression): Expression[] {
  if (e.kind === 'number') return [e]
  if (e.kind === 'group') return [e, ...nodes(e.inner)]
  return [e, ...nodes(e.left), ...nodes(e.right)]
}

const steps = (skill: GeneratedSkill, seed: number) =>
  solve(generate(skill, seed).expression).lines.flatMap((l) => l.steps)

const propertyRules: readonly Rule[] = [
  'same-base-product',
  'same-base-quotient',
  'power-of-power',
  'same-exponent-product',
  'same-exponent-quotient',
]

// Vincoli comuni del capitolo, con basi naturali: ogni passaggio resta in N,
// e ogni potenza che si calcola resta nel calcolo mentale.
function expectChapterConstraints(skill: GeneratedSkill) {
  for (const seed of seeds)
    for (const step of steps(skill, seed)) {
      expect(isInteger(step.result)).toBe(true)
      expect(compare(step.result, rational(0n))).toBeGreaterThanOrEqual(0)
      if (step.rule === 'power') {
        expect(compare(step.left, rational(2n))).toBeGreaterThanOrEqual(0)
        expect(compare(step.result, rational(125n))).toBeLessThanOrEqual(0)
      }
    }
}

// In pow.basics le basi possono essere negative: ogni passaggio resta in Z e
// ogni potenza che si calcola resta entro 125 in valore assoluto.
function expectIntegerPowers(skill: GeneratedSkill) {
  for (const seed of seeds)
    for (const step of steps(skill, seed)) {
      expect(isInteger(step.result)).toBe(true)
      if (step.rule === 'power') {
        expect(step.left.num * step.left.num).toBeGreaterThanOrEqual(4n)
        expect(step.result.num * step.result.num).toBeLessThanOrEqual(
          125n * 125n,
        )
      }
    }
}

const powerRules: readonly Rule[] = ['power', 'minus-power']

describe('pow.basics', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('pow.basics', 42)).toEqual(generate('pow.basics', 42))
    expect(generate('pow.basics', 42)).not.toEqual(generate('pow.basics', 43))
  })

  test('l’esercizio ricorda abilità, seme e versione del generatore', () => {
    expect(generate('pow.basics', 42)).toMatchObject({
      skill: 'pow.basics',
      seed: 42,
      generatorVersion: 2,
    })
  })

  test('intermedi interi, potenze fino a 125 in valore assoluto', () => {
    expectIntegerPowers('pow.basics')
  })

  test('ogni esercizio ha almeno una potenza, nessuno una proprietà', () => {
    for (const seed of seeds) {
      const rules = steps('pow.basics', seed).map((s) => s.rule)
      expect(rules.some((r) => powerRules.includes(r))).toBe(true)
      for (const rule of propertyRules) expect(rules).not.toContain(rule)
    }
  })

  test('su molti semi compaiono la base fra parentesi e tutte le operazioni', () => {
    const rules = new Set<Rule>()
    let groupBases = 0
    for (const seed of seeds) {
      for (const s of steps('pow.basics', seed)) rules.add(s.rule)
      const { expression } = generate('pow.basics', seed)
      if (
        nodes(expression).some(
          (n) => n.kind === 'binary' && n.op === '^' && n.left.kind === 'group',
        )
      )
        groupBases++
    }
    expect(rules).toEqual(
      new Set([
        'power',
        'minus-power',
        'mul-div-left-to-right',
        'add-sub-left-to-right',
      ]),
    )
    expect(groupBases).toBeGreaterThan(50)
  })

  // Con l'esponente dispari −2³ e (−2)³ valgono uguale: l'errore si vede solo
  // con l'esponente pari.
  test('su molti semi compaiono −3² e (−3)², e con esponente pari −3² fa vedere il suo errore', () => {
    let minus = 0
    let negativeBases = 0
    for (const seed of seeds) {
      const { expression } = generate('pow.basics', seed)
      const { result } = solve(expression)
      const all = nodes(expression)
      const evenMinus = all.some(
        (n) =>
          n.kind === 'group' &&
          isNegatedPower(n) &&
          n.inner.kind === 'binary' &&
          n.inner.right.kind === 'number' &&
          n.inner.right.value.num % 2n === 0n,
      )
      if (all.some(isNegatedPower)) minus++
      if (evenMinus)
        expect(isVisible('minus-taken-into-power', expression, result)).toBe(
          true,
        )
      if (
        all.some(
          (n) =>
            n.kind === 'binary' &&
            n.op === '^' &&
            n.left.kind === 'number' &&
            n.left.value.num < 0n,
        )
      )
        negativeBases++
    }
    expect(minus).toBeGreaterThan(50)
    expect(negativeBases).toBeGreaterThan(50)
  })

  test('base per esponente dà sempre un valore diverso da quello giusto', () => {
    for (const seed of seeds) {
      const { expression } = generate('pow.basics', seed)
      const { result } = solve(expression)
      expect(isVisible('power-as-product', expression, result)).toBe(true)
    }
  })
})

describe('pow.properties', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('pow.properties', 42)).toEqual(
      generate('pow.properties', 42),
    )
    expect(generate('pow.properties', 42)).not.toEqual(
      generate('pow.properties', 43),
    )
  })

  test('intermedi in N, la potenza da calcolare resta fino a 125', () => {
    expectChapterConstraints('pow.properties')
  })

  test('ogni esercizio applica almeno una proprietà, e su molti semi tutte', () => {
    const seen = new Set<Rule>()
    for (const seed of seeds) {
      const rules = steps('pow.properties', seed).map((s) => s.rule)
      expect(rules.some((r) => propertyRules.includes(r))).toBe(true)
      for (const rule of rules) seen.add(rule)
    }
    for (const rule of propertyRules) expect(seen).toContain(rule)
  })

  test('gli esponenti restano positivi: niente esponente zero o negativo', () => {
    for (const seed of seeds)
      for (const s of steps('pow.properties', seed))
        if (s.outcome.kind === 'binary') {
          const p = numericPower(s.outcome)
          expect(p?.exponent ?? 0n).toBeGreaterThanOrEqual(1n)
        }
  })

  test('la potenza di potenza fa vedere l’errore di sommare gli esponenti', () => {
    let count = 0
    for (const seed of seeds) {
      const { expression } = generate('pow.properties', seed)
      if (!nodes(expression).some((n) => powerOfPower(n))) continue
      count++
      const { result } = solve(expression)
      expect(
        isVisible('power-of-power-adds-exponents', expression, result),
      ).toBe(true)
    }
    expect(count).toBeGreaterThan(50)
  })

  test('base per esponente dà sempre un valore diverso da quello giusto', () => {
    for (const seed of seeds) {
      const { expression } = generate('pow.properties', seed)
      const { result } = solve(expression)
      expect(isVisible('power-as-product', expression, result)).toBe(true)
    }
  })
})

// Le potenze in Q: intermedi con denominatore fino a 36 e numeratore fino a
// 60, risultato con denominatore fino a 12 e numeratore fino a 30.
function expectCleanInQ(skill: GeneratedSkill) {
  for (const seed of seeds) {
    const { expression } = generate(skill, seed)
    const { result, lines } = solve(expression)
    expect(result.den).toBeLessThanOrEqual(12n)
    expect(result.num * result.num).toBeLessThanOrEqual(900n)
    for (const step of lines.flatMap((l) => l.steps)) {
      expect(step.result.den).toBeLessThanOrEqual(36n)
      expect(step.result.num * step.result.num).toBeLessThanOrEqual(3600n)
    }
  }
}

const exponents = (e: Expression) =>
  nodes(e).flatMap((n) => {
    const p = numericPower(n)
    return p ? [p.exponent] : []
  })

describe('pow.zero-negative', () => {
  test('stesso seme, stesso esercizio, versione 1', () => {
    expect(generate('pow.zero-negative', 42)).toEqual(
      generate('pow.zero-negative', 42),
    )
    expect(generate('pow.zero-negative', 42)).toMatchObject({
      skill: 'pow.zero-negative',
      generatorVersion: 1,
    })
  })

  test('numeri da calcolo mentale in Q', () => {
    expectCleanInQ('pow.zero-negative')
  })

  test('ogni esercizio arriva a un esponente zero o negativo', () => {
    for (const seed of seeds) {
      const { expression } = generate('pow.zero-negative', seed)
      const written = [
        expression,
        ...solve(expression).lines.map((l) => l.expression),
      ].flatMap(exponents)
      expect(written.some((n) => n <= 0n)).toBe(true)
    }
  })

  test('ogni esercizio fa vedere l’errore del suo esponente', () => {
    for (const seed of seeds) {
      const { expression } = generate('pow.zero-negative', seed)
      const { result } = solve(expression)
      expect(
        isVisible('zero-exponent-is-zero', expression, result) ||
          isVisible('negative-exponent-is-negative', expression, result),
      ).toBe(true)
    }
  })

  test('su molti semi: esponente zero, negativo, e da una proprietà', () => {
    let zero = 0
    let negative = 0
    let fromProperty = 0
    for (const seed of seeds) {
      const { expression } = generate('pow.zero-negative', seed)
      const written = exponents(expression)
      if (written.includes(0n)) zero++
      if (written.some((n) => n < 0n)) negative++
      const rules = steps('pow.zero-negative', seed).map((s) => s.rule)
      if (rules.some((r) => propertyRules.includes(r))) fromProperty++
    }
    expect(zero).toBeGreaterThan(50)
    expect(negative).toBeGreaterThan(50)
    expect(fromProperty).toBeGreaterThan(50)
  })
})

describe('pow.expressions', () => {
  test('stesso seme, stesso esercizio, versione 1', () => {
    expect(generate('pow.expressions', 42)).toEqual(
      generate('pow.expressions', 42),
    )
    expect(generate('pow.expressions', 42)).toMatchObject({
      skill: 'pow.expressions',
      generatorVersion: 1,
    })
  })

  test('numeri da calcolo mentale in Q', () => {
    expectCleanInQ('pow.expressions')
  })

  test('ogni esercizio ha una potenza di una frazione o con esponente negativo', () => {
    for (const seed of seeds)
      expect(
        steps('pow.expressions', seed).some(
          (s) => s.rule === 'power' && (s.left.den > 1n || s.right.num < 0n),
        ),
      ).toBe(true)
  })

  test('su molti semi compaiono le parentesi, tonde e quadre', () => {
    const brackets = new Set<string>()
    for (const seed of seeds)
      for (const n of nodes(generate('pow.expressions', seed).expression))
        if (n.kind === 'group') brackets.add(n.bracket)
    expect(brackets).toEqual(new Set(['round', 'square']))
  })

  test('base per esponente dà sempre un valore diverso da quello giusto', () => {
    for (const seed of seeds) {
      const { expression } = generate('pow.expressions', seed)
      const { result } = solve(expression)
      expect(isVisible('power-as-product', expression, result)).toBe(true)
    }
  })
})
