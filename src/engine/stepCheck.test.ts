import { describe, expect, test } from 'vitest'
import { parseExpression, toText } from './expression.ts'
import { rational } from './rational.ts'
import {
  applyOperation,
  checkLine,
  nextStepHint,
  parseStepEntry,
  readsAsNumber,
} from './stepCheck.ts'

// Il controllo riga per riga di "Passo passo", su espressioni da libro di
// testo. Vedi SPEC.md, "Pratica / Passo passo".

const check = (previous: string, next: string) =>
  checkLine(parseExpression(previous), parseExpression(next))

describe('righe accettate', () => {
  test('una sostituzione alla volta', () => {
    expect(check('2 × 3 + 4 × 5', '2 × 3 + 20')).toEqual({ accepted: true })
  })

  test('più sostituzioni alla volta', () => {
    expect(check('2 × 3 + 4 × 5', '6 + 4 × 5')).toEqual({ accepted: true })
    expect(check('2 × 3 + 4 × 5', '6 + 20')).toEqual({ accepted: true })
  })

  test('prima il dentro delle parentesi', () => {
    expect(check('2 × (3 + 4)', '2 × 7')).toEqual({ accepted: true })
  })

  test('la catena della somma va da sinistra', () => {
    expect(check('2 + 3 + 4', '5 + 4')).toEqual({ accepted: true })
    expect(check('2 + 3 × 4', '2 + 12')).toEqual({ accepted: true })
  })

  test('il tipo di parentesi non conta', () => {
    expect(check('2 × (3 + 4)', '2 × [3 + 4]')).toEqual({ accepted: true })
  })

  test('l’operazione svolta è quella nella posizione del risolutore', () => {
    expect(check('2 × 3 + (2 × 3 + 1)', '2 × 3 + (6 + 1)')).toEqual({
      accepted: true,
    })
    expect(check('2 × 3 + 2 × 3', '2 × 3 + 6')).toEqual({ accepted: true })
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
    expect(check('2 + 3 × 4', '5 × 4')).toEqual({
      accepted: false,
      wrong: 'order',
      operation: '3 × 4',
    })
  })

  test('la stessa operazione svolta nell’altra posizione uguale: ordine', () => {
    expect(check('2 × 3 + (2 × 3 + 1)', '6 + (2 × 3 + 1)')).toEqual({
      accepted: false,
      wrong: 'order',
      operation: '2 × 3',
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

  test('un valore sbagliato anche se il totale non cambia', () => {
    expect(check('2 × 3 + 4 × 5', '7 + 19')).toEqual({
      accepted: false,
      wrong: 'value',
      operation: '2 × 3',
    })
  })

  test('un operando cambiato sotto un’operazione ancora da svolgere: valore', () => {
    expect(check('2 × 3 + 4 × 5', '6 + 4 × 6')).toEqual({
      accepted: false,
      wrong: 'value',
      operation: '4 × 5',
    })
  })

  test('il risultato sbagliato dentro le parentesi: valore', () => {
    expect(check('2 × (3 + 4)', '2 × 8')).toEqual({
      accepted: false,
      wrong: 'value',
      operation: '3 + 4',
    })
  })

  test('una riga che divide per zero è rifiutata, senza eccezioni', () => {
    const refused = check('2 × 3 + 4 : 2', '2 × 3 + 4 : 0')
    expect(refused.accepted).toBe(false)
  })

  test('la riga copiata è rifiutata, senza contare come riscrittura', () => {
    expect(check('2 × (3 + 4)', '2 × (3 + 4)')).toEqual({
      accepted: false,
      wrong: 'unchanged',
    })
  })
})

describe('il conto svolto: operazione = risultato', () => {
  test('si legge con gli stessi segni del prodotto e della divisione', () => {
    expect(parseStepEntry('3 × 7 = 21')).toEqual({
      operation: parseExpression('3 × 7'),
      result: rational(21n),
    })
    expect(parseStepEntry('3*7=21')).toEqual(parseStepEntry('3 × 7 = 21'))
  })

  test('ciò che non è un conto uguale a un numero non si legge', () => {
    expect(parseStepEntry('= 5')).toBeNull()
    expect(parseStepEntry('3 × 4 =')).toBeNull()
    expect(parseStepEntry('3 × 4 = 7 + 5')).toBeNull()
  })

  test('il conto del passaggio da svolgere scrive la riga nuova', () => {
    const done = applyOperation(
      parseExpression('2 + 3 × 4'),
      parseStepEntry('3 × 4 = 12')!,
    )
    expect(done.accepted).toBe(true)
    expect(done.accepted && toText(done.line)).toBe('2 + 12')
  })

  test('di più operazioni uguali se ne svolge una', () => {
    const done = applyOperation(
      parseExpression('2 × 3 + 2 × 3'),
      parseStepEntry('2 × 3 = 6')!,
    )
    expect(done.accepted && toText(done.line)).toBe('6 + 2 × 3')
  })

  test('il conto dentro le parentesi di un’espressione lunga', () => {
    const done = applyOperation(
      parseExpression('14 − (3 × 7 + 5) : 13 + (13 + 12 : 2) × 3'),
      parseStepEntry('3 × 7 = 21')!,
    )
    expect(done.accepted && toText(done.line)).toBe(
      '14 − (21 + 5) : 13 + (13 + 12 : 2) × 3',
    )
  })

  test('un conto che non tocca ancora: ordine', () => {
    expect(
      applyOperation(
        parseExpression('2 + 3 × 4'),
        parseStepEntry('2 + 3 = 5')!,
      ),
    ).toEqual({
      accepted: false,
      wrong: 'order',
      operation: '3 × 4',
    })
  })

  test('un conto con il risultato sbagliato: valore', () => {
    expect(
      applyOperation(
        parseExpression('2 + 3 × 4'),
        parseStepEntry('3 × 4 = 13')!,
      ),
    ).toEqual({
      accepted: false,
      wrong: 'value',
      operation: '3 × 4',
    })
  })
})

describe('la risposta finale', () => {
  test('un numero, anche fra parentesi, si legge come numero', () => {
    expect(readsAsNumber(parseExpression('(14)'))).toBe(true)
    expect(readsAsNumber(parseExpression('((14))'))).toBe(true)
    expect(readsAsNumber(parseExpression('(3 + 4)'))).toBe(false)
  })
})

describe('il suggerimento', () => {
  test('il prossimo passaggio dalla riga dello studente', () => {
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
