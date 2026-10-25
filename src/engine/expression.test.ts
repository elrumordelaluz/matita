import { describe, expect, test } from 'vitest'
import { parseExpression, toKatex, toText } from './expression.ts'
import { rational } from './rational.ts'

describe('parseExpression', () => {
  test('associa + e − a sinistra', () => {
    expect(parseExpression('12 - 5 + 3')).toEqual({
      kind: 'binary',
      op: '+',
      left: {
        kind: 'binary',
        op: '-',
        left: { kind: 'number', value: rational(12n) },
        right: { kind: 'number', value: rational(5n) },
      },
      right: { kind: 'number', value: rational(3n) },
    })
  })

  test('accetta il segno meno tipografico', () => {
    expect(parseExpression('12 − 5')).toEqual(parseExpression('12 - 5'))
  })

  test('rifiuta un testo che non è un’espressione', () => {
    expect(() => parseExpression('12 + ')).toThrow()
    expect(() => parseExpression('12 x 3')).toThrow()
  })

  test('× e : legano più di + e −', () => {
    expect(parseExpression('2 + 3 × 4')).toEqual({
      kind: 'binary',
      op: '+',
      left: { kind: 'number', value: rational(2n) },
      right: {
        kind: 'binary',
        op: '×',
        left: { kind: 'number', value: rational(3n) },
        right: { kind: 'number', value: rational(4n) },
      },
    })
  })

  test('accetta ·, ×, * per il prodotto e :, ÷ per la divisione', () => {
    const expected = parseExpression('6 × 4 : 2')
    expect(parseExpression('6 · 4 : 2')).toEqual(expected)
    expect(parseExpression('6*4÷2')).toEqual(expected)
  })
})

describe('resa', () => {
  test('in testo semplice', () => {
    expect(toText(parseExpression('12-5+3-4'))).toBe('12 − 5 + 3 − 4')
  })

  test('in KaTeX', () => {
    expect(toKatex(parseExpression('12 − 5 + 3 − 4'))).toBe('12 - 5 + 3 - 4')
  })

  test('prodotto e divisione in testo semplice', () => {
    expect(toText(parseExpression('2+3*4-6:2'))).toBe('2 + 3 × 4 − 6 : 2')
  })

  test('prodotto e divisione in KaTeX', () => {
    expect(toKatex(parseExpression('2 + 3 × 4 − 6 : 2'))).toBe(
      '2 + 3 \\times 4 - 6 \\mathbin{:} 2',
    )
  })
})
