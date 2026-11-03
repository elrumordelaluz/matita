import { describe, expect, test } from 'vitest'
import {
  hasLetters,
  parseLiteralExpression,
  type LiteralExpression,
  type MonomialNode,
} from './expression.ts'
import { toText } from './expression.ts'
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

describe('mono.add-sub', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('mono.add-sub', 42)).toEqual(generate('mono.add-sub', 42))
  })

  test('una somma di monomi con dei simili, ridotta in una riga', () => {
    for (const seed of seeds) {
      const { lines } = solveLiteral(generate('mono.add-sub', seed).expression)
      expect(lines, `seme ${seed}`).toHaveLength(1)
    }
    expect(rulesOf('mono.add-sub')).toEqual(new Set(['like-terms']))
  })

  test('il coefficiente sottinteso e gli esponenti sommati cambiano sempre il risultato', () => {
    expectVisibleLiteral('mono.add-sub', [
      'implicit-coefficient-zero',
      'like-terms-exponents-added',
    ])
  })

  test('a volte restano monomi non simili', () => {
    expect(
      seeds.some((seed) => {
        const { expression } = generate('mono.add-sub', seed)
        return isVisibleLiteral(
          'unlike-terms-conjoined',
          expression,
          solveLiteral(expression).result,
        )
      }),
    ).toBe(true)
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('mono.add-sub')
  })
})

describe('mono.expressions', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('mono.expressions', 42)).toEqual(
      generate('mono.expressions', 42),
    )
  })

  test('più righe, e alla fine i simili si riducono', () => {
    for (const seed of seeds) {
      const { lines, result } = solveLiteral(
        generate('mono.expressions', seed).expression,
      )
      expect(lines.length, `seme ${seed}`).toBeGreaterThanOrEqual(2)
      expect(lines.at(-1)?.steps[0]?.rule, `seme ${seed}`).toBe('like-terms')
      expect(result.size, `seme ${seed}`).toBeGreaterThan(0)
    }
  })

  test('potenze, prodotti, quozienti e gruppi', () => {
    const rules = rulesOf('mono.expressions')
    for (const rule of [
      'monomial-power',
      'monomial-product',
      'monomial-quotient',
      'like-terms',
    ] as const)
      expect(rules).toContain(rule)
    // Un gruppo con dentro una somma di simili, come (3a − 5a).
    const hasSumGroup = (e: LiteralExpression): boolean => {
      if (e.kind === 'group') return e.inner.kind === 'binary'
      return (
        e.kind === 'binary' && (hasSumGroup(e.left) || hasSumGroup(e.right))
      )
    }
    expect(
      seeds.some((seed) =>
        hasSumGroup(generate('mono.expressions', seed).expression),
      ),
    ).toBe(true)
  })

  test('gli esponenti sommati fra simili cambiano sempre il risultato', () => {
    expectVisibleLiteral('mono.expressions', ['like-terms-exponents-added'])
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('mono.expressions')
  })
})

const stepsOf = (skill: PolynomialSkill, seed: number) =>
  solveLiteral(generate(skill, seed).expression).lines.map((l) =>
    l.steps.map((s) => s.rule),
  )

describe('poly.add-sub', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('poly.add-sub', 42)).toEqual(generate('poly.add-sub', 42))
  })

  test('prima cadono le parentesi, con il meno almeno una volta; poi i simili', () => {
    for (const seed of seeds) {
      const [first, second, ...rest] = stepsOf('poly.add-sub', seed)
      expect(first, `seme ${seed}`).toContain('minus-group')
      expect(
        second?.every((r) => r === 'like-terms'),
        `seme ${seed}`,
      ).toBe(true)
      expect(rest, `seme ${seed}`).toEqual([])
    }
  })

  test('il risultato non è zero e ha al massimo sei termini', () => {
    for (const seed of seeds) {
      const { result } = solveLiteral(generate('poly.add-sub', seed).expression)
      expect(result.size, `seme ${seed}`).toBeGreaterThan(0)
      expect(result.size, `seme ${seed}`).toBeLessThanOrEqual(6)
    }
  })

  test('i segni lasciati dentro la parentesi cambiano sempre il risultato', () => {
    expectVisibleLiteral('poly.add-sub', ['minus-group-signs-kept'])
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('poly.add-sub')
  })
})

describe('poly.mono-times', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('poly.mono-times', 42)).toEqual(
      generate('poly.mono-times', 42),
    )
  })

  test('monomio per polinomio o polinomio diviso monomio, in una riga', () => {
    for (const seed of seeds)
      expect(stepsOf('poly.mono-times', seed), `seme ${seed}`).toHaveLength(1)
    expect(rulesOf('poly.mono-times')).toEqual(
      new Set(['distributive', 'polynomial-quotient']),
    )
  })

  test('la distributiva sul primo termine soltanto cambia sempre il prodotto', () => {
    for (const seed of seeds) {
      const { expression } = generate('poly.mono-times', seed)
      if (expression.kind !== 'binary' || expression.op !== '×') continue
      expect(
        isVisibleLiteral(
          'distributive-first-term-only',
          expression,
          solveLiteral(expression).result,
        ),
        `seme ${seed}`,
      ).toBe(true)
    }
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('poly.mono-times')
  })
})

