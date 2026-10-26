import { describe, expect, test } from 'vitest'
import {
  group,
  num,
  parseExpression,
  power,
  toKatex,
  toText,
} from './expression.ts'
import type { Exercise } from './generators.ts'
import { isVisible, type MisconceptionId } from './misconceptions.ts'
import { raise } from './power.ts'
import { rational, rationalToText } from './rational.ts'
import { solve, type Solution } from './solver.ts'
import { verify } from './verify.ts'

function describeSolution(solution: Solution) {
  return solution.lines.map((line) => ({
    line: toText(line.expression),
    steps: line.steps.map(
      (s) =>
        `${toText(s.operation)} = ${toText(s.outcome)} (${s.rule}) → ${toText(s.expression)}`,
    ),
  }))
}

const lines = (source: string) =>
  solve(parseExpression(source)).lines.map((l) => toText(l.expression))

describe('la potenza nell’albero', () => {
  test('power costruisce un nodo ^ con l’esponente a destra', () => {
    expect(power(num(2n), 3n)).toEqual({
      kind: 'binary',
      op: '^',
      left: { kind: 'number', value: rational(2n) },
      right: { kind: 'number', value: rational(3n) },
    })
  })

  test('si legge con le cifre ad apice o con ^', () => {
    expect(parseExpression('2³')).toEqual(power(num(2n), 3n))
    expect(parseExpression('2^3')).toEqual(power(num(2n), 3n))
    expect(parseExpression('2¹⁰')).toEqual(power(num(2n), 10n))
  })

  test('la potenza lega più di × e :', () => {
    expect(parseExpression('3 × 2³')).toEqual(parseExpression('3 × 2^3'))
    expect(toText(parseExpression('2+3*4^2'))).toBe('2 + 3 × 4²')
  })

  test('la base può essere una parentesi', () => {
    expect(parseExpression('(2 + 1)²')).toEqual(
      power(group('round', parseExpression('2 + 1')), 2n),
    )
  })

  test('una potenza di potenza ha la base fra parentesi', () => {
    expect(parseExpression('(3²)³')).toEqual(
      power(group('round', power(num(3n), 2n)), 3n),
    )
    expect(() => parseExpression('2^3^2')).toThrow()
  })

  test('l’esponente negativo si legge e si scrive', () => {
    expect(parseExpression('10^-2')).toEqual(power(num(10n), -2n))
    expect(toText(power(num(10n), -2n))).toBe('10⁻²')
    expect(parseExpression('10⁻²')).toEqual(power(num(10n), -2n))
    expect(toKatex(power(num(10n), -2n))).toBe('{10}^{-2}')
  })

  test('in testo semplice con le cifre ad apice', () => {
    expect(toText(parseExpression('2^5 * 2^3 : 2^6'))).toBe('2⁵ × 2³ : 2⁶')
    expect(toText(parseExpression('(2+1)^2'))).toBe('(2 + 1)²')
  })

  test('in KaTeX con l’apice sopra tutta la base', () => {
    expect(toKatex(parseExpression('3 × 2³'))).toBe('3 \\times {2}^{3}')
    expect(toKatex(parseExpression('[(3²)³ − 2] : 7'))).toBe(
      '[{({3}^{2})}^{3} - 2] \\mathbin{:} 7',
    )
  })

  test('testo e lettura fanno il giro completo', () => {
    for (const source of [
      '2⁵ × 2³ : 2⁶',
      '(3²)³ : 3⁴',
      '6³ : 2³',
      '{[(5 − 2)² + 1] × 2}³ − 10²',
    ])
      expect(toText(parseExpression(source))).toBe(source)
  })
})

describe('raise', () => {
  test('la potenza è un prodotto di fattori uguali', () => {
    expect(raise(rational(2n), 3n)).toEqual(rational(8n))
    expect(raise(rational(10n), 2n)).toEqual(rational(100n))
  })

  test('con esponente uno resta la base, con esponente zero fa uno', () => {
    expect(raise(rational(7n), 1n)).toEqual(rational(7n))
    expect(raise(rational(7n), 0n)).toEqual(rational(1n))
  })

  test('con esponente negativo dà il reciproco', () => {
    expect(raise(rational(2n), -3n)).toEqual(rational(1n, 8n))
    expect(raise(rational(2n, 3n), -2n)).toEqual(rational(9n, 4n))
  })

  test('0⁰ non ha significato', () => {
    expect(() => raise(rational(0n), 0n)).toThrow(RangeError)
  })
})

