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
