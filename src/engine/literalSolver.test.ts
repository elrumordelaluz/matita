import { describe, expect, test } from 'vitest'
import { parseLiteralExpression, toText } from './expression.ts'
import { solveLiteral, type LiteralSolution } from './literalSolver.ts'
import {
  equalPolynomials,
  polynomialExpression,
  polynomialValue,
} from './polynomial.ts'

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

describe('la riduzione dei termini simili', () => {
  // Bergamini es. 40.
  test('9x + 5x − 10x + x = 5x: un passaggio con tutti i simili', () => {
    const solution = solved('9x + 5x − 10x + x')
    expect(rows(solution)).toEqual([
      { line: '5x', steps: ['9x + 5x − 10x + x = 5x (like-terms)'] },
    ])
    const [step] = solution.lines[0]?.steps ?? []
    expect(step?.operands.map((p) => toText(polynomialExpression(p)))).toEqual([
      '9x',
      '5x',
      '−10x',
      'x',
    ])
  })

  test('3a² + 2b − a² = 2a² + 2b: il risultato al posto del primo simile', () => {
    expect(rows(solved('3a² + 2b − a²'))).toEqual([
      { line: '2a² + 2b', steps: ['3a² − a² = 2a² (like-terms)'] },
    ])
  })

  test('un passaggio per gruppo, nell’ordine di prima comparsa', () => {
    expect(rows(solved('3a + 2b − a + b'))).toEqual([
      {
        line: '2a + 3b',
        steps: ['3a − a = 2a (like-terms)', '2b + b = 3b (like-terms)'],
      },
    ])
  })

  test('il segno del risultato fra monomi positivi, come sul libro', () => {
    expect(rows(solved('a − 3a + b'))[0]?.line).toBe('−2a + b')
    expect(rows(solved('b + a − 3a'))[0]?.line).toBe('b − 2a')
    expect(rows(solved('2b − a² + 3a²'))).toEqual([
      { line: '2b + 2a²', steps: ['−a² + 3a² = 2a² (like-terms)'] },
    ])
  })

  test('simili opposti si annullano', () => {
    expect(rows(solved('2a − 2a + b'))[0]?.line).toBe('b')
    expect(result('2a − 2a')).toBe('0')
  })

  test('i monomi non simili restano: 3a − 2b', () => {
    expect(solved('3a − 2b').lines).toEqual([])
  })

  // Bergamini es. 39: il coefficiente −1 sottinteso.
  test('4a² − a² − 2a² = a²', () => {
    expect(result('4a² − a² − 2a²')).toBe('a²')
  })

  // Bergamini es. 43, con i decimali del libro scritti come frazioni:
  // 3/4 b³ − 0,2b³ − 1,5b³ + 1/5 b³.
  test('3/4 b³ − 1/5 b³ − 3/2 b³ + 1/5 b³ = −3/4 b³', () => {
    expect(result('3/4 b³ − 1/5 b³ − 3/2 b³ + 1/5 b³')).toBe('−3/4 b³')
  })

  // Bergamini es. 44: i termini nell'ordine di prima comparsa.
  test('−1/4 a + 2b² − 1/2 a + 1/3 b² = −3/4 a + 7/3 b²', () => {
    expect(result('−1/4 a + 2b² − 1/2 a + 1/3 b²')).toBe('−3/4 a + 7/3 b²')
  })
})

