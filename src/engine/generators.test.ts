import { describe, expect, test } from 'vitest'
import {
  parseExpression,
  toText,
  type Bracket,
  type Expression,
  type Operator,
} from './expression.ts'
import { generate, type GeneratedSkill } from './generators.ts'
import { isVisible, type MisconceptionId } from './misconceptions.ts'
import { compare, isInteger, rational, type Rational } from './rational.ts'
import { solve } from './solver.ts'

const seeds = Array.from({ length: 500 }, (_, i) => i * 7919 + 1)

function numbers(e: Expression): bigint[] {
  if (e.kind === 'number') return [e.value.num]
  if (e.kind === 'group') return numbers(e.inner)
  return [...numbers(e.left), ...numbers(e.right)]
}

interface GroupInfo {
  readonly bracket: Bracket
  /** Quanti livelli di gruppi ha dentro: 0 per un gruppo senza gruppi. */
  readonly height: number
}

function groups(e: Expression): GroupInfo[] {
  if (e.kind === 'number') return []
  if (e.kind === 'binary') return [...groups(e.left), ...groups(e.right)]
  const inner = groups(e.inner)
  const height = Math.max(-1, ...inner.map((g) => g.height)) + 1
  return [{ bracket: e.bracket, height }, ...inner]
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

describe('n.parens', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('n.parens', 42)).toEqual(generate('n.parens', 42))
    expect(generate('n.parens', 42)).not.toEqual(generate('n.parens', 43))
  })

  test('divisioni esatte, intermedi in N, fattori fino a 20', () => {
    expectChapterConstraints('n.parens')
  })

  test('almeno una parentesi, solo tonde, nessuna annidata', () => {
    for (const seed of seeds) {
      const gs = groups(generate('n.parens', seed).expression)
      expect(gs.length).toBeGreaterThan(0)
      for (const g of gs) expect(g).toEqual({ bracket: 'round', height: 0 })
    }
  })

  test('ogni parentesi conta: ignorarla cambia il valore', () => {
    for (const seed of seeds) {
      const { expression } = generate('n.parens', seed)
      const { result } = solve(expression)
      expect(isVisible('ignored-group', expression, result)).toBe(true)
    }
  })
})

describe('n.brackets', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('n.brackets', 42)).toEqual(generate('n.brackets', 42))
    expect(generate('n.brackets', 42)).not.toEqual(generate('n.brackets', 43))
  })

  test('divisioni esatte, intermedi in N, fattori fino a 20', () => {
    expectChapterConstraints('n.brackets')
  })

  test('graffe fuori, quadre in mezzo, tonde dentro', () => {
    const order: Bracket[] = ['round', 'square', 'curly']
    for (const seed of seeds)
      for (const g of groups(generate('n.brackets', seed).expression))
        expect(g.bracket).toBe(order[g.height])
  })

  test('sempre una quadra, e su molti semi anche le graffe', () => {
    const heights = new Set<number>()
    for (const seed of seeds) {
      const gs = groups(generate('n.brackets', seed).expression)
      const height = Math.max(...gs.map((g) => g.height))
      expect(height).toBeGreaterThanOrEqual(1)
      heights.add(height)
    }
    expect([...heights].sort()).toEqual([1, 2])
  })

  test('ogni parentesi conta: ignorarla cambia il valore', () => {
    for (const seed of seeds) {
      const { expression } = generate('n.brackets', seed)
      const { result } = solve(expression)
      expect(isVisible('ignored-group', expression, result)).toBe(true)
    }
  })
})

const zSkills = [
  'z.add-sub',
  'z.mul-div',
  'z.order',
  'z.minus-group',
  'z.brackets',
] as const

// Ogni errore tipico che l'esercizio deve far vedere.
function expectVisible(skill: GeneratedSkill, ids: readonly MisconceptionId[]) {
  for (const seed of seeds) {
    const { expression } = generate(skill, seed)
    const { result } = solve(expression)
    for (const id of ids) expect(isVisible(id, expression, result)).toBe(true)
  }
}

describe.each(zSkills)('%s, vincoli di Z', (skill) => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate(skill, 42)).toEqual(generate(skill, 42))
    expect(generate(skill, 42)).not.toEqual(generate(skill, 43))
  })

  test('ogni risultato intermedio è un intero fino a 100, zero solo alla fine', () => {
    for (const seed of seeds) {
      const all = steps(skill, seed)
      all.forEach(({ result }, i) => {
        expect(isInteger(result)).toBe(true)
        expect(result.num).toBeGreaterThanOrEqual(-100n)
        expect(result.num).toBeLessThanOrEqual(100n)
        if (i < all.length - 1) expect(result.num).not.toBe(0n)
      })
    }
  })

  test('i numeri scritti vanno da −15 a 15, mai zero', () => {
    for (const seed of seeds)
      for (const n of numbers(generate(skill, seed).expression)) {
        expect(n).not.toBe(0n)
        expect(n).toBeGreaterThanOrEqual(-15n)
        expect(n).toBeLessThanOrEqual(15n)
      }
  })

  test('si lavora sempre con un negativo, scritto o intermedio', () => {
    for (const seed of seeds) {
      const { expression } = generate(skill, seed)
      const written = numbers(expression)
      const results = steps(skill, seed).map((s) => s.result.num)
      expect([...written, ...results].some((n) => n < 0n)).toBe(true)
    }
  })

  test('su molti semi i positivi si scrivono con e senza segno', () => {
    const styles = new Set(
      seeds.map((seed) =>
        toText(generate(skill, seed).expression).includes('(+'),
      ),
    )
    expect(styles).toEqual(new Set([true, false]))
  })

  test('parseExpression rilegge l’esercizio scritto', () => {
    for (const seed of seeds) {
      const { expression } = generate(skill, seed)
      expect(parseExpression(toText(expression))).toEqual(expression)
    }
  })
})

