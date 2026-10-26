import { describe, expect, test } from 'vitest'
import { parseExpression } from './expression.ts'
import { isVisible, recognise } from './misconceptions.ts'
import { rational } from './rational.ts'
import { solve } from './solver.ts'

// Gli errori tipici di Z e Q, riconosciuti dal valore della risposta.
function recognised(source: string, num: bigint, den = 1n) {
  const e = parseExpression(source)
  return recognise(rational(num, den), e, solve(e).result)?.id
}

function visible(id: Parameters<typeof isVisible>[0], source: string) {
  const e = parseExpression(source)
  return isVisible(id, e, solve(e).result)
}

describe('il meno davanti a una parentesi', () => {
  test('tolta la parentesi senza cambiare i segni dentro', () => {
    // 5 − 3 − 7 invece di 5 − (−4).
    expect(recognised('5 − (3 − 7)', -5n)).toBe('minus-group-signs-kept')
    // −3 − 7 + 2 invece di −(−4) + 2.
    expect(recognised('−(3 − 7) + 2', -8n)).toBe('minus-group-signs-kept')
  })

  test('vale anche in N, prima della parentesi ignorata', () => {
    // 20 − 3 + 5 invece di 20 − 8.
    expect(recognised('20 − (3 + 5)', 22n)).toBe('minus-group-signs-kept')
  })

  test('una parentesi ignorata senza meno davanti resta parentesi ignorata', () => {
    expect(recognised('(2 + 3) × 4', 14n)).toBe('ignored-group')
  })

  test('perso il meno davanti a un gruppo', () => {
    // 5 + (−4) invece di 5 − (−4).
    expect(recognised('5 − (3 − 7)', 1n)).toBe('minus-sign-dropped')
    // (3 − 7) + 2 invece di −(3 − 7) + 2.
    expect(recognised('−(3 − 7) + 2', -2n)).toBe('minus-sign-dropped')
  })

  test('perso il meno davanti a un numero relativo', () => {
    // −12 + (−5) invece di −12 − (−5).
    expect(recognised('(−3) × 4 − (−5)', -17n)).toBe('minus-sign-dropped')
    // 6 + (+4) invece di 6 − (+4).
    expect(recognised('6 − (+4)', 10n)).toBe('minus-sign-dropped')
  })

  test('senza tonde dopo il meno non c’è niente da perdere', () => {
    expect(visible('minus-sign-dropped', '6 − 4')).toBe(false)
  })
})

describe('la regola dei segni', () => {
  test('meno per meno preso come meno', () => {
    expect(recognised('(−3) × (−4) + 2', -10n)).toBe(
      'negatives-multiply-to-negative',
    )
    expect(recognised('(−12) : (−3) − 1', -5n)).toBe(
      'negatives-multiply-to-negative',
    )
  })

  test('un prodotto con un solo negativo non cambia', () => {
    expect(visible('negatives-multiply-to-negative', '(−3) × 4 + 2')).toBe(
      false,
    )
  })

  test('la regola dei segni usata in una somma', () => {
    // −3 − 4 come +7.
    expect(recognised('−3 − 4 + 10', 17n)).toBe('sign-rule-in-sum')
    expect(recognised('−5 + (−2)', 7n)).toBe('sign-rule-in-sum')
  })

  test('una somma con segni diversi non cambia', () => {
    expect(visible('sign-rule-in-sum', '−3 + 4')).toBe(false)
  })
})

describe('le frazioni', () => {
  test('sommati numeratori e denominatori', () => {
    // (1 + 1)/(2 + 3) invece di 5/6.
    expect(recognised('1/2 + 1/3', 2n, 5n)).toBe(
      'added-numerators-denominators',
    )
    // (3 − 1)/(4 − 2) = 1 invece di 1/4.
    expect(recognised('3/4 − 1/2', 1n)).toBe('added-numerators-denominators')
  })

  test('con un intero non si confonde', () => {
    expect(visible('added-numerators-denominators', '2 + 1/3')).toBe(false)
  })

  test('un denominatore che si annulla non dà un valore', () => {
    // (2 − 1)/(3 − 3): nessuna risposta lo spiega.
    expect(visible('added-numerators-denominators', '2/3 − 1/3')).toBe(false)
  })

  test('diviso senza prendere il reciproco', () => {
    // 2/5 × 4/3 invece di 2/5 × 3/4.
    expect(recognised('2/5 : 4/3', 8n, 15n)).toBe('divided-without-reciprocal')
    expect(recognised('3/4 : 3', 9n, 4n)).toBe('divided-without-reciprocal')
  })

  test('fra interi la divisione resta una divisione', () => {
    expect(visible('divided-without-reciprocal', '12 : 4')).toBe(false)
  })
})
