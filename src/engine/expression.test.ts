import { describe, expect, test } from 'vitest'
import {
  binary,
  frac,
  group,
  literal,
  num,
  parseExpression,
  toKatex,
  toText,
  visibleOperation,
} from './expression.ts'
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

  test('un gruppo ricorda il tipo di parentesi', () => {
    expect(parseExpression('[2 + 3] × 4')).toEqual({
      kind: 'binary',
      op: '×',
      left: {
        kind: 'group',
        bracket: 'square',
        inner: {
          kind: 'binary',
          op: '+',
          left: { kind: 'number', value: rational(2n) },
          right: { kind: 'number', value: rational(3n) },
        },
      },
      right: { kind: 'number', value: rational(4n) },
    })
  })

  test('rifiuta parentesi che non si chiudono o non corrispondono', () => {
    expect(() => parseExpression('(2 + 3 × 4')).toThrow()
    expect(() => parseExpression('(2 + 3] × 4')).toThrow()
    expect(() => parseExpression('2 + 3) × 4')).toThrow()
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

  const nested = '{[(8 − 3) × 2 + 4] : 7 + 1} × 3'

  test('tonde, quadre e graffe in testo semplice', () => {
    expect(toText(parseExpression('{[(8-3)*2+4]:7+1}*3'))).toBe(nested)
  })

  test('tonde, quadre e graffe in KaTeX', () => {
    expect(toKatex(parseExpression(nested))).toBe(
      '\\{[(8 - 3) \\times 2 + 4] \\mathbin{:} 7 + 1\\} \\times 3',
    )
  })
})

describe('numeri relativi', () => {
  test('fra tonde, tranne all’inizio dell’espressione', () => {
    expect(toText(parseExpression('-3 + 5 - (-7)'))).toBe('−3 + 5 − (−7)')
    expect(toKatex(parseExpression('−3 + 5 − (−7)'))).toBe('-3 + 5 - (-7)')
  })

  test('fra tonde, tranne all’inizio di un gruppo', () => {
    expect(toText(parseExpression('[−2 + (3 − 7)] × (−2)'))).toBe(
      '[−2 + (3 − 7)] × (−2)',
    )
  })

  test('all’inizio un numero relativo perde le tonde, il segno più resta', () => {
    expect(toText(parseExpression('(−3) × (+4) − (−5)'))).toBe(
      '−3 × (+4) − (−5)',
    )
  })

  test('un numero relativo fra tonde non è un gruppo', () => {
    expect(parseExpression('5 − (−4)')).toEqual({
      kind: 'binary',
      op: '-',
      left: { kind: 'number', value: rational(5n) },
      right: { kind: 'number', value: rational(-4n) },
    })
    expect(parseExpression('5 − (+4)')).toMatchObject({
      right: { kind: 'number', value: rational(4n), plus: true },
    })
  })

  test('altrove un segno senza tonde non si legge', () => {
    expect(() => parseExpression('5 × −3')).toThrow()
    expect(() => parseExpression('5 + +3')).toThrow()
  })

  test('un numero da solo, all’inizio o in mezzo', () => {
    expect(toText(literal(rational(-12n)))).toBe('−12')
    expect(toText(literal(rational(-12n)), { leading: false })).toBe('(−12)')
    expect(toText(literal(rational(4n), { plus: true }))).toBe('+4')
  })
})

describe('il meno davanti a un gruppo', () => {
  test('è un gruppo che ricorda il meno', () => {
    expect(parseExpression('−(3 − 7) + 2')).toEqual({
      kind: 'binary',
      op: '+',
      left: {
        kind: 'group',
        bracket: 'round',
        negated: true,
        inner: parseExpression('3 − 7'),
      },
      right: { kind: 'number', value: rational(2n) },
    })
  })

  test('in testo semplice e in KaTeX', () => {
    const e = parseExpression('-[4 - (5 - (-5)) * 2] - 4')
    expect(toText(e)).toBe('−[4 − (5 − (−5)) × 2] − 4')
    expect(toKatex(e)).toBe('-[4 - (5 - (-5)) \\times 2] - 4')
  })

  test('con un solo numero dentro, il numero ha sempre il segno', () => {
    expect(toText(group('round', num(3n), { negated: true }))).toBe('−(+3)')
    expect(toText(group('round', num(-4n), { negated: true }))).toBe('−(−4)')
    expect(parseExpression('−(+3)')).toEqual(
      group('round', num(3n), { negated: true }),
    )
  })

  test('lontano dall’inizio va fra tonde', () => {
    const e = binary(
      '×',
      num(5n),
      group('round', parseExpression('3 − 7'), { negated: true }),
    )
    expect(toText(e)).toBe('5 × (−(3 − 7))')
    expect(parseExpression(toText(e))).toEqual(e)
  })

  test('il più davanti a un gruppo non si legge', () => {
    expect(() => parseExpression('+(3 − 7)')).toThrow()
  })
})

