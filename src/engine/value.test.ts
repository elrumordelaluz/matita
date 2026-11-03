import { describe, expect, test } from 'vitest'
import { parseLiteralExpression, toText } from './expression.ts'
import { recognise } from './misconceptions.ts'
import { rational, rationalToText, type Rational } from './rational.ts'
import { solveWithValues, substitute, type Assignment } from './value.ts'

// Il valore numerico di un'espressione letterale: la riga della
// sostituzione, poi il risolutore dei numeri. SPEC.md, "Calcolo letterale",
// "Risolutore". Esempi da Bergamini, cap. 6, e dalla SPEC.

const values = (...pairs: [string, Rational][]): Assignment[] =>
  pairs.map(([letter, value]) => ({ letter, value }))

function lines(text: string, substitution: Assignment[]) {
  return solveWithValues(parseLiteralExpression(text), substitution).lines.map(
    (l) => toText(l.expression),
  )
}

describe('la riga della sostituzione', () => {
  test('mette il valore negativo fra tonde: 2a² + 3a per a = −2', () => {
    expect(lines('2a² + 3a', values(['a', rational(-2n)]))).toEqual([
      '2 × (−2)² + 3 × (−2)',
      '2 × 4 + 3 × (−2)',
      '8 + (−6)',
      '2',
    ])
  })

  test('il suo passaggio porta la lettera e il valore, senza conto', () => {
    const [line] = solveWithValues(
      parseLiteralExpression('2a² + 3a'),
      values(['a', rational(-2n)]),
    ).lines
    expect(line?.steps).toHaveLength(1)
    const [step] = line?.steps ?? []
    expect(step?.rule).toBe('substitution')
    expect(step?.letter).toBe('a')
    expect(step && rationalToText(step.result)).toBe('-2')
    expect(step?.operands).toEqual([])
    expect(step && `${toText(step.operation)} = ${toText(step.outcome)}`).toBe(
      'a = −2',
    )
  })

  test('un passaggio per lettera, nell’ordine dei valori', () => {
    const [line] = solveWithValues(
      parseLiteralExpression('3a²b − ab²'),
      values(['a', rational(-1n)], ['b', rational(2n)]),
    ).lines
    expect(line?.steps.map((s) => s.letter)).toEqual(['a', 'b'])
    expect(line && toText(line.expression)).toBe('3 × (−1)² × 2 − (−1) × 2²')
  })

  test('il coefficiente −1 sottinteso resta come meno davanti', () => {
    expect(lines('−a² + a', values(['a', rational(-3n)]))[0]).toBe(
      '−(−3)² + (−3)',
    )
    expect(lines('−a + 5', values(['a', rational(-3n)]))[0]).toBe('−(−3) + 5')
    expect(lines('−a + 5', values(['a', rational(3n)]))[0]).toBe('−3 + 5')
  })

  test('una frazione alla base va fra tonde', () => {
    expect(lines('4a²', values(['a', rational(1n, 2n)]))).toEqual([
      '4 × (1/2)²',
      '4 × 1/4',
      '1',
    ])
  })
})

describe('il valore numerico', () => {
  // Bergamini: P(x) = 2x² + 3x + 1 in −2, 3, −1 vale 3, 28, 0.
  test.each([
    [-2n, '3'],
    [3n, '28'],
    [-1n, '0'],
  ])('2x² + 3x + 1 per x = %s vale %s', (x, expected) => {
    const solution = solveWithValues(
      parseLiteralExpression('2x² + 3x + 1'),
      values(['x', rational(x)]),
    )
    expect(rationalToText(solution.result)).toBe(expected)
  })

  test('3a²b − ab² per a = −1, b = 2 vale 10', () => {
    const solution = solveWithValues(
      parseLiteralExpression('3a²b − ab²'),
      values(['a', rational(-1n)], ['b', rational(2n)]),
    )
    expect(rationalToText(solution.result)).toBe('10')
  })

  test('una lettera senza valore non si sostituisce', () => {
    expect(() =>
      substitute(parseLiteralExpression('2a + b'), values(['a', rational(1n)])),
    ).toThrow()
  })
})

describe('l’errore tipico: il negativo sostituito senza tonde', () => {
  const recognised = (text: string, a: bigint, answer: bigint) => {
    const e = substitute(
      parseLiteralExpression(text),
      values(['a', rational(a)]),
    )
    const { result } = solveWithValues(
      parseLiteralExpression(text),
      values(['a', rational(a)]),
    )
    return recognise(rational(answer), e, result)?.id
  }

  test('a = −2, a² = −4', () => {
    expect(recognised('a²', -2n, -4n)).toBe(
      'negative-substituted-without-brackets',
    )
  })

  test('2a² + 3a per a = −2 letto come 2 × (−2²) − 6', () => {
    expect(recognised('2a² + 3a', -2n, -14n)).toBe(
      'negative-substituted-without-brackets',
    )
  })

  test('nelle potenze di numeri, senza sostituzione, resta l’errore del segno', () => {
    // (−2)⁴ = −16 non viene da una lettera.
    const e = substitute(parseLiteralExpression('(−2)⁴'), [])
    expect(recognise(rational(-16n), e, rational(16n))?.id).toBe(
      'negative-base-sign-kept',
    )
  })
})
