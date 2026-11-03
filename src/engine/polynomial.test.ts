import { describe, expect, test } from 'vitest'
import { parseLiteralExpression, toText } from './expression.ts'
import {
  addPolynomials,
  divideMonomials,
  equalPolynomials,
  monomialOf,
  multiplyMonomials,
  multiplyPolynomials,
  polynomialExpression,
  polynomialOf,
  polynomialValue,
  raisePolynomial,
  type Polynomial,
} from './polynomial.ts'
import { rational } from './rational.ts'

// La forma normale di monomi e polinomi: SPEC.md, "Calcolo letterale", "Il
// dato". Esempi da Bergamini, cap. 6 e 7.

const value = (text: string) => polynomialValue(parseLiteralExpression(text))
const shown = (p: Polynomial) => toText(polynomialExpression(p))

describe('il monomio in forma normale', () => {
  test('un solo coefficiente e lettere diverse: 2ab² · 3b³a² = 6a³b⁵', () => {
    const m = multiplyMonomials(
      monomialOf(rational(2n), [
        ['a', 1n],
        ['b', 2n],
      ]),
      monomialOf(rational(3n), [
        ['b', 3n],
        ['a', 2n],
      ]),
    )
    expect(m).toEqual(
      monomialOf(rational(6n), [
        ['a', 3n],
        ['b', 5n],
      ]),
    )
  })

  test('le lettere ripetute si uniscono, l’esponente zero sparisce', () => {
    expect(
      monomialOf(rational(6n), [
        ['a', 3n],
        ['a', 1n],
        ['b', 1n],
        ['c', 0n],
      ]),
    ).toEqual(
      monomialOf(rational(6n), [
        ['a', 4n],
        ['b', 1n],
      ]),
    )
  })

  test('il quoziente c’è solo se il dividendo ha tutte le lettere del divisore', () => {
    // Bergamini es. 177: −24a⁷ : 6a³ = −4a⁴, 3ab : 4b = 3/4 a, 10a³b : 2a⁴ no.
    const quotient = (a: string, b: string) => {
      const [m] = value(a).values()
      const [n] = value(b).values()
      if (!m || !n) throw new Error('Monomio mancante')
      const q = divideMonomials(m, n)
      return q && shown(polynomialOf([q]))
    }
    expect(quotient('−24a⁷', '6a³')).toBe('−4a⁴')
    expect(quotient('3ab', '4b')).toBe('3/4 a')
    expect(quotient('10a³b', '2a⁴')).toBeNull()
  })
})

describe('il polinomio in forma normale', () => {
  test('i simili si sommano, i termini restano in ordine di prima comparsa', () => {
    expect(shown(value('3a² + 2b − a²'))).toBe('2a² + 2b')
    expect(shown(value('9x + 5x − 10x + x'))).toBe('5x')
  })

  test('i coefficienti nulli spariscono, lo zero è il polinomio nullo', () => {
    expect(shown(value('2a − 2a'))).toBe('0')
    expect(value('2a − 2a').size).toBe(0)
  })

  test('la somma di polinomi: (4y³ + 3y + 5) − (2y³ + 2y² + 2y − 2)', () => {
    expect(shown(value('(4y³ + 3y + 5) − (2y³ + 2y² + 2y − 2)'))).toBe(
      '2y³ + y + 7 − 2y²',
    )
  })

  test('il prodotto: (x + 3y)(2x − 4y) = 2x² + 2xy − 12y²', () => {
    expect(
      equalPolynomials(
        multiplyPolynomials(value('x + 3y'), value('2x − 4y')),
        value('2x² + 2xy − 12y²'),
      ),
    ).toBe(true)
  })

  test('la potenza: (−3/2 a²b⁵)³ = −27/8 a⁶b¹⁵', () => {
    expect(shown(raisePolynomial(value('−3/2 a²b⁵'), 3n))).toBe('−27/8 a⁶b¹⁵')
  })

  test('due polinomi sono uguali se hanno la stessa forma normale, in qualunque ordine', () => {
    expect(equalPolynomials(value('3a − 2b'), value('−2b + 3a'))).toBe(true)
    expect(equalPolynomials(value('3a²b'), value('3ba²'))).toBe(true)
    expect(equalPolynomials(value('3a²b'), value('3ab²'))).toBe(false)
    expect(
      equalPolynomials(
        addPolynomials(value('a'), value('b')),
        value('a + b + 0'),
      ),
    ).toBe(true)
  })

  test('un numero è un polinomio senza lettere', () => {
    expect(shown(value('2 · 3 + 1/2'))).toBe('13/2')
  })
})
