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

describe('somma algebrica di monomi', () => {
  test('fra simili sommati anche gli esponenti: 2a² + 3a² = 5a⁴', () => {
    expect(recognised('2a² + 3a²', '5a⁴')).toBe('like-terms-exponents-added')
    // Solo fra simili: il termine che resta da solo non cambia.
    expect(recognised('3a² + 2b − a²', '2a⁴ + 2b')).toBe(
      'like-terms-exponents-added',
    )
  })

  test('non simili sommati: 3a + 2b = 5ab, 2a² + 3a³ = 5a⁵', () => {
    expect(recognised('3a + 2b', '5ab')).toBe('unlike-terms-conjoined')
    expect(recognised('2a² + 3a³', '5a⁵')).toBe('unlike-terms-conjoined')
  })

  test('il coefficiente sottinteso contato zero: 9x + 5x − 10x + x = 4x', () => {
    expect(recognised('9x + 5x − 10x + x', '4x')).toBe(
      'implicit-coefficient-zero',
    )
  })

  test('ogni errore ha la sua spiegazione', () => {
    expect(misconceptionExplanation('like-terms-exponents-added')).toContain(
      '2a² + 3a² = 5a²',
    )
    expect(misconceptionExplanation('unlike-terms-conjoined')).toContain(
      '3a + 2b',
    )
    expect(misconceptionExplanation('implicit-coefficient-zero')).toContain(
      'il coefficiente è 1',
    )
  })
})

describe('somma algebrica di polinomi', () => {
  test('il meno davanti alla parentesi senza cambiare i segni: −(a − b) = −a − b', () => {
    expect(recognised('5a − (2a − b)', '3a − b')).toBe('minus-group-signs-kept')
    expect(
      recognised('(4y³ + 3y + 5) − (2y³ + 2y² + 2y − 2)', '2y³ + 2y² + 5y + 3'),
    ).toBe('minus-group-signs-kept')
    // Anche con il meno davanti al primo gruppo.
    expect(recognised('−(a − 2b) + 3a', '2a − 2b')).toBe(
      'minus-group-signs-kept',
    )
  })

  test('dopo il più le parentesi non cambiano niente', () => {
    const e = parseLiteralExpression('3a + (2a − b)')
    expect(
      isVisibleLiteral('minus-group-signs-kept', e, polynomialValue(e)),
    ).toBe(false)
  })

  test('la spiegazione è quella dei numeri', () => {
    expect(misconceptionExplanation('minus-group-signs-kept')).toContain(
      'cambia il segno di ogni termine',
    )
  })
})

describe('la distributiva', () => {
  test('sul primo termine soltanto: 2x(3y + 5x²) = 6xy + 5x²', () => {
    expect(recognised('2x(3y + 5x²)', '6xy + 5x²')).toBe(
      'distributive-first-term-only',
    )
    expect(recognised('(3y + 5x²) · 2x', '6xy + 5x²')).toBe(
      'distributive-first-term-only',
    )
    expect(recognised('2x(3y + 5x²)', '6xy + 10x³')).toBeUndefined()
  })

  test('fra due polinomi non si legge così', () => {
    const e = parseLiteralExpression('(x + 3y)(2x − 4y)')
    expect(
      isVisibleLiteral('distributive-first-term-only', e, polynomialValue(e)),
    ).toBe(false)
  })

  test('la sua spiegazione', () => {
    expect(misconceptionExplanation('distributive-first-term-only')).toContain(
      '2x(3y + 5x²) = 6xy + 10x³',
    )
  })
})

describe('i prodotti notevoli', () => {
  test('la potenza distribuita sulla somma: (a + b)² = a² + b²', () => {
    expect(recognised('(2x² + 3y)²', '4x⁴ + 9y²')).toBe('power-of-sum')
    expect(recognised('(3a − 2b)²', '9a² + 4b²')).toBe('power-of-sum')
    // La spiegazione è quella delle potenze di numeri.
    expect(misconceptionExplanation('power-of-sum')).toContain(
      'La potenza non si distribuisce su + e −',
    )
  })

  test('anche nel cubo di un binomio e nel quadrato di un trinomio', () => {
    expect(recognised('(x + 2)³', 'x³ + 8')).toBe('power-of-sum')
    expect(recognised('(2x − y + 5)²', '4x² + y² + 25')).toBe('power-of-sum')
  })

  test('il quadrato di una differenza con il segno sbagliato: (a − b)² = a² − 2ab − b²', () => {
    expect(recognised('(3a − 2b)²', '9a² − 12ab − 4b²')).toBe(
      'square-of-difference-sign',
    )
    // Con il più non c'è differenza.
    const e = parseLiteralExpression('(2x² + 3y)²')
    expect(
      isVisibleLiteral('square-of-difference-sign', e, polynomialValue(e)),
    ).toBe(false)
    expect(misconceptionExplanation('square-of-difference-sign')).toContain(
      '(a − b)² = a² − 2ab + b²',
    )
  })

  test('la somma per differenza con il più: (a + b)(a − b) = a² + b²', () => {
    expect(recognised('(3x + 2y)(3x − 2y)', '9x² + 4y²')).toBe(
      'sum-times-difference-plus',
    )
    expect(recognised('(a − 5)(a + 5)', 'a² + 25')).toBe(
      'sum-times-difference-plus',
    )
    expect(misconceptionExplanation('sum-times-difference-plus')).toContain(
      '(a + b)(a − b) = a² − b²',
    )
  })
})
