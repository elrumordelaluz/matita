import { describe, expect, test } from 'vitest'
import { parseLiteralExpression } from './expression.ts'
import {
  isVisibleLiteral,
  misconceptionExplanation,
  recogniseLiteral,
} from './literalMisconceptions.ts'
import { polynomialValue } from './polynomial.ts'

// Gli errori tipici del calcolo letterale: SPEC.md, "Calcolo letterale",
// "Errori tipici". Il confronto avviene fra forme normali.

const recognised = (exercise: string, answer: string) => {
  const e = parseLiteralExpression(exercise)
  return recogniseLiteral(
    polynomialValue(parseLiteralExpression(answer)),
    e,
    polynomialValue(e),
  )?.id
}

describe('prodotto, quoziente e potenza di monomi', () => {
  test('nel prodotto gli esponenti moltiplicati: a² · a³ = a⁶', () => {
    expect(recognised('2a² · 3a³', '6a⁶')).toBe(
      'same-base-multiplies-exponents',
    )
    expect(recognised('6a⁶b : 2a²', '3a³b')).toBe(
      'same-base-multiplies-exponents',
    )
  })

  test('nella potenza di potenza gli esponenti sommati: (a³)² = a⁵', () => {
    expect(recognised('(a³)²', 'a⁵')).toBe('power-of-power-adds-exponents')
  })

  test('il segno nella potenza: (−2a)² = −4a²', () => {
    expect(recognised('(−2a)²', '−4a²')).toBe('negative-base-sign-kept')
  })

  test('il coefficiente non elevato: (3a²)² = 3a⁴', () => {
    expect(recognised('(3a²)²', '3a⁴')).toBe('coefficient-not-raised')
    // Con il segno com'è scritto o con la regola dei segni.
    expect(recognised('(−3a²)²', '−3a⁴')).toBe('coefficient-not-raised')
    expect(recognised('(−3a²)²', '3a⁴')).toBe('coefficient-not-raised')
    expect(misconceptionExplanation('coefficient-not-raised')).toContain(
      '= 9a⁴, non 3a⁴',
    )
  })

  test('la risposta giusta non è un errore', () => {
    expect(recognised('(3a²)²', '9a⁴')).toBeUndefined()
  })

  test('un errore si vede quando la regola sbagliata cambia il risultato', () => {
    const visible = (text: string) => {
      const e = parseLiteralExpression(text)
      return isVisibleLiteral('coefficient-not-raised', e, polynomialValue(e))
    }
    expect(visible('(3a²)²')).toBe(true)
    // Con il coefficiente 1 non c'è niente da elevare.
    expect(visible('(a²)²')).toBe(false)
  })

  test('gli errori riusati hanno la spiegazione dei numeri', () => {
    expect(
      misconceptionExplanation('same-base-multiplies-exponents'),
    ).toContain('Nel prodotto gli esponenti si sommano')
  })
})