describe('z.add-sub', () => {
  test('da 3 a 5 numeri, solo + e −', () => {
    const counts = new Set<number>()
    for (const seed of seeds) {
      counts.add(numbers(generate('z.add-sub', seed).expression).length)
      expect(operators('z.add-sub', seed)).not.toContain('×')
      expect(operators('z.add-sub', seed)).not.toContain(':')
    }
    expect([...counts].sort()).toEqual([3, 4, 5])
  })

  test('due negativi si sommano sempre: la regola dei segni nella somma si vede', () => {
    expectVisible('z.add-sub', ['sign-rule-in-sum'])
  })
})

describe('z.mul-div', () => {
  test('da 3 a 4 fattori, da 2 a 10 in valore assoluto, solo × e :', () => {
    const all = new Set<Operator>()
    for (const seed of seeds) {
      const ns = numbers(generate('z.mul-div', seed).expression)
      expect([3, 4]).toContain(ns.length)
      for (const n of ns) {
        expect(n < 0n ? -n : n).toBeGreaterThanOrEqual(2n)
        expect(n < 0n ? -n : n).toBeLessThanOrEqual(10n)
      }
      for (const op of operators('z.mul-div', seed)) all.add(op)
    }
    expect(all).toEqual(new Set(['×', ':']))
  })

  test('meno per meno compare sempre', () => {
    for (const seed of seeds)
      expect(
        steps('z.mul-div', seed).some(
          (s) => s.left.num < 0n && s.right.num < 0n,
        ),
      ).toBe(true)
  })

  test('su molti semi il risultato è sia positivo sia negativo', () => {
    const signs = new Set(
      seeds.map(
        (seed) => solve(generate('z.mul-div', seed).expression).result.num > 0n,
      ),
    )
    expect(signs).toEqual(new Set([true, false]))
  })
})

describe('z.order', () => {
  test('ogni esercizio ha sia × o : sia + o −', () => {
    for (const seed of seeds) {
      const ops = [...operators('z.order', seed)]
      expect(ops.some((op) => op === '×' || op === ':')).toBe(true)
      expect(ops.some((op) => op === '+' || op === '-')).toBe(true)
    }
  })

  test('sommare prima di moltiplicare dà sempre un valore diverso', () => {
    expectVisible('z.order', ['add-before-mul'])
  })
})

describe('z.minus-group', () => {
  test('solo tonde, nessuna annidata', () => {
    for (const seed of seeds) {
      const gs = groups(generate('z.minus-group', seed).expression)
      expect(gs.length).toBeGreaterThan(0)
      for (const g of gs) expect(g).toEqual({ bracket: 'round', height: 0 })
    }
  })

  test('c’è sempre un gruppo preceduto dal meno, e il meno conta', () => {
    expectVisible('z.minus-group', [
      'minus-group-signs-kept',
      'minus-sign-dropped',
    ])
  })

  test('su molti semi il meno sta anche all’inizio, davanti al gruppo', () => {
    expect(
      seeds.some((seed) =>
        toText(generate('z.minus-group', seed).expression).startsWith('−('),
      ),
    ).toBe(true)
  })
})

describe('z.brackets', () => {
  test('graffe fuori, quadre in mezzo, tonde dentro', () => {
    const order: Bracket[] = ['round', 'square', 'curly']
    const heights = new Set<number>()
    for (const seed of seeds) {
      const gs = groups(generate('z.brackets', seed).expression)
      for (const g of gs) expect(g.bracket).toBe(order[g.height])
      heights.add(Math.max(...gs.map((g) => g.height)))
    }
    expect([...heights].sort()).toEqual([1, 2])
  })

  test('al massimo sette numeri', () => {
    for (const seed of seeds)
      expect(
        numbers(generate('z.brackets', seed).expression).length,
      ).toBeLessThanOrEqual(7)
  })

  test('ogni parentesi conta, e il meno davanti a una parentesi anche', () => {
    expectVisible('z.brackets', ['ignored-group', 'minus-group-signs-kept'])
  })
})

const qSkills = ['q.add-sub', 'q.mul-div', 'q.order', 'q.brackets'] as const

function written(e: Expression): Rational[] {
  if (e.kind === 'number') return [e.value]
  if (e.kind === 'group') return written(e.inner)
  return [...written(e.left), ...written(e.right)]
}

const magnitude = (n: bigint) => (n < 0n ? -n : n)

