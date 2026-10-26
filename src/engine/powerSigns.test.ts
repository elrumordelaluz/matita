import { describe, expect, test } from 'vitest'
import {
  binary,
  frac,
  group,
  negatedPower,
  num,
  parseExpression,
  power,
  toKatex,
  toText,
} from './expression.ts'
import type { Exercise } from './generators.ts'
import { rational, rationalToText } from './rational.ts'
import { solve } from './solver.ts'
import { verify } from './verify.ts'

// Le potenze con basi negative, con le frazioni, con esponente zero e
// negativo, e il meno davanti alla potenza.

const lines = (source: string) =>
  solve(parseExpression(source)).lines.map((l) => toText(l.expression))

describe('−3² e (−3)² nell’albero', () => {
  test('−3² è il meno davanti alla potenza, (−3)² la potenza di −3', () => {
    expect(parseExpression('−3²')).toEqual(negatedPower(power(num(3n), 2n)))
    expect(parseExpression('(−3)²')).toEqual(power(num(-3n), 2n))
  })

  test('il meno davanti alla potenza vale anche con una parentesi alla base', () => {
    expect(parseExpression('−(5 − 2)²')).toEqual(
      negatedPower(power(group('round', parseExpression('5 − 2')), 2n)),
    )
    expect(parseExpression('−(−2)²')).toEqual(negatedPower(power(num(-2n), 2n)))
  })

  test('senza esponente il meno davanti alla parentesi resta quello di prima', () => {
    expect(parseExpression('−(3 − 7)')).toEqual(
      group('round', parseExpression('3 − 7'), { negated: true }),
    )
  })

  test('in testo: −3² senza parentesi, fra tonde quando non sta all’inizio', () => {
    expect(toText(negatedPower(power(num(3n), 2n)))).toBe('−3²')
    expect(toText(binary('×', num(2n), negatedPower(power(num(3n), 2n))))).toBe(
      '2 × (−3²)',
    )
    expect(toText(binary('×', num(2n), power(num(-3n), 2n)))).toBe('2 × (−3)²')
  })

  test('in KaTeX', () => {
    expect(toKatex(parseExpression('−3² + (−3)²'))).toBe(
      '-{3}^{2} + {(-3)}^{2}',
    )
  })

  test('testo e lettura fanno il giro completo', () => {
    for (const source of [
      '−3² + (−3)²',
      '2 × (−3²) − (−2)³',
      '−(5 − 2)² + 1',
      '−(−2)⁴ : 8',
      '(2/3)² + (−1/2)³',
      '2⁻³ × (3/4)⁻¹',
      '[(1/2 − 2)² − 1/2] : (−1/3)⁰',
    ])
      expect(toText(parseExpression(source))).toBe(source)
  })
})

describe('le frazioni alla base', () => {
  test('(2/3)² è la potenza della frazione, non di un gruppo', () => {
    expect(parseExpression('(2/3)²')).toEqual(power(frac(2n, 3n), 2n))
  })

  test('la frazione alla base va fra parentesi che crescono con lei', () => {
    expect(toKatex(power(frac(2n, 3n), 2n))).toBe(
      '{\\left(\\frac{2}{3}\\right)}^{2}',
    )
    expect(toKatex(power(frac(-1n, 2n), 3n))).toBe(
      '{\\left(-\\frac{1}{2}\\right)}^{3}',
    )
    expect(toText(power(frac(-1n, 2n), 3n))).toBe('(−1/2)³')
  })
})

