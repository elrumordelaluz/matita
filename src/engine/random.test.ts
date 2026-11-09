import { describe, expect, test } from 'vitest'
import { seededRandom } from './random.ts'

describe('seededRandom', () => {
  test('lo stesso seme dà la stessa sequenza', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    const draw = (r: ReturnType<typeof seededRandom>) =>
      Array.from({ length: 5 }, () => r.int(1n, 90n))
    expect(draw(a)).toEqual(draw(b))
  })

  test('un intero sta fra gli estremi, inclusi', () => {
    const random = seededRandom(7)
    const seen = new Set<bigint>()
    for (let i = 0; i < 200; i++) {
      const n = random.int(2n, 4n)
      expect(n >= 2n && n <= 4n).toBe(true)
      seen.add(n)
    }
    expect([...seen].sort()).toEqual([2n, 3n, 4n])
  })

  test('un intervallo di un solo numero dà quel numero', () => {
    expect(seededRandom(1).int(5n, 5n)).toBe(5n)
  })

  test('rifiuta un intervallo vuoto, come pick rifiuta una lista vuota', () => {
    expect(() => seededRandom(1).int(3n, 2n)).toThrow(RangeError)
    expect(() => seededRandom(1).pick([])).toThrow(RangeError)
  })
})
