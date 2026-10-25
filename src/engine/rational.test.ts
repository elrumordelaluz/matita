import { describe, expect, test } from 'vitest'
import {
  add,
  compare,
  div,
  equals,
  isInteger,
  mul,
  rational,
  sub,
} from './rational.ts'

describe('normalizzazione', () => {
  test('riduce ai minimi termini', () => {
    expect(rational(4n, 6n)).toEqual({ num: 2n, den: 3n })
  })

  test('porta il segno al numeratore', () => {
    expect(rational(2n, -3n)).toEqual({ num: -2n, den: 3n })
    expect(rational(-2n, -3n)).toEqual({ num: 2n, den: 3n })
  })

  test('lo zero ha denominatore 1', () => {
    expect(rational(0n, -7n)).toEqual({ num: 0n, den: 1n })
  })

  test('un intero ha denominatore 1', () => {
    expect(rational(5n)).toEqual({ num: 5n, den: 1n })
    expect(rational(6n, 3n)).toEqual({ num: 2n, den: 1n })
  })

  test('rifiuta il denominatore zero', () => {
    expect(() => rational(1n, 0n)).toThrow(RangeError)
  })
})

describe('operazioni', () => {
  test('somma con denominatori diversi', () => {
    expect(add(rational(1n, 2n), rational(1n, 3n))).toEqual(rational(5n, 6n))
  })

  test('sottrazione che cambia segno', () => {
    expect(sub(rational(1n, 4n), rational(3n, 4n))).toEqual(rational(-1n, 2n))
  })

  test('prodotto ridotto', () => {
    expect(mul(rational(2n, 3n), rational(9n, 4n))).toEqual(rational(3n, 2n))
  })

  test('divisione come prodotto per il reciproco', () => {
    expect(div(rational(3n, 4n), rational(-3n, 8n))).toEqual(rational(-2n))
  })

  test('divisione per zero', () => {
    expect(() => div(rational(1n), rational(0n))).toThrow(RangeError)
  })
})

describe('confronto', () => {
  test('uguaglianza fra forme diverse dello stesso valore', () => {
    expect(equals(rational(2n, 4n), rational(1n, 2n))).toBe(true)
    expect(equals(rational(1n, 2n), rational(-1n, 2n))).toBe(false)
  })

  test('ordine', () => {
    expect(compare(rational(1n, 3n), rational(1n, 2n))).toBe(-1)
    expect(compare(rational(-1n, 2n), rational(-2n, 3n))).toBe(1)
    expect(compare(rational(3n, 6n), rational(1n, 2n))).toBe(0)
  })

  test('intero', () => {
    expect(isInteger(rational(8n, 4n))).toBe(true)
    expect(isInteger(rational(7n, 4n))).toBe(false)
  })
})
