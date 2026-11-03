import { describe, expect, test } from 'vitest'
import { parseLiteralExpression, toText } from './expression.ts'
import type { PolynomialExercise } from './generators.ts'
import { polynomialExpression } from './polynomial.ts'
import { readPolynomialAnswer } from './polynomialAnswer.ts'
import { verify } from './verify.ts'

// La risposta polinomio: SPEC.md, "Calcolo letterale", "Risposte". Una riga
// di test per ogni riga della tabella, nell'ordine della SPEC.

// Un esercizio il cui risultato è il polinomio scritto.
const exercise = (expected: string): PolynomialExercise => ({
  kind: 'polynomial',
  skill: 'mono.normal-form',
  seed: 0,
  generatorVersion: 1,
  expression: parseLiteralExpression(expected),
})

const judge = (answer: string, expected: string) =>
  verify(answer, exercise(expected))

const read = (answer: string) => {
  const reading = readPolynomialAnswer(answer)
  if (!reading.ok) throw new Error(reading.message)
  return toText(polynomialExpression(reading.value))
}

describe('la politica delle risposte polinomio', () => {
  test('termini in un altro ordine: corretto', () => {
    expect(judge('-2b + 3a', '3a − 2b')).toEqual({ kind: 'correct' })
  })

  test('lettere in un altro ordine: corretto', () => {
    expect(judge('3ba^2', '3a²b')).toEqual({ kind: 'correct' })
  })

  test('prodotto non svolto: Svolgi i prodotti.', () => {
    expect(judge('2(a + b)', '2a + 2b')).toMatchObject({
      kind: 'rewrite',
      reason: 'products',
      message: 'Svolgi i prodotti.',
    })
  })

  test('monomio non in forma normale: 2aab e 2·3a', () => {
    for (const [answer, expected] of [
      ['2aab', '2a²b'],
      ['2·3a', '6a'],
      ['12a²b³(−2)a³', '−24a⁵b³'],
    ] as const)
      expect(judge(answer, expected), answer).toMatchObject({
        kind: 'rewrite',
        reason: 'normal-form',
        message: 'Scrivi ogni monomio in forma normale.',
      })
  })

  test('coefficiente 1 scritto: 1a, −1ab', () => {
    expect(judge('1a', 'a')).toMatchObject({
      kind: 'rewrite',
      reason: 'coefficient-one',
      message: 'Il coefficiente 1 non si scrive.',
    })
    expect(judge('-1ab', '−ab')).toMatchObject({ reason: 'coefficient-one' })
  })

  test('esponente 1 scritto: a^1b', () => {
    expect(judge('a^1b', 'ab')).toMatchObject({
      kind: 'rewrite',
      reason: 'exponent-one',
      message: 'L’esponente 1 non si scrive.',
    })
  })

  test('esponente 0 scritto: 3a^0', () => {
    expect(judge('3a^0', '3')).toMatchObject({
      kind: 'rewrite',
      reason: 'exponent-zero',
      message: 'a⁰ vale 1.',
    })
  })

  test('termini simili non ridotti: 3a + 2a', () => {
    expect(judge('3a + 2a', '5a')).toMatchObject({
      kind: 'rewrite',
      reason: 'like-terms',
      message: 'Somma i monomi simili.',
    })
  })

  test('coefficiente non ridotto: come in Q', () => {
    expect(judge('2/4a', '1/2 a')).toMatchObject({
      kind: 'rewrite',
      reason: 'not-reduced',
      message: 'Riduci ai minimi termini.',
    })
    expect(judge('0,5a', '1/2 a')).toMatchObject({
      kind: 'rewrite',
      reason: 'decimal',
      message: 'Scrivi il risultato come frazione.',
    })
    expect(judge('6a/3', '2a')).toMatchObject({
      kind: 'rewrite',
      reason: 'integer-as-fraction',
    })
    expect(judge('2/-3a', '−2/3 a')).toMatchObject({
      reason: 'sign-at-denominator',
    })
  })

  test('lettera al denominatore: Non è un polinomio.', () => {
    expect(judge('a/b', 'a')).toEqual({
      kind: 'invalid',
      message: 'Non è un polinomio.',
    })
    expect(judge('3/(a + b)', 'a')).toMatchObject({
      message: 'Non è un polinomio.',
    })
  })

  test('esponente senza ^: Scrivi l’esponente con ^.', () => {
    expect(judge('a3', 'a³')).toEqual({
      kind: 'invalid',
      message: 'Scrivi l’esponente con ^.',
    })
  })

  test('i motivi si mostrano nell’ordine in cui si corregge', () => {
    // prodotti, forma normale, coefficiente 1, esponenti, simili, Q
    expect(judge('2(aa + b)', '2a² + 2b')).toMatchObject({
      reason: 'products',
    })
    expect(judge('2aa + 1b', '2a² + b')).toMatchObject({
      reason: 'normal-form',
    })
    expect(judge('1a + 2a', '3a')).toMatchObject({
      reason: 'coefficient-one',
    })
    expect(judge('2/4a + a', '3/2 a')).toMatchObject({ reason: 'like-terms' })
  })

  test('in forma non canonica con il valore sbagliato si giudica dal valore', () => {
    expect(judge('3a + 2a', '6a')).toEqual({ kind: 'wrong' })
  })
})

describe('la lettura', () => {
  test('l’esponente con ^ o con le cifre ad apice', () => {
    expect(read('3a^2b - 1/2ab^2')).toBe('3a²b − 1/2 ab²')
    expect(read('3a²b − 1/2ab²')).toBe('3a²b − 1/2 ab²')
  })

  test('le lettere attaccate si moltiplicano', () => {
    expect(read('ab')).toBe('ab')
  })

  test('le due letture della barra', () => {
    // Fra due numeri all'inizio: la frazione del coefficiente.
    expect(read('1/2ab²')).toBe('1/2 ab²')
    // Dopo un monomio, seguita da un numero: divide il coefficiente.
    expect(read('ab²/2')).toBe('1/2 ab²')
    expect(read('6a/3')).toBe('2a')
    expect(judge('ab²/2', '1/2 ab²')).toEqual({ kind: 'correct' })
  })

  test('un numero è un polinomio senza lettere', () => {
    expect(judge('-7', '−7')).toEqual({ kind: 'correct' })
    expect(judge('0', '2a − 2a')).toEqual({ kind: 'correct' })
  })

  test('quello che non si legge come polinomio', () => {
    expect(readPolynomialAnswer('')).toMatchObject({
      ok: false,
      message: 'Scrivi il risultato.',
    })
    expect(readPolynomialAnswer('--a')).toMatchObject({
      message: 'Scrivi un solo segno.',
    })
    expect(readPolynomialAnswer('3a +')).toMatchObject({ ok: false })
    expect(readPolynomialAnswer('a^-2')).toMatchObject({
      message: 'Non è un polinomio.',
    })
    expect(readPolynomialAnswer('2/0a')).toMatchObject({
      message: 'Il denominatore non può essere zero.',
    })
  })

  test('l’anteprima mostra la risposta come è scritta', () => {
    const reading = readPolynomialAnswer('3a^2b - 1/2ab^2')
    expect(reading).toMatchObject({
      ok: true,
      form: { text: '3a²b − 1/2ab²', tex: '3a^{2}b - \\frac{1}{2}ab^{2}' },
    })
  })
})
