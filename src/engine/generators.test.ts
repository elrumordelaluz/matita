import { describe, expect, test } from 'vitest'
import type { Expression } from './expression.ts'
import { generate } from './generators.ts'
import { compare, rational } from './rational.ts'
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
