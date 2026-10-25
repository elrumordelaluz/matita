import { describe, expect, test } from 'vitest'
import type { Expression, Operator } from './expression.ts'
import { generate, type GeneratedSkill } from './generators.ts'
import { isVisible } from './misconceptions.ts'
import { compare, isInteger, rational } from './rational.ts'
import { solve } from './solver.ts'

const seeds = Array.from({ length: 500 }, (_, i) => i * 7919 + 1)

function numbers(e: Expression): bigint[] {
  return e.kind === 'number'
    ? [e.value.num]
    : [...numbers(e.left), ...numbers(e.right)]
}

describe('n.add-sub', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('n.add-sub', 42)).toEqual(generate('n.add-sub', 42))
    expect(generate('n.add-sub', 42)).not.toEqual(generate('n.add-sub', 43))
  })

  test('l’esercizio ricorda abilità, seme e versione del generatore', () => {
    expect(generate('n.add-sub', 42)).toMatchObject({
      skill: 'n.add-sub',
      seed: 42,
      generatorVersion: 1,
    })
  })

  test('da 3 a 5 numeri, ciascuno fino a 50', () => {
    const counts = new Set<number>()
    for (const seed of seeds) {
      const ns = numbers(generate('n.add-sub', seed).expression)
      counts.add(ns.length)
      for (const n of ns) {
        expect(n).toBeGreaterThanOrEqual(0n)
        expect(n).toBeLessThanOrEqual(50n)
      }
    }
    expect([...counts].sort()).toEqual([3, 4, 5])
  })

  test('nessun risultato intermedio esce da N', () => {
    for (const seed of seeds) {
      const { lines } = solve(generate('n.add-sub', seed).expression)
      for (const step of lines.flatMap((l) => l.steps))
        expect(compare(step.result, rational(0n))).toBeGreaterThanOrEqual(0)
    }
  })

  test('usa sia l’addizione sia la sottrazione', () => {
    const ops = new Set(
      seeds.flatMap((seed) =>
        solve(generate('n.add-sub', seed).expression).lines.flatMap((l) =>
          l.steps.map((s) => s.op),
        ),
      ),
    )
    expect(ops).toEqual(new Set(['+', '-']))
  })
})

function steps(skill: GeneratedSkill, seed: number) {
  return solve(generate(skill, seed).expression).lines.flatMap((l) => l.steps)
}

function operators(skill: GeneratedSkill, seed: number): Set<Operator> {
  return new Set(steps(skill, seed).map((s) => s.op))
}

// Vincoli comuni del capitolo: ogni passaggio resta in N, quindi ogni
// divisione è esatta, e i numeri scritti e i fattori vanno fino a 20.
function expectChapterConstraints(skill: GeneratedSkill) {
  for (const seed of seeds) {
    for (const n of numbers(generate(skill, seed).expression)) {
      expect(n).toBeGreaterThanOrEqual(1n)
      expect(n).toBeLessThanOrEqual(20n)
    }
    for (const step of steps(skill, seed)) {
      expect(isInteger(step.result)).toBe(true)
      expect(compare(step.result, rational(0n))).toBeGreaterThanOrEqual(0)
      if (step.op === '×' || step.op === ':')
        expect(compare(step.right, rational(20n))).toBeLessThanOrEqual(0)
    }
  }
}

describe('n.mul-div', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('n.mul-div', 42)).toEqual(generate('n.mul-div', 42))
    expect(generate('n.mul-div', 42)).not.toEqual(generate('n.mul-div', 43))
  })

  test('divisioni esatte, intermedi in N, fattori fino a 20', () => {
    expectChapterConstraints('n.mul-div')
  })

  test('solo × e :, e su molti semi compaiono entrambe', () => {
    const all = new Set<Operator>()
    for (const seed of seeds)
      for (const op of operators('n.mul-div', seed)) all.add(op)
    expect(all).toEqual(new Set(['×', ':']))
  })

  test('da 3 a 4 numeri', () => {
    const counts = new Set(
      seeds.map(
        (seed) => numbers(generate('n.mul-div', seed).expression).length,
      ),
    )
    expect([...counts].sort()).toEqual([3, 4])
  })
})

describe('n.order', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('n.order', 42)).toEqual(generate('n.order', 42))
    expect(generate('n.order', 42)).not.toEqual(generate('n.order', 43))
  })

  test('divisioni esatte, intermedi in N, fattori fino a 20', () => {
    expectChapterConstraints('n.order')
  })

  test('ogni esercizio ha sia × o : sia + o −', () => {
    for (const seed of seeds) {
      const ops = [...operators('n.order', seed)]
      expect(ops.some((op) => op === '×' || op === ':')).toBe(true)
      expect(ops.some((op) => op === '+' || op === '-')).toBe(true)
    }
  })

  test('sommare prima di moltiplicare dà sempre un valore diverso da quello giusto', () => {
    for (const seed of seeds) {
      const { expression } = generate('n.order', seed)
      const { result } = solve(expression)
      expect(isVisible('add-before-mul', expression, result)).toBe(true)
    }
  })

  test('su molti semi compaiono tutte e quattro le operazioni', () => {
    const all = new Set<Operator>()
    for (const seed of seeds)
      for (const op of operators('n.order', seed)) all.add(op)
    expect(all).toEqual(new Set(['+', '-', '×', ':']))
  })
})