describe('espressioni con i monomi', () => {
  const lines = (text: string) =>
    solved(text).lines.map((l) => toText(l.expression))

  // Esercizio guida 95, senza la riga di raccoglimento (1/2 − 1)ab².
  test('es. 95: (3/8 ab)(−4/3 a)(−6b) + b²(1/2 a) − ab²', () => {
    expect(lines('(3/8 ab)(−4/3 a)(−6b) + b²(1/2 a) − ab²')).toEqual([
      '3a²b² + 1/2 ab² − ab²',
      '3a²b² − 1/2 ab²',
    ])
  })

  // Esercizio guida 159: prima le potenze, poi i prodotti con la regola dei
  // segni, poi i simili; il risultato è 3a¹²x⁶.
  test('es. 159: (−1/2 a⁶x³)² + (5/4 a²)(−1/2 a⁴x)²(−2a²x⁴) − (−3/2 a⁴x²)³', () => {
    const text = '(−1/2 a⁶x³)² + (5/4 a²)(−1/2 a⁴x)² · (−2a²x⁴) − (−3/2 a⁴x²)³'
    expect(lines(text)).toEqual([
      '1/4 a¹²x⁶ + 5/4 a² · 1/4 a⁸x² · (−2a²x⁴) − (−27/8 a¹²x⁶)',
      '1/4 a¹²x⁶ − 5/8 a¹²x⁶ + 27/8 a¹²x⁶',
      '3a¹²x⁶',
    ])
    expect(result(text)).toBe('3a¹²x⁶')
  })

  test('il meno davanti a un monomio negativo è la regola dei segni, nel giro di × e :', () => {
    const [, second] = solved(
      '(−1/2 a⁶x³)² + (5/4 a²)(−1/2 a⁴x)² · (−2a²x⁴) − (−3/2 a⁴x²)³',
    ).lines
    expect(
      second?.steps.map((s) => `${toText(s.operation)} = ${toText(s.outcome)}`),
    ).toEqual([
      '5/4 a² · 1/4 a⁸x² = 5/16 a¹⁰x²',
      '5/16 a¹⁰x² · (−2a²x⁴) = −5/8 a¹²x⁶',
      '−(−27/8 a¹²x⁶) = 27/8 a¹²x⁶',
    ])
  })

  // Esercizio guida 199: ogni ambito fa un giro alla volta, come con i
  // numeri, quindi il quoziente del terzo termine aspetta la riga di × e :.
  test('es. 199: (3a²b²)² : 3a³b − 2a(3b)² + 5a²b⁴ : 2ab⁴ + 5bab²', () => {
    expect(lines('(3a²b²)² : 3a³b − 2a(3b)² + 5a²b⁴ : 2ab⁴ + 5bab²')).toEqual([
      '9a⁴b⁴ : 3a³b − 2a · 9b² + 5a²b⁴ : 2ab⁴ + 5ab³',
      '3ab³ − 18ab² + 5/2 a + 5ab³',
      '8ab³ − 18ab² + 5/2 a',
    ])
  })

  test('il gruppo più interno per primo; ridotto a un monomio, le parentesi cadono', () => {
    expect(lines('2a · (3a − 5a) + (a − 3a)²')).toEqual([
      '2a · (−2a) + (−2a)²',
      '2a · (−2a) + 4a²',
      '−4a² + 4a²',
      '0',
    ])
  })

  test('un gruppo dopo il meno che diventa un monomio negativo: la regola dei segni', () => {
    expect(lines('5a − (a − 3a)')).toEqual(['5a − (−2a)', '5a + 2a', '7a'])
  })

  test('tonde dentro quadre', () => {
    expect(lines('[2a · (a + 2a)]² : 4a³')).toEqual([
      '[2a · 3a]² : 4a³',
      '(6a²)² : 4a³',
      '36a⁴ : 4a³',
      '9a',
    ])
  })
})

describe('le parentesi intorno a un polinomio', () => {
  const lines = (text: string) =>
    solved(text).lines.map((l) => toText(l.expression))

  // Bergamini, Matematica multimediale.rosso, cap. 5: somma di polinomi. I
  // termini restano nell'ordine di prima comparsa; il libro scrive
  // 2y³ − 2y² + y + 7, lo stesso polinomio.
  test('(4y³ + 3y + 5) − (2y³ + 2y² + 2y − 2) = 2y³ − 2y² + y + 7', () => {
    const text = '(4y³ + 3y + 5) − (2y³ + 2y² + 2y − 2)'
    expect(rows(solved(text))).toEqual([
      {
        line: '4y³ + 3y + 5 − 2y³ − 2y² − 2y + 2',
        steps: ['−(2y³ + 2y² + 2y − 2) = −2y³ − 2y² − 2y + 2 (minus-group)'],
      },
      {
        line: '2y³ + y + 7 − 2y²',
        steps: [
          '4y³ − 2y³ = 2y³ (like-terms)',
          '3y − 2y = y (like-terms)',
          '5 + 2 = 7 (like-terms)',
        ],
      },
    ])
    expect(
      equalPolynomials(
        solved(text).result,
        polynomialValue(parseLiteralExpression('2y³ − 2y² + y + 7')),
      ),
    ).toBe(true)
  })

  test('dopo il meno le parentesi cadono cambiando il segno di ogni termine: 5a − (2a − b) = 5a − 2a + b', () => {
    expect(rows(solved('5a − (2a − b)'))).toEqual([
      { line: '5a − 2a + b', steps: ['−(2a − b) = −2a + b (minus-group)'] },
      { line: '3a + b', steps: ['5a − 2a = 3a (like-terms)'] },
    ])
  })

  test('dopo il più le parentesi cadono e basta, senza passaggio', () => {
    expect(lines('3a + (2a − b)')).toEqual(['5a − b'])
    expect(lines('(a + b) − (a − b)')).toEqual(['a + b − a + b', '2b'])
  })

  test('il meno davanti al primo gruppo', () => {
    expect(rows(solved('−(a − 2b) + 3a'))).toEqual([
      { line: '−a + 2b + 3a', steps: ['−(a − 2b) = −a + 2b (minus-group)'] },
      { line: '2a + 2b', steps: ['−a + 3a = 2a (like-terms)'] },
    ])
  })

  test('prima si svolge il dentro, poi le parentesi cadono', () => {
    expect(lines('7x − (3x + 2y − x)')).toEqual([
      '7x − (2x + 2y)',
      '7x − 2x − 2y',
      '5x − 2y',
    ])
  })

  test('il passaggio porta il polinomio e il suo opposto', () => {
    const [step] = solved('5a − (2a − b)').lines[0]?.steps ?? []
    expect(step?.operands.map((p) => toText(polynomialExpression(p)))).toEqual([
      '2a − b',
    ])
    expect(step && toText(polynomialExpression(step.result))).toBe('−2a + b')
  })
})