describe('frazioni', () => {
  test('la barra è la linea di frazione', () => {
    expect(parseExpression('1/2 + 2/3')).toEqual(
      binary('+', frac(1n, 2n), frac(2n, 3n)),
    )
  })

  test('una frazione letta è ridotta', () => {
    expect(parseExpression('4/6')).toEqual(frac(2n, 3n))
  })

  test('in testo semplice e in KaTeX, i negativi come in Z', () => {
    const e = parseExpression('−1/2 + (−2/3) × 3/4')
    expect(toText(e)).toBe('−1/2 + (−2/3) × 3/4')
    expect(toKatex(e)).toBe(
      '-\\frac{1}{2} + \\left(-\\frac{2}{3}\\right) \\times \\frac{3}{4}',
    )
  })

  test('le parentesi intorno alle frazioni crescono con loro', () => {
    expect(toKatex(parseExpression('[1/2 − (1/3 + 1)] : 2'))).toBe(
      '\\left[\\frac{1}{2} - \\left(\\frac{1}{3} + 1\\right)\\right] \\mathbin{:} 2',
    )
  })

  test('rifiuta il denominatore zero e la barra senza numeri', () => {
    expect(() => parseExpression('1/0 + 2')).toThrow()
    expect(() => parseExpression('1/ + 2')).toThrow()
    expect(() => parseExpression('(1 + 2)/3')).toThrow()
  })
})

describe('parseExpression legge quello che scrive toText', () => {
  test.each([
    '−14 − (+10) − (−9)',
    '+8 : (+4) × (−6) : (−4)',
    '−(−3 + (+5)) + (+5)',
    '−{+6 − (−3) × [(+5 + (−8)) × (+5) − (−4)]} + (+9)',
    '−[−(+3 + (−9)) − (+5)] + (−8)',
    '+1/2 − (−5/4) + (+3)',
    '−[+1 − (+4/3 + (+3/2))] − (−1/4)',
  ])('%s', (source) => {
    const e = parseExpression(source)
    expect(toText(e)).toBe(source)
    expect(parseExpression(toText(e))).toEqual(e)
  })
})

// L'operazione come la vede lo studente intorno a un operatore: l'operatore
// con il numero o il gruppo scritto a ciascun lato, non i suoi operandi
// nell'albero. Vedi SPEC.md, "Pratica / Passo passo".
describe('visibleOperation', () => {
  const seen = (source: string, path: Parameters<typeof visibleOperation>[1]) =>
    toText(visibleOperation(parseExpression(source), path))

  test('il + in 2 + 3 × 4 mostra 2 + 3, non 2 + (3 × 4)', () => {
    expect(seen('2 + 3 × 4', [])).toBe('2 + 3')
  })

  test('il + in 2 × 3 + 4 mostra 3 + 4', () => {
    expect(seen('2 × 3 + 4', [])).toBe('3 + 4')
  })

  test('un gruppo accanto all’operatore si vede tutto', () => {
    expect(seen('2 × (3 + 4) − 1', ['left'])).toBe('2 × (3 + 4)')
    expect(seen('2 × (3 + 4) − 1', [])).toBe('(3 + 4) − 1')
  })

  test('dentro un gruppo vale lo stesso', () => {
    expect(seen('20 − [2 + 3 × (4 − 1)]', ['right', 'inner'])).toBe('2 + 3')
  })
})
