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
