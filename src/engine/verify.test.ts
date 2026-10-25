import { describe, expect, test } from 'vitest'
import { parseExpression } from './expression.ts'
import type { Exercise } from './generators.ts'
import { verify } from './verify.ts'

// 12 − 5 + 3 − 4 = 6
const exercise: Exercise = {
  skill: 'n.add-sub',
  seed: 1,
  generatorVersion: 1,
  expression: parseExpression('12 − 5 + 3 − 4'),
}

describe('corretto', () => {
  test('il valore giusto', () => {
    expect(verify('6', exercise)).toEqual({ kind: 'correct' })
  })

  test('+5 vale come 5', () => {
    expect(verify('+6', exercise)).toEqual({ kind: 'correct' })
  })

  test('ignora gli spazi intorno', () => {
    expect(verify('  6 ', exercise)).toEqual({ kind: 'correct' })
  })
})

describe('sbagliato', () => {
  test('un altro numero', () => {
    expect(verify('14', exercise)).toEqual({ kind: 'wrong' })
  })

  test('un numero negativo', () => {
    expect(verify('-6', exercise)).toEqual({ kind: 'wrong' })
  })
})

function order(source: string): Exercise {
  return {
    skill: 'n.order',
    seed: 1,
    generatorVersion: 1,
    expression: parseExpression(source),
  }
}

describe('errore tipico', () => {
  test('sommare prima di moltiplicare', () => {
    expect(verify('20', order('2 + 3 × 4'))).toMatchObject({
      kind: 'misconception',
      misconception: 'add-before-mul',
    })
  })

  test('sommare prima di moltiplicare, non quando il valore coincide con quello giusto', () => {
    // 6 + 2 × 1: anche (6 + 2) × 1 dà 8.
    expect(verify('8', order('6 + 2 × 1'))).toEqual({ kind: 'correct' })
  })

  test('+ e − da destra', () => {
    expect(verify('4', order('10 − 4 + 2'))).toMatchObject({
      kind: 'misconception',
      misconception: 'add-sub-right-to-left',
    })
  })

  test('+ e − da destra, non quando il valore coincide con quello giusto', () => {
    // 10 + 4 − 2: anche 10 + (4 − 2) dà 12.
    expect(verify('12', order('10 + 4 − 2'))).toEqual({ kind: 'correct' })
  })

  test('× e : da destra', () => {
    expect(verify('12', order('24 : 4 : 2'))).toMatchObject({
      kind: 'misconception',
      misconception: 'mul-div-right-to-left',
    })
  })

  test('× e : da destra, non quando il valore coincide con quello giusto', () => {
    // 12 × 3 : 3: anche 12 × (3 : 3) dà 12.
    expect(verify('12', order('12 × 3 : 3'))).toEqual({ kind: 'correct' })
  })

  test('parentesi ignorata', () => {
    expect(verify('14', order('(2 + 3) × 4'))).toMatchObject({
      kind: 'misconception',
      misconception: 'ignored-group',
    })
  })

  test('parentesi ignorata, anche una quadra fra altre parentesi', () => {
    // Senza la quadra: 20 − (3 + 5) : 4 = 18.
    expect(verify('18', order('[20 − (3 + 5)] : 4'))).toMatchObject({
      kind: 'misconception',
      misconception: 'ignored-group',
    })
  })

  test('parentesi ignorata, non quando il valore coincide con quello giusto', () => {
    // 20 − (3 × 2): anche 20 − 3 × 2 dà 14.
    expect(verify('14', order('20 − (3 × 2)'))).toEqual({ kind: 'correct' })
  })

  test('ogni errore tipico porta la sua spiegazione', () => {
    const outcome = verify('20', order('2 + 3 × 4'))
    expect(outcome.kind === 'misconception' && outcome.explanation).toMatch(
      /prima × e :/,
    )
  })

  test('una risposta sbagliata che nessun errore tipico spiega', () => {
    expect(verify('15', order('2 + 3 × 4'))).toEqual({ kind: 'wrong' })
  })
})

describe('non valido', () => {
  test('risposta vuota', () => {
    expect(verify('   ', exercise)).toEqual({
      kind: 'invalid',
      message: 'Scrivi il risultato.',
    })
  })

  test('testo illeggibile', () => {
    expect(verify('sei', exercise)).toEqual({
      kind: 'invalid',
      message: 'Scrivi il risultato come numero.',
    })
  })

  test('doppio segno', () => {
    expect(verify('--6', exercise)).toEqual({
      kind: 'invalid',
      message: 'Scrivi un solo segno.',
    })
  })
})