describe.each(qSkills)('%s, vincoli di Q', (skill) => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate(skill, 42)).toEqual(generate(skill, 42))
    expect(generate(skill, 42)).not.toEqual(generate(skill, 43))
  })

  test('denominatori scritti fino a 12, numeratori sotto il doppio, interi fino a 5', () => {
    for (const seed of seeds)
      for (const r of written(generate(skill, seed).expression)) {
        expect(r.num).not.toBe(0n)
        expect(r.den).toBeLessThanOrEqual(12n)
        if (isInteger(r)) expect(magnitude(r.num)).toBeLessThanOrEqual(5n)
        else expect(magnitude(r.num)).toBeLessThan(2n * r.den)
      }
  })

  test('intermedi da calcolo mentale, risultato pulito', () => {
    for (const seed of seeds) {
      const { result } = solve(generate(skill, seed).expression)
      expect(result.den).toBeLessThanOrEqual(12n)
      expect(magnitude(result.num)).toBeLessThanOrEqual(30n)
      const all = steps(skill, seed)
      all.forEach((s, i) => {
        expect(s.result.den).toBeLessThanOrEqual(36n)
        expect(magnitude(s.result.num)).toBeLessThanOrEqual(60n)
        if (i < all.length - 1) expect(s.result.num).not.toBe(0n)
      })
    }
  })

  test('si lavora sempre con le frazioni', () => {
    for (const seed of seeds)
      expect(
        steps(skill, seed).some(
          (s) => !isInteger(s.left) || !isInteger(s.right),
        ),
      ).toBe(true)
  })

  test('parseExpression rilegge l’esercizio scritto', () => {
    for (const seed of seeds) {
      const { expression } = generate(skill, seed)
      expect(parseExpression(toText(expression))).toEqual(expression)
    }
  })
})

describe('q.add-sub', () => {
  test('da 3 a 4 termini, solo + e −, il minimo comune multiplo fino a 24', () => {
    for (const seed of seeds) {
      expect([3, 4]).toContain(
        written(generate('q.add-sub', seed).expression).length,
      )
      for (const s of steps('q.add-sub', seed)) {
        expect(['+', '-']).toContain(s.op)
        const lcm = (s.left.den * s.right.den) / gcd(s.left.den, s.right.den)
        expect(lcm).toBeLessThanOrEqual(24n)
      }
    }
  })

  test('sommare numeratori e denominatori dà sempre un valore diverso', () => {
    expectVisible('q.add-sub', ['added-numerators-denominators'])
  })
})

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b]
  return magnitude(a)
}

describe('q.mul-div', () => {
  test('da 2 a 3 frazioni, solo × e :, e su molti semi tutte e due', () => {
    const all = new Set<Operator>()
    for (const seed of seeds) {
      expect([2, 3]).toContain(
        written(generate('q.mul-div', seed).expression).length,
      )
      for (const op of operators('q.mul-div', seed)) all.add(op)
    }
    expect(all).toEqual(new Set(['×', ':']))
  })

  test('c’è sempre da semplificare in croce', () => {
    for (const seed of seeds)
      expect(
        steps('q.mul-div', seed).some(({ op, left, right }) =>
          op === '×'
            ? gcd(left.num, right.den) > 1n || gcd(right.num, left.den) > 1n
            : gcd(left.num, right.num) > 1n || gcd(left.den, right.den) > 1n,
        ),
      ).toBe(true)
  })

  test('con una divisione, moltiplicare senza reciproco si vede', () => {
    for (const seed of seeds) {
      const { expression } = generate('q.mul-div', seed)
      if (!operators('q.mul-div', seed).has(':')) continue
      const { result } = solve(expression)
      expect(isVisible('divided-without-reciprocal', expression, result)).toBe(
        true,
      )
    }
  })
})

describe('q.order', () => {
  test('ogni esercizio ha sia × o : sia + o −', () => {
    for (const seed of seeds) {
      const ops = [...operators('q.order', seed)]
      expect(ops.some((op) => op === '×' || op === ':')).toBe(true)
      expect(ops.some((op) => op === '+' || op === '-')).toBe(true)
    }
  })

  test('sommare prima di moltiplicare dà sempre un valore diverso', () => {
    expectVisible('q.order', ['add-before-mul'])
  })
})

describe('q.brackets', () => {
  test('tonde, e su molti semi quadre che le contengono', () => {
    const order: Bracket[] = ['round', 'square', 'curly']
    const heights = new Set<number>()
    for (const seed of seeds) {
      const gs = groups(generate('q.brackets', seed).expression)
      expect(gs.length).toBeGreaterThan(0)
      for (const g of gs) expect(g.bracket).toBe(order[g.height])
      heights.add(Math.max(...gs.map((g) => g.height)))
    }
    expect([...heights].sort()).toEqual([0, 1])
  })

  test('al massimo sei numeri', () => {
    for (const seed of seeds)
      expect(
        written(generate('q.brackets', seed).expression).length,
      ).toBeLessThanOrEqual(6)
  })

  test('ogni parentesi conta', () => {
    expectVisible('q.brackets', ['ignored-group'])
  })
})