describe('poly.times', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('poly.times', 42)).toEqual(generate('poly.times', 42))
  })

  test('la distributiva in una riga, la riduzione dei simili nella seconda', () => {
    for (const seed of seeds)
      expect(stepsOf('poly.times', seed), `seme ${seed}`).toEqual([
        ['distributive'],
        expect.arrayContaining(['like-terms']),
      ])
  })

  test('gli esponenti sommati fra simili cambiano sempre il risultato', () => {
    expectVisibleLiteral('poly.times', ['like-terms-exponents-added'])
  })

  test('a volte un binomio per un trinomio', () => {
    const products = seeds.map(
      (seed) =>
        solveLiteral(generate('poly.times', seed).expression).lines[0]?.steps[0]
          ?.products?.length,
    )
    expect(products).toContain(4)
    expect(products).toContain(6)
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('poly.times')
  })
})

// I termini scritti di un binomio fra parentesi: coefficienti interi fino a 5.
function binomialCoefficients(e: LiteralExpression): bigint[] {
  return monomials(e).map((m) => m.coefficient.num)
}

describe('poly.square', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('poly.square', 42)).toEqual(generate('poly.square', 42))
  })

  test('il quadrato di un binomio, con la riga della formula per prima', () => {
    for (const seed of seeds) {
      const { expression } = generate('poly.square', seed)
      expect(stepsOf('poly.square', seed)[0], `seme ${seed}`).toEqual([
        'square-of-binomial',
      ])
      for (const c of binomialCoefficients(expression)) {
        expect(magnitude(c), `seme ${seed}`).toBeLessThanOrEqual(5n)
      }
      expect(solveLiteral(expression).result.size, `seme ${seed}`).toBe(3)
    }
  })

  test('la potenza distribuita sulla somma cambia sempre il risultato', () => {
    expectVisibleLiteral('poly.square', ['power-of-sum'])
  })

  test('a volte il quadrato di una differenza, e lì il segno sbagliato si vede', () => {
    const differences = seeds.filter((seed) => {
      const { expression } = generate('poly.square', seed)
      return isVisibleLiteral(
        'square-of-difference-sign',
        expression,
        solveLiteral(expression).result,
      )
    })
    expect(differences.length).toBeGreaterThan(seeds.length / 4)
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('poly.square')
  })
})

describe('poly.sum-diff', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('poly.sum-diff', 42)).toEqual(generate('poly.sum-diff', 42))
  })

  test('la riga della formula, poi le potenze', () => {
    for (const seed of seeds) {
      const [formula, powers = [], ...rest] = stepsOf('poly.sum-diff', seed)
      expect(formula, `seme ${seed}`).toEqual(['sum-times-difference'])
      // Con (x − y)(x + y) la formula scrive già x² − y².
      expect(
        powers.every((r) => r === 'monomial-power' || r === 'power'),
        `seme ${seed}`,
      ).toBe(true)
      expect(rest, `seme ${seed}`).toEqual([])
      const { expression } = generate('poly.sum-diff', seed)
      for (const c of binomialCoefficients(expression))
        expect(magnitude(c), `seme ${seed}`).toBeLessThanOrEqual(5n)
    }
  })

  test('il più nella somma per differenza cambia sempre il risultato', () => {
    expectVisibleLiteral('poly.sum-diff', ['sum-times-difference-plus'])
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('poly.sum-diff')
  })
})

describe('poly.more-notable', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('poly.more-notable', 42)).toEqual(
      generate('poly.more-notable', 42),
    )
  })

  test('il quadrato di un trinomio o il cubo di un binomio, dalla riga della formula', () => {
    for (const seed of seeds)
      expect(stepsOf('poly.more-notable', seed)[0], `seme ${seed}`).toEqual([
        expect.stringMatching(/^(square-of-trinomial|cube-of-binomial)$/),
      ])
    const rules = rulesOf('poly.more-notable')
    expect(rules).toContain('square-of-trinomial')
    expect(rules).toContain('cube-of-binomial')
  })

  test('al massimo sei termini nel risultato', () => {
    for (const seed of seeds) {
      const { result } = solveLiteral(
        generate('poly.more-notable', seed).expression,
      )
      expect(result.size, `seme ${seed}`).toBeLessThanOrEqual(6)
    }
  })

  test('la potenza distribuita sulla somma cambia sempre il risultato', () => {
    expectVisibleLiteral('poly.more-notable', ['power-of-sum'])
  })

  test('i numeri restano nei limiti: coefficienti fino a 60, anche nei cubi', () => {
    expectLiteralLimits('poly.more-notable')
  })

  // SPEC.md, "Generatori": (2x + 3)³ passa, con 36x² e 54x; (3x + 4)³ no.
  test('(2x + 3)³ resta entro 60, (3x + 4)³ no', () => {
    const largest = (text: string) => {
      const { lines, result } = solveLiteral(parseLiteralExpression(text))
      return [...lines.flatMap((l) => l.steps.map((s) => s.result)), result]
        .flatMap((p) => [...p.values()])
        .map((m) => magnitude(m.coefficient.num))
        .reduce((a, b) => (a > b ? a : b), 0n)
    }
    expect(largest('(2x + 3)³')).toBe(54n)
    expect(largest('(3x + 4)³')).toBeGreaterThan(60n)
  })
})

