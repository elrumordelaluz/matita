import { describe, expect, test } from 'vitest'
import { parseExpression } from './expression.ts'
import type { Exercise } from './generators.ts'
import { answerForm, readAnswer, verify } from './verify.ts'

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

function inQ(source: string): Exercise {
  return {
    skill: 'q.order',
    seed: 1,
    generatorVersion: 1,
    expression: parseExpression(source),
  }
}

// 1/2 + 1/6 = 2/3
const twoThirds = inQ('1/2 + 1/6')
// 3/4 − 5/4 = −1/2
const minusHalf = inQ('3/4 − 5/4')
// 4/3 + 2/3 = 2
const two = inQ('4/3 + 2/3')

describe('in Z', () => {
  test('un negativo con il meno tipografico o con il trattino', () => {
    const e = inQ('−8 − (3 − (−6))')
    expect(verify('−17', e)).toEqual({ kind: 'correct' })
    expect(verify('-17', e)).toEqual({ kind: 'correct' })
  })
})

describe('politica delle risposte', () => {
  test('una frazione ridotta è corretta, anche con il segno più', () => {
    expect(verify('2/3', twoThirds)).toEqual({ kind: 'correct' })
    expect(verify('+2/3', twoThirds)).toEqual({ kind: 'correct' })
    expect(verify(' 2 / 3 ', twoThirds)).toEqual({ kind: 'correct' })
  })

  test('una frazione negativa con il segno davanti', () => {
    expect(verify('-1/2', minusHalf)).toEqual({ kind: 'correct' })
    expect(verify('−1/2', minusHalf)).toEqual({ kind: 'correct' })
  })

  test('una frazione impropria è corretta', () => {
    expect(verify('7/3', inQ('2 + 1/3'))).toEqual({ kind: 'correct' })
  })

  test('frazione non ridotta: da riscrivere', () => {
    expect(verify('4/6', twoThirds)).toEqual({
      kind: 'rewrite',
      reason: 'not-reduced',
      message: 'Riduci ai minimi termini.',
    })
  })

  test('intero scritto come frazione: da riscrivere', () => {
    for (const answer of ['6/3', '2/1'])
      expect(verify(answer, two)).toEqual({
        kind: 'rewrite',
        reason: 'integer-as-fraction',
        message: 'Il risultato è un numero intero.',
      })
  })

  test('segno al denominatore: da riscrivere', () => {
    expect(verify('1/-2', minusHalf)).toEqual({
      kind: 'rewrite',
      reason: 'sign-at-denominator',
      message: 'Il segno va davanti alla frazione.',
    })
    expect(verify('-2/-3', twoThirds)).toMatchObject({
      kind: 'rewrite',
      reason: 'sign-at-denominator',
    })
  })

  test('decimale al posto della frazione: da riscrivere', () => {
    for (const answer of ['-0,5', '-0.5'])
      expect(verify(answer, minusHalf)).toEqual({
        kind: 'rewrite',
        reason: 'decimal',
        message: 'Scrivi il risultato come frazione.',
      })
  })

  test('un decimale che vale un intero chiede l’intero', () => {
    expect(verify('2,0', two)).toEqual({
      kind: 'rewrite',
      reason: 'decimal',
      message: 'Il risultato è un numero intero.',
    })
  })

  test('numero misto: non valido', () => {
    expect(verify('2 1/3', inQ('2 + 1/3'))).toEqual({
      kind: 'invalid',
      message: 'Scrivi il risultato come frazione.',
    })
  })

  test('denominatore zero: non valido', () => {
    expect(verify('2/0', two)).toEqual({
      kind: 'invalid',
      message: 'Il denominatore non può essere zero.',
    })
  })

  test('una forma non canonica con il valore sbagliato è sbagliata', () => {
    expect(verify('2/6', twoThirds)).toEqual({ kind: 'wrong' })
    expect(verify('0,5', minusHalf)).toEqual({ kind: 'wrong' })
  })

  test('una frazione sbagliata può essere un errore tipico', () => {
    // (1 + 1)/(2 + 6) = 1/4, scritto anche come 2/8.
    for (const answer of ['1/4', '2/8'])
      expect(verify(answer, twoThirds)).toMatchObject({
        kind: 'misconception',
        misconception: 'added-numerators-denominators',
      })
  })
})

describe('forma scritta', () => {
  test('una lettura sola dà il valore da giudicare e la forma da mostrare', () => {
    expect(readAnswer('4/6')).toEqual({
      ok: true,
      value: { num: 2n, den: 3n },
      rewrite: 'not-reduced',
      form: { tex: '\\frac{4}{6}', text: '4/6' },
    })
  })

  // I 13 casi che si leggono: l'anteprima mostra la forma scritta, non quella
  // canonica.
  test.each([
    ['6', '6', '6'],
    ['0', '0', '0'],
    ['-6', '-6', '−6'],
    ['−6', '-6', '−6'],
    ['+5', '+5', '+5'],
    ['2/3', '\\frac{2}{3}', '2/3'],
    [' 2 / 3 ', '\\frac{2}{3}', '2/3'],
    ['-2/3', '-\\frac{2}{3}', '−2/3'],
    ['4/6', '\\frac{4}{6}', '4/6'],
    ['6/3', '\\frac{6}{3}', '6/3'],
    ['2/-3', '\\frac{2}{-3}', '2/−3'],
    ['-2/-3', '-\\frac{2}{-3}', '−2/−3'],
    ['0,5', '0{,}5', '0,5'],
    ['-0.5', '-0.5', '−0.5'],
  ])('%s si mostra com’è scritta', (answer, tex, text) => {
    expect(answerForm(answer)).toEqual({ tex, text })
  })

  // Gli 8 casi che non si leggono: niente anteprima, il giudizio è a Verifica.
  test.each([
    ['il campo vuoto', ['', '   ']],
    ['un segno da solo', ['-']],
    ['la frazione senza denominatore', ['2/']],
    ['il decimale senza cifre', ['0,']],
    ['un testo', ['sei']],
    ['il doppio segno', ['--5']],
    ['il numero misto', ['2 1/3']],
    ['il denominatore zero', ['2/0']],
  ])('%s non si legge: niente anteprima', (_, answers) => {
    for (const answer of answers) expect(answerForm(answer)).toBeNull()
  })
})
