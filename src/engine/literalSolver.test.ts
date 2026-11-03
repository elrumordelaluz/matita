import { describe, expect, test } from 'vitest'
import { parseLiteralExpression, toText } from './expression.ts'
import { solveLiteral, type LiteralSolution } from './literalSolver.ts'
import { polynomialExpression } from './polynomial.ts'

// Il risolutore del calcolo letterale: SPEC.md, "Calcolo letterale",
// "Risolutore". Gli esempi vengono da Bergamini, cap. 6.

const solved = (text: string) => solveLiteral(parseLiteralExpression(text))

function rows(solution: LiteralSolution) {
  return solution.lines.map((line) => ({
    line: toText(line.expression),
    steps: line.steps.map(
      (s) => `${toText(s.operation)} = ${toText(s.outcome)} (${s.rule})`,
    ),
  }))
}

const result = (text: string) =>
  toText(polynomialExpression(solved(text).result))

describe('la forma normale', () => {
  test('2ab² · 3b³a² = 6a³b⁵, un passaggio solo', () => {
    expect(rows(solved('2ab² · 3b³a²'))).toEqual([
      {
        line: '6a³b⁵',
        steps: ['2ab² · 3b³a² = 6a³b⁵ (monomial-product)'],
      },
    ])
  })

  test('un monomio con lettere ripetute: 6a³ab = 6a⁴b', () => {
    expect(rows(solved('6a³ab'))).toEqual([
      { line: '6a⁴b', steps: ['6a³ab = 6a⁴b (normal-form)'] },
    ])
  })

  test('12a²b³ · (−2) · a³ = −24a⁵b³, da sinistra a destra', () => {
    expect(rows(solved('12a²b³ · (−2) · a³'))).toEqual([
      {
        line: '−24a⁵b³',
        steps: [
          '12a²b³ · (−2) = −24a²b³ (monomial-product)',
          '−24a²b³ · a³ = −24a⁵b³ (monomial-product)',
        ],
      },
    ])
  })

  test('il passaggio porta gli operandi e il risultato come polinomi', () => {
    const [line] = solved('2ab² · 3b³a²').lines
    const [step] = line?.steps ?? []
    expect(step?.operands.map((p) => toText(polynomialExpression(p)))).toEqual([
      '2ab²',
      '3a²b³',
    ])
    expect(step && toText(polynomialExpression(step.result))).toBe('6a³b⁵')
  })

  test('un monomio già in forma normale non ha righe, anche con le lettere in un altro ordine', () => {
    expect(solved('3b³a²').lines).toEqual([])
    expect(result('3b³a²')).toBe('3a²b³')
  })
})

describe('prodotto e quoziente di monomi', () => {
  // Bergamini es. 69.
  test.each([
    ['2a² · (−4a⁵b³)', '−8a⁷b³'],
    ['−4xy³ · 1/2 x³y²', '−2x⁴y⁵'],
  ])('%s = %s, un passaggio solo', (text, expected) => {
    expect(rows(solved(text))).toEqual([
      { line: expected, steps: [`${text} = ${expected} (monomial-product)`] },
    ])
  })

  // Bergamini es. 177: quando è possibile.
  test.each([
    ['−24a⁷ : 6a³', '−4a⁴'],
    ['3ab : 4b', '3/4 a'],
    ['4a²b³ : 2b²', '2a²b'],
  ])('%s = %s', (text, expected) => {
    expect(rows(solved(text))).toEqual([
      { line: expected, steps: [`${text} = ${expected} (monomial-quotient)`] },
    ])
  })

  test('il quoziente che non è un monomio non si svolge', () => {
    expect(() => solved('10a³b : 2a⁴')).toThrow(RangeError)
  })

  test('× e : da sinistra a destra, nella stessa riga', () => {
    expect(rows(solved('6a⁵b⁴ : 2a³b · 5ab'))).toEqual([
      {
        line: '15a³b⁴',
        steps: [
          '6a⁵b⁴ : 2a³b = 3a²b³ (monomial-quotient)',
          '3a²b³ · 5ab = 15a³b⁴ (monomial-product)',
        ],
      },
    ])
  })

  test('un quoziente con le stesse lettere dà un numero', () => {
    expect(result('6a²b : 3a²b')).toBe('2')
  })
})

describe('potenza di un monomio', () => {
  // Bergamini es. 123, con il segno.
  test.each([
    ['(−3a³)²', '9a⁶'],
    ['(−3a²)³', '−27a⁶'],
    ['−(−3a³)³', '27a⁹'],
    ['(−3/2 a²b⁵)³', '−27/8 a⁶b¹⁵'],
  ])('%s = %s, un passaggio solo', (text, expected) => {
    expect(rows(solved(text))).toEqual([
      { line: expected, steps: [`${text} = ${expected} (monomial-power)`] },
    ])
  })

  test('prima le potenze, poi × e :', () => {
    expect(rows(solved('(2a)³ · 3a²'))).toEqual([
      { line: '8a³ · 3a²', steps: ['(2a)³ = 8a³ (monomial-power)'] },
      { line: '24a⁵', steps: ['8a³ · 3a² = 24a⁵ (monomial-product)'] },
    ])
  })

  test('la potenza di un numero resta il ^ di sempre', () => {
    expect(rows(solved('2³ · a'))).toEqual([
      { line: '8 · a', steps: ['2³ = 8 (power)'] },
      { line: '8a', steps: ['8 · a = 8a (monomial-product)'] },
    ])
  })
})