describe('il risolutore', () => {
  test('−3² fa −9 in un passaggio, con il meno fuori dalla potenza', () => {
    const [line] = solve(parseExpression('−3² + 2')).lines
    expect(line && toText(line.expression)).toBe('−9 + 2')
    expect(line?.steps).toHaveLength(1)
    const [step] = line?.steps ?? []
    expect(step && toText(step.operation)).toBe('−3²')
    expect(step && toText(step.outcome)).toBe('−9')
    // Come nel cambio di segno, −x si legge 0 − x.
    expect(step).toMatchObject({
      rule: 'minus-power',
      left: rational(0n),
      op: '-',
      right: rational(9n),
      result: rational(-9n),
    })
  })

  test('(−3)² fa 9: la base negativa con esponente pari dà un positivo', () => {
    expect(lines('(−3)² + 2')).toEqual(['9 + 2', '11'])
    expect(lines('2 × (−2)³')).toEqual(['2 × (−8)', '−16'])
  })

  test('le potenze nella stessa riga, anche con il meno davanti', () => {
    expect(lines('−3² + 2³')).toEqual(['−9 + 8', '−1'])
  })

  test('con la parentesi alla base, prima la parentesi e poi la potenza', () => {
    expect(lines('−(5 − 2)² + 1')).toEqual(['−3² + 1', '−9 + 1', '−8'])
    expect(lines('(1 − 4)² : 3')).toEqual(['(−3)² : 3', '9 : 3', '3'])
  })

  test('esponente zero: vale 1, anche quando nasce da una proprietà', () => {
    expect(lines('(−7)⁰ + 2')).toEqual(['1 + 2', '3'])
    expect(lines('5³ : 5³ + 2')).toEqual(['5⁰ + 2', '1 + 2', '3'])
  })

  test('esponente negativo: il reciproco', () => {
    expect(lines('2³ : 2⁵')).toEqual(['2⁻²', '1/4'])
    expect(lines('(2/3)⁻² − 1/4')).toEqual(['9/4 − 1/4', '2'])
    expect(lines('(−1/2)⁻³')).toEqual(['−8'])
  })

  test('una proprietà con il meno davanti lascia il meno fuori', () => {
    expect(lines('−(3²)³ : 3⁵')[0]).toBe('−3⁶ : 3⁵')
  })

  test('il risultato è il valore dell’espressione', () => {
    expect(
      rationalToText(
        solve(parseExpression('[(1/2 − 2)² − 1/2] : (−1/3)⁰')).result,
      ),
    ).toBe('7/4')
  })
})

function exercise(source: string): Exercise {
  return {
    skill: 'pow.zero-negative',
    seed: 1,
    generatorVersion: 1,
    expression: parseExpression(source),
  }
}

function misconception(answer: string, source: string) {
  const outcome = verify(answer, exercise(source))
  return outcome.kind === 'misconception' ? outcome.misconception : outcome.kind
}

describe('errori tipici dei segni e degli esponenti', () => {
  test('−3² letto come (−3)²', () => {
    expect(misconception('9', '−3²')).toBe('minus-taken-into-power')
    expect(misconception('11', '−3² + 2')).toBe('minus-taken-into-power')
  })

  test('il meno davanti alla potenza non è una parentesi ignorata', () => {
    expect(misconception('9', '−3²')).not.toBe('ignored-group')
  })

  test('(−2)⁴ con il meno lasciato al risultato', () => {
    expect(misconception('-16', '(−2)⁴')).toBe('negative-base-sign-kept')
  })

  test('a⁰ = 0, scritto o nato da una proprietà', () => {
    expect(misconception('2', '5⁰ + 2')).toBe('zero-exponent-is-zero')
    expect(misconception('2', '5³ : 5³ + 2')).toBe('zero-exponent-is-zero')
  })

  test('a⁻ⁿ = −aⁿ, scritto o nato da una proprietà', () => {
    expect(misconception('-8', '2⁻³')).toBe('negative-exponent-is-negative')
    // 2³ : 2⁵ = 2⁻² letto come −4
    expect(misconception('-4', '2³ : 2⁵')).toBe('negative-exponent-is-negative')
  })

  test('le risposte giuste in Q sono corrette', () => {
    expect(verify('1/4', exercise('2³ : 2⁵'))).toEqual({ kind: 'correct' })
    expect(verify('-8', exercise('(−1/2)⁻³'))).toEqual({ kind: 'correct' })
  })
})