// Gli errori tipici del capitolo 7 che un'espressione può far vedere,
// guardando come è scritta: una potenza di un polinomio fra parentesi, un
// prodotto per un polinomio, un termine che non è un monomio dopo il meno.
function chapter7Errors(e: LiteralExpression): Set<MisconceptionId> {
  const found = new Set<MisconceptionId>()
  const isPolynomial = (n: LiteralExpression) =>
    n.kind === 'group' && n.inner.kind === 'binary'
  const visit = (n: LiteralExpression, afterMinus: boolean): void => {
    if (afterMinus && n.kind !== 'monomial' && n.kind !== 'number')
      found.add('minus-group-signs-kept')
    if (n.kind === 'group') return visit(n.inner, false)
    if (n.kind !== 'binary') return
    if (n.op === '^' && isPolynomial(n.left)) {
      found.add('power-of-sum')
      if (
        n.left.kind === 'group' &&
        n.left.inner.kind === 'binary' &&
        n.left.inner.op === '-' &&
        n.left.inner.left.kind !== 'binary' &&
        n.right.kind === 'number' &&
        n.right.value.num === 2n
      )
        found.add('square-of-difference-sign')
    }
    if (n.op === '×' && isPolynomial(n.left) && isPolynomial(n.right)) {
      const [l, r] = [toText(n.left), toText(n.right)]
      if (l !== r && (l.replace('+', '−') === r || r.replace('+', '−') === l))
        found.add('sum-times-difference-plus')
    }
    if (n.op === '×' && isPolynomial(n.left) !== isPolynomial(n.right))
      found.add('distributive-first-term-only')
    visit(n.left, false)
    visit(n.right, n.op === '-')
  }
  visit(e, false)
  return found
}

const chapter7Ids: readonly MisconceptionId[] = [
  'minus-group-signs-kept',
  'distributive-first-term-only',
  'power-of-sum',
  'square-of-difference-sign',
  'sum-times-difference-plus',
]

describe('poly.expressions', () => {
  test('stesso seme, stesso esercizio', () => {
    expect(generate('poly.expressions', 42)).toEqual(
      generate('poly.expressions', 42),
    )
  })

  test('più righe, e alla fine i simili si riducono', () => {
    for (const seed of seeds) {
      const { lines, result } = solveLiteral(
        generate('poly.expressions', seed).expression,
      )
      expect(lines.length, `seme ${seed}`).toBeGreaterThanOrEqual(3)
      expect(
        lines.at(-1)?.steps.every((s) => s.rule === 'like-terms'),
        `seme ${seed}`,
      ).toBe(true)
      expect(result.size, `seme ${seed}`).toBeGreaterThan(0)
      expect(result.size, `seme ${seed}`).toBeLessThanOrEqual(6)
    }
  })

  test('ogni errore tipico del capitolo 7 che l’espressione può far vedere cambia il risultato', () => {
    for (const seed of seeds) {
      const { expression } = generate('poly.expressions', seed)
      const { result } = solveLiteral(expression)
      for (const id of chapter7Errors(expression))
        expect(
          isVisibleLiteral(id, expression, result),
          `${id}, seme ${seed}: ${toText(expression)}`,
        ).toBe(true)
    }
  })

  test('tutti gli errori tipici del capitolo 7 compaiono, e a volte un gruppo', () => {
    const exercises = seeds.map((seed) => generate('poly.expressions', seed))
    for (const id of chapter7Ids)
      expect(
        exercises.some((e) => chapter7Errors(e.expression).has(id)),
        id,
      ).toBe(true)
    expect(exercises.some((e) => toText(e.expression).includes('['))).toBe(true)
  })

  test('prodotti notevoli e distributiva insieme', () => {
    const rules = rulesOf('poly.expressions')
    for (const rule of [
      'square-of-binomial',
      'sum-times-difference',
      'distributive',
      'minus-group',
      'like-terms',
    ] as const)
      expect(rules).toContain(rule)
  })

  test('i numeri restano nei limiti del calcolo letterale', () => {
    expectLiteralLimits('poly.expressions')
  })
})