describe('la distributiva', () => {
  const lines = (text: string) =>
    solved(text).lines.map((l) => toText(l.expression))

  const products = (text: string) =>
    solved(text).lines[0]?.steps[0]?.products?.map(
      (p) => `${toText(p.operation)} = ${toText(p.outcome)}`,
    )

  // Bergamini, Matematica multimediale.rosso, cap. 5.
  test('monomio per polinomio: 2xy(3y + 5x²) = 6xy² + 10x³y, un passaggio', () => {
    expect(rows(solved('2xy(3y + 5x²)'))).toEqual([
      {
        line: '6xy² + 10x³y',
        steps: ['2xy(3y + 5x²) = 6xy² + 10x³y (distributive)'],
      },
    ])
    expect(products('2xy(3y + 5x²)')).toEqual([
      '2xy · 3y = 6xy²',
      '2xy · 5x² = 10x³y',
    ])
  })

  test('polinomio per polinomio: (x + 3y)(2x − 4y), poi la riduzione', () => {
    expect(rows(solved('(x + 3y)(2x − 4y)'))).toEqual([
      {
        line: '2x² − 4xy + 6xy − 12y²',
        steps: ['(x + 3y)(2x − 4y) = 2x² − 4xy + 6xy − 12y² (distributive)'],
      },
      { line: '2x² + 2xy − 12y²', steps: ['−4xy + 6xy = 2xy (like-terms)'] },
    ])
    expect(products('(x + 3y)(2x − 4y)')).toEqual([
      'x · 2x = 2x²',
      'x · (−4y) = −4xy',
      '3y · 2x = 6xy',
      '3y · (−4y) = −12y²',
    ])
  })

  test('il passaggio porta i fattori e il prodotto', () => {
    const [step] = solved('(x + 3y)(2x − 4y)').lines[0]?.steps ?? []
    expect(step?.operands.map((p) => toText(polynomialExpression(p)))).toEqual([
      'x + 3y',
      '2x − 4y',
    ])
    expect(step && toText(polynomialExpression(step.result))).toBe(
      '2x² + 2xy − 12y²',
    )
  })

  test('anche con il polinomio prima e con un numero', () => {
    expect(lines('(3y + 5x²) · 2xy')).toEqual(['6xy² + 10x³y'])
    expect(lines('3(2a − b)')).toEqual(['6a − 3b'])
  })

  test('polinomio diviso monomio: ogni termine diviso', () => {
    expect(rows(solved('(12x⁴ − 8x³ + 4x²) : 4x²'))).toEqual([
      {
        line: '3x² − 2x + 1',
        steps: [
          '(12x⁴ − 8x³ + 4x²) : 4x² = 3x² − 2x + 1 (polynomial-quotient)',
        ],
      },
    ])
    expect(products('(12x⁴ − 8x³ + 4x²) : 4x²')).toEqual([
      '12x⁴ : 4x² = 3x²',
      '−8x³ : 4x² = −2x',
      '4x² : 4x² = 1',
    ])
  })

  test('il quoziente che non è un polinomio non si svolge', () => {
    expect(() => solved('(a² + b) : a')).toThrow(RangeError)
  })

  test('dopo il più il prodotto entra nella somma; dopo il meno va fra parentesi', () => {
    expect(lines('5a² + 2a(3a + b)')).toEqual(['5a² + 6a² + 2ab', '11a² + 2ab'])
    expect(lines('5a − 2a(3a + b)')).toEqual([
      '5a − (6a² + 2ab)',
      '5a − 6a² − 2ab',
    ])
  })

  test('il prodotto dentro un altro prodotto va fra parentesi', () => {
    expect(lines('2a(a + b) · 3b')).toEqual(['6a²b + 6ab²'])
    expect(solved('2a(a + b) · 3b').lines[0]?.steps.map((s) => s.rule)).toEqual(
      ['distributive', 'distributive'],
    )
  })
})