describe('il risolutore con le potenze', () => {
  test('prima le potenze, poi × e :, poi + e −', () => {
    expect(describeSolution(solve(parseExpression('2³ + 3² × 2')))).toEqual([
      {
        line: '8 + 9 × 2',
        steps: ['2³ = 8 (power) → 8 + 3² × 2', '3² = 9 (power) → 8 + 9 × 2'],
      },
      {
        line: '8 + 18',
        steps: ['9 × 2 = 18 (mul-div-left-to-right) → 8 + 18'],
      },
      { line: '26', steps: ['8 + 18 = 26 (add-sub-left-to-right) → 26'] },
    ])
  })

  test('un passaggio di potenza dichiara base, esponente e risultato', () => {
    const [step] = solve(parseExpression('5²')).lines.flatMap((l) => l.steps)
    expect(step).toMatchObject({
      rule: 'power',
      left: rational(5n),
      op: '^',
      right: rational(2n),
      result: rational(25n),
    })
  })

  test('la parentesi alla base si svolge prima e poi cade', () => {
    expect(lines('(5 − 2)² + 4')).toEqual(['3² + 4', '9 + 4', '13'])
  })

  test('dentro una parentesi, prima le potenze', () => {
    expect(lines('[2 × 3² − 4] : 7')).toEqual([
      '[2 × 9 − 4] : 7',
      '[18 − 4] : 7',
      '14 : 7',
      '2',
    ])
  })

  test('prodotto e quoziente con la stessa base: una riga di proprietà', () => {
    expect(describeSolution(solve(parseExpression('2⁵ × 2³ : 2⁶')))).toEqual([
      {
        line: '2²',
        steps: [
          '2⁵ × 2³ = 2⁸ (same-base-product) → 2⁸ : 2⁶',
          '2⁸ : 2⁶ = 2² (same-base-quotient) → 2²',
        ],
      },
      { line: '4', steps: ['2² = 4 (power) → 4'] },
    ])
  })

  test('la potenza di potenza moltiplica gli esponenti', () => {
    expect(describeSolution(solve(parseExpression('(3²)³ : 3⁴')))).toEqual([
      {
        line: '3²',
        steps: [
          '(3²)³ = 3⁶ (power-of-power) → 3⁶ : 3⁴',
          '3⁶ : 3⁴ = 3² (same-base-quotient) → 3²',
        ],
      },
      { line: '9', steps: ['3² = 9 (power) → 9'] },
    ])
  })

  test('lo stesso esponente: si moltiplicano o si dividono le basi', () => {
    expect(describeSolution(solve(parseExpression('6³ : 2³')))).toEqual([
      {
        line: '3³',
        steps: ['6³ : 2³ = 3³ (same-exponent-quotient) → 3³'],
      },
      { line: '27', steps: ['3³ = 27 (power) → 27'] },
    ])
    expect(lines('2² × 5²')).toEqual(['10²', '100'])
  })

  test('una proprietà porta anche i valori delle potenze', () => {
    const [step] = solve(parseExpression('6³ : 2³')).lines.flatMap(
      (l) => l.steps,
    )
    expect(step).toMatchObject({
      left: rational(216n),
      op: ':',
      right: rational(8n),
      result: rational(27n),
    })
  })

  test('con la stessa base e lo stesso esponente vince la stessa base', () => {
    expect(lines('2³ × 2³')).toEqual(['2⁶', '64'])
  })

  test('le proprietà valgono solo fra potenze vicine', () => {
    expect(lines('2³ × 3 × 2²')).toEqual(['8 × 3 × 4', '96'])
    expect(lines('2³ + 2²')).toEqual(['8 + 4', '12'])
  })

  test('la potenza di potenza dentro una quadra non è un gruppo da svolgere', () => {
    expect(lines('[(2³)² : 2⁴ + 1] × 3')).toEqual([
      '[2² + 1] × 3',
      '[4 + 1] × 3',
      '5 × 3',
      '15',
    ])
  })

  test('il risultato è il valore dell’espressione', () => {
    expect(
      rationalToText(solve(parseExpression('(2³)² : 2⁴ + 6³ : 2³')).result),
    ).toBe('31')
  })
})

function exercise(source: string): Exercise {
  return {
    skill: 'pow.basics',
    seed: 1,
    generatorVersion: 1,
    expression: parseExpression(source),
  }
}

function misconception(answer: string, source: string) {
  const outcome = verify(answer, exercise(source))
  return outcome.kind === 'misconception' ? outcome.misconception : outcome.kind
}

const visible = (id: MisconceptionId, source: string) => {
  const e = parseExpression(source)
  return isVisible(id, e, solve(e).result)
}

describe('errori tipici delle potenze', () => {
  test('base per esponente: 2³ = 6', () => {
    expect(misconception('6', '2³')).toBe('power-as-product')
    expect(misconception('18', '2³ + 3² × 2')).toBe('power-as-product')
  })

  test('2² dà 4 anche moltiplicando base ed esponente: l’errore non si vede', () => {
    expect(visible('power-as-product', '2²')).toBe(false)
    expect(visible('power-as-product', '2² + 3²')).toBe(true)
  })

  test('nella potenza di potenza gli esponenti sommati', () => {
    // (3²)³ : 3⁴ letto come 3⁵ : 3⁴ = 3
    expect(misconception('3', '(3²)³ : 3⁴')).toBe(
      'power-of-power-adds-exponents',
    )
    expect(visible('power-of-power-adds-exponents', '(2²)²')).toBe(false)
  })

  test('nel prodotto con la stessa base gli esponenti moltiplicati', () => {
    // 2³ × 2² letto come 2⁶ = 64
    expect(misconception('64', '2³ × 2²')).toBe(
      'same-base-multiplies-exponents',
    )
    // 2⁵ × 2³ : 2⁶ letto come 2¹⁵ : 2⁶ = 2⁹
    expect(misconception('512', '2⁵ × 2³ : 2⁶')).toBe(
      'same-base-multiplies-exponents',
    )
  })

  test('nel quoziente con la stessa base gli esponenti divisi', () => {
    // 3⁶ : 3³ letto come 3² = 9
    expect(misconception('9', '3⁶ : 3³')).toBe('same-base-multiplies-exponents')
  })

  test('la potenza distribuita sulla somma', () => {
    // (2 + 3)² letto come 2² + 3² = 13
    expect(misconception('13', '(2 + 3)²')).toBe('power-of-sum')
    // (5 − 2)² + 4 × 2 letto come 5² − 2² + 8 = 29
    expect(misconception('29', '(5 − 2)² + 4 × 2')).toBe('power-of-sum')
  })

  test('ignorare la parentesi alla base resta un errore tipico', () => {
    // (5 − 2)² letto come 5 − 2² = 1
    expect(misconception('1', '(5 − 2)²')).toBe('ignored-group')
  })

  test('il valore giusto è corretto, qualunque strada si prenda', () => {
    expect(verify('9', exercise('(3²)³ : 3⁴'))).toEqual({ kind: 'correct' })
  })
})
