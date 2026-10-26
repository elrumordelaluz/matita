import { describe, expect, test } from 'vitest'
import type { Expression } from './expression.ts'
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

describe('pow.basics', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('pow.basics', 42)).toEqual(generate('pow.basics', 42))
    expect(generate('pow.basics', 42)).not.toEqual(generate('pow.basics', 43))
  })

  test('l’esercizio ricorda abilità, seme e versione del generatore', () => {
    expect(generate('pow.basics', 42)).toMatchObject({
      skill: 'pow.basics',
      seed: 42,
      generatorVersion: 1,
    })
  })

  test('intermedi in N, potenze fino a 125 con base da 2 a 10', () => {
    expectChapterConstraints('pow.basics')
  })

  test('ogni esercizio ha almeno una potenza, nessuno una proprietà', () => {
    for (const seed of seeds) {
      const rules = steps('pow.basics', seed).map((s) => s.rule)
      expect(rules).toContain('power')
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
      new Set(['power', 'mul-div-left-to-right', 'add-sub-left-to-right']),
    )
    expect(groupBases).toBeGreaterThan(50)
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
