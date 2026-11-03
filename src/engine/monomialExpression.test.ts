import { describe, expect, test } from 'vitest'
import {
  binary,
  monomial,
  parseLiteralExpression,
  toKatex,
  toText,
} from './expression.ts'
import { rational } from './rational.ts'

// Il monomio scritto nell'albero: SPEC.md, "Calcolo letterale", "L'albero".
// Gli esempi vengono da Bergamini, cap. 6.

describe('il monomio scritto', () => {
  test('coefficiente e lettere con gli esponenti, nell’ordine scritto', () => {
    expect(parseLiteralExpression('2ab²')).toEqual(
      monomial(rational(2n), [
        ['a', 1n],
        ['b', 2n],
      ]),
    )
    // Le ripetizioni restano: è l'esercizio di forma normale.
    expect(parseLiteralExpression('2ab² · 3b³a²')).toEqual(
      binary(
        '×',
        monomial(rational(2n), [
          ['a', 1n],
          ['b', 2n],
        ]),
        monomial(rational(3n), [
          ['b', 3n],
          ['a', 2n],
        ]),
      ),
    )
  })

  test('l’esponente si scrive anche con ^', () => {
    expect(parseLiteralExpression('3a^2b')).toEqual(
      parseLiteralExpression('3a²b'),
    )
  })

  test('il coefficiente 1 è sottinteso', () => {
    expect(parseLiteralExpression('a²')).toEqual(
      monomial(rational(1n), [['a', 2n]]),
    )
    expect(toText(monomial(rational(1n), [['x', 1n]]))).toBe('x')
  })

  test('il meno davanti è il segno del coefficiente', () => {
    expect(parseLiteralExpression('−3a²')).toEqual(
      monomial(rational(-3n), [['a', 2n]]),
    )
    expect(parseLiteralExpression('−a²')).toEqual(
      monomial(rational(-1n), [['a', 2n]]),
    )
    expect(toText(monomial(rational(-1n), [['a', 2n]]))).toBe('−a²')
  })

  test('lega più di × e di :, e il divisore non vuole parentesi', () => {
    // 4a²b³ : 2b² = 2a²b, non 4a²b³ : 2 · b²
    expect(parseLiteralExpression('4a²b³ : 2b²')).toEqual(
      binary(
        ':',
        monomial(rational(4n), [
          ['a', 2n],
          ['b', 3n],
        ]),
        monomial(rational(2n), [['b', 2n]]),
      ),
    )
  })

  test('il coefficiente frazionario: barra e spazio nel testo, due piani in KaTeX', () => {
    const half = parseLiteralExpression('1/2 ab²')
    expect(half).toEqual(
      monomial(rational(1n, 2n), [
        ['a', 1n],
        ['b', 2n],
      ]),
    )
    expect(parseLiteralExpression('1/2ab²')).toEqual(half)
    expect(toText(half)).toBe('1/2 ab²')
    expect(toKatex(parseLiteralExpression('−1/2 ab²'))).toBe(
      '-\\frac{1}{2}ab^{2}',
    )
  })

  test('il coefficiente non ha esponente, e l’esponente non si attacca senza ^', () => {
    expect(() => parseLiteralExpression('2³a')).toThrow()
    expect(() => parseLiteralExpression('a3')).toThrow()
    expect(() => parseLiteralExpression('12 x 3')).toThrow()
  })
})

describe('resa e lettura, andata e ritorno', () => {
  // Il testo di `toText` si rilegge nello stesso albero.
  test.each([
    '2a² + 3a',
    '2ab² · 3b³a²',
    '4a²b³ : 2b²',
    '3a − 2b',
    '9x + 5x − 10x + x',
    '3a² + 2b − a²',
    '−4xy³ · 1/2 x³y²',
    '2a² · (−4a⁵b³)',
    '(−3a³)²',
    '(−3a²)³',
    '−(−3a³)³',
    '(3a²)²',
    '(−2a)²',
    '1/2 ab² − ab²',
    '−24a⁷ : 6a³',
    '2xy(3y + 5x²)',
    '(x + 3y)(2x − 4y)',
    '(5/4 a²)(−1/2 a⁴x)² · (−2a²x⁴)',
    '(3a²b²)² : 3a³b − 2a(3b)² + 5a²b⁴ : 2ab⁴ + 5bab²',
  ])('%s', (text) => {
    const tree = parseLiteralExpression(text)
    expect(toText(tree)).toBe(text)
    expect(parseLiteralExpression(toText(tree))).toEqual(tree)
  })

  test('in una somma i termini sono monomi positivi fra + e −', () => {
    const tree = binary(
      '-',
      monomial(rational(3n), [['a', 1n]]),
      monomial(rational(2n), [['b', 1n]]),
    )
    expect(toText(tree)).toBe('3a − 2b')
  })

  test('un monomio negativo fattore va fra tonde, e il prodotto è un punto', () => {
    const tree = binary(
      '×',
      monomial(rational(2n), [['a', 2n]]),
      monomial(rational(-4n), [
        ['a', 5n],
        ['b', 3n],
      ]),
    )
    expect(toText(tree)).toBe('2a² · (−4a⁵b³)')
    expect(toKatex(tree)).toBe('2a^{2} \\cdot (-4a^{5}b^{3})')
  })

  test('un gruppo attaccato è un prodotto allo stesso livello di × e :', () => {
    expect(parseLiteralExpression('2(a + b)')).toEqual(
      parseLiteralExpression('2 · (a + b)'),
    )
    expect(toText(parseLiteralExpression('2 · (a + b)'))).toBe('2(a + b)')
  })

  test('la base di una potenza di monomio è fra tonde', () => {
    expect(toKatex(parseLiteralExpression('(−2a)²'))).toBe('{(-2a)}^{2}')
    expect(toKatex(parseLiteralExpression('(a²)³'))).toBe('{(a^{2})}^{3}')
  })
})
