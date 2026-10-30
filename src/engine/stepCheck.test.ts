import { describe, expect, test } from 'vitest'
import { parseExpression } from './expression.ts'
import { checkLine, nextStepHint } from './stepCheck.ts'

// Il controllo riga per riga di "Passo passo", su espressioni da libro di
// testo. Vedi SPEC.md, "Pratica / Passo passo".

const check = (previous: string, next: string) =>
  checkLine(parseExpression(previous), parseExpression(next))

describe('righe accettate', () => {
  test('una sostituzione alla volta', () => {
    expect(check('2 × 3 + 4 × 5', '2 × 3 + 20')).toEqual({ accepted: true })
  })

  test('più sostituzioni alla volta', () => {
    expect(check('2 × 3 + 4 × 5', '6 + 20')).toEqual({ accepted: true })
  })

  test('più operazioni pronte dello stesso livello', () => {
    expect(check('2 × 3 + 4 × 5', '6 + 4 × 5')).toEqual({ accepted: true })
  })

  test('la riga uguale cambia solo il tipo di parentesi', () => {
    expect(check('2 × (3 + 4)', '2 × [3 + 4]')).toEqual({ accepted: true })
  })

  test('prima il dentro delle parentesi', () => {
    expect(check('2 × (3 + 4)', '2 × 7')).toEqual({ accepted: true })
  })

  test('la catena della somma va da sinistra', () => {
    expect(check('2 + 3 + 4', '5 + 4')).toEqual({ accepted: true })
    expect(check('2 + 3 × 4', '2 + 12')).toEqual({ accepted: true })
  })
})

describe('righe rifiutate', () => {
  test('la somma a destra prima di quella a sinistra: ordine', () => {
    expect(check('2 + 3 + 4', '2 + 7')).toEqual({
      accepted: false,
      wrong: 'order',
      operation: '2 + 3',
    })
  })

  test('stesso valore, ordine sbagliato', () => {
    expect(check('2 + 3 × 1', '5 × 1')).toEqual({
      accepted: false,
      wrong: 'order',
      operation: '3 × 1',
    })
  })

  test('la somma prima del prodotto: ordine, e nomina il prodotto', () => {
    expect(check('2 + 3 × 4', '5 × 4')).toEqual({
      accepted: false,
      wrong: 'order',
      operation: '3 × 4',
    })
  })

  test('il risultato sbagliato di un’operazione pronta: valore', () => {
    expect(check('2 × 3 + 4 × 5', '6 + 21')).toEqual({
      accepted: false,
      wrong: 'value',
      operation: '4 × 5',
    })
    expect(check('2 × 3 + 4 × 5', '7 + 20')).toEqual({
      accepted: false,
      wrong: 'value',
      operation: '2 × 3',
    })
  })

  test('un’operazione non pronta sostituita: ordine', () => {
    expect(check('2 × 3 + 4 × 5', '6 + 4 × 6')).toEqual({
      accepted: false,
      wrong: 'value',
      operation: '4 × 5',
    })
  })
})

describe('il suggerimento', () => {
  test('il prossimo passaggio dalla riga dello studente', () => {
    expect(nextStepHint(parseExpression('2 × 3 + 4 × 5'))).toEqual({
      operation: '2 × 3',
      result: '6',
    })
    expect(nextStepHint(parseExpression('2 × 3 + 20'))).toEqual({
      operation: '2 × 3',
      result: '6',
    })
  })

  test('l’ultimo passaggio nomina l’operazione senza il risultato', () => {
    expect(nextStepHint(parseExpression('6 + 20'))).toEqual({
      operation: '6 + 20',
      result: null,
    })
  })

  test('una riga che è già un numero non ha passaggi', () => {
    expect(nextStepHint(parseExpression('26'))).toBeNull()
  })
})
