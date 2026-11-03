import { describe, expect, test } from 'vitest'
import {
  checkStep,
  operationStep,
  parseExpression,
  parseOperationLine,
  toText,
  type Expression,
} from './index.ts'

// Il controllo delle righe della modalità "Passo passo", su espressioni da
// libro di testo. Vedi SPEC.md, "Pratica / Passo passo".

const check = (previous: string, next: string) =>
  checkStep(parseExpression(previous), parseExpression(next))

const operation = (previous: string, written: string) =>
  operationStep(parseExpression(previous), parseOperationLine(written)!)

// Un rifiuto col suo motivo e il conto da controllare, come si scrive.
function refusal(
  result: ReturnType<typeof check>,
): { reason: string; operation: string | undefined } | null {
  if (result.ok) return null
  const { reason, operation } = result
  return { reason, operation: operation ? toText(operation) : undefined }
}

function names(
  previous: string,
  next: string,
  reason: string,
  operation: string,
) {
  expect(refusal(check(previous, next))).toEqual({ reason, operation })
}

describe('righe rifiutate', () => {
  test('una somma fatta a destra prima delle altre è un errore di ordine', () => {
    names('2 + 3 + 4', '2 + 7', 'order', '2 + 3')
  })

  test('una somma a sinistra di una moltiplicazione è un errore di ordine', () => {
    names('2 + 3 × 1', '5 × 1', 'order', '3 × 1')
  })

  test('i passaggi contano per posizione, non per prima corrispondenza', () => {
    expect(
      refusal(check('2 × 3 + (2 × 3 + 1)', '6 + (2 × 3 + 1)')),
    ).toMatchObject({ reason: 'order' })
  })

  test('un risultato sbagliato su un conto fra parentesi è un errore di valore', () => {
    names('2 × (3 + 4)', '2 × 8', 'value', '3 + 4')
  })

  test('un conto sbagliato è un errore di valore anche se il totale non cambia', () => {
    names('2 × 3 + 4 × 5', '7 + 19', 'value', '2 × 3')
  })

  test('una divisione per zero è rifiutata, senza mai lanciare', () => {
    expect(refusal(check('2 × 3 + 4 : 0', '6 + 4 : 0'))).toMatchObject({
      reason: 'zero-divisor',
    })
    expect(refusal(check('2 × 3 + 4 : 0', '6 + 0'))).toMatchObject({
      reason: 'zero-divisor',
    })
  })

  test('un conto sbagliato scritto come operazione è un errore di valore', () => {
    const refused = operation('2 + 3 × 4', '3 × 4 = 13')
    expect(refused.ok).toBe(false)
    if (!refused.ok)
      expect(toText(refused.operation as Expression)).toBe('3 × 4')
    expect(refused).toMatchObject({ ok: false, reason: 'value' })
  })

  test('un conto fuori ordine scritto come operazione è un errore di ordine', () => {
    const refused = operation('2 + 3 × 4', '2 + 3 = 5')
    expect(refused).toMatchObject({ ok: false, reason: 'order' })
    if (!refused.ok)
      expect(toText(refused.operation as Expression)).toBe('3 × 4')
  })

  test('la copia della riga precedente è rifiutata', () => {
    expect(check('2 + 3 × 4', '2 + 3 × 4')).toEqual({
      ok: false,
      reason: 'copy',
    })
  })
})

describe('righe accettate', () => {
  test('uno o più conti alla volta, con i loro risultati', () => {
    expect(check('2 × 3 + 4 × 5', '2 × 3 + 20')).toEqual({ ok: true })
    expect(check('2 × 3 + 4 × 5', '6 + 20')).toEqual({ ok: true })
  })

  test('i passaggi valgono per posizione', () => {
    expect(check('2 × 3 + (2 × 3 + 1)', '2 × 3 + (6 + 1)')).toEqual({
      ok: true,
    })
    expect(check('2 × 3 + 2 × 3', '2 × 3 + 6')).toEqual({ ok: true })
  })

  test('un conto scritto come operazione sostituisce la prima occorrenza', () => {
    const big = '14 − (3 × 7 + 5) : 13 + (13 + 12 : 2) × 3'
    for (const written of ['3 × 7 = 21', '3*7=21']) {
      const step = operation(big, written)
      expect(step.ok).toBe(true)
      if (step.ok)
        expect(toText(step.line)).toBe('14 − (21 + 5) : 13 + (13 + 12 : 2) × 3')
    }
    const small = operation('2 + 3 × 4', '3 × 4 = 12')
    expect(small.ok).toBe(true)
    if (small.ok) expect(toText(small.line)).toBe('2 + 12')
    const once = operation('2 × 3 + 2 × 3', '2 × 3 = 6')
    expect(once.ok).toBe(true)
    if (once.ok) expect(toText(once.line)).toBe('6 + 2 × 3')
  })

  test('il tipo di parentesi non conta, e non è una copia', () => {
    expect(check('(2 + 3) × 4', '[2 + 3] × 4')).toEqual({ ok: true })
  })
})

// Le righe da cui lo studente deve poter andare avanti: un numero rimasto fra
// parentesi non blocca né il conto successivo né la riga del risolutore.
describe('lo studente non resta bloccato', () => {
  test('un conto scritto come operazione fa cadere le parentesi del risultato', () => {
    const step = operation('2 × (3 + 4)', '3 + 4 = 7')
    expect(step.ok).toBe(true)
    if (step.ok) expect(toText(step.line)).toBe('2 × 7')
  })

  test('un numero rimasto fra parentesi non blocca il conto che lo usa', () => {
    const step = operation('18 − 9 + (72) : 12', '72 : 12 = 6')
    expect(step.ok).toBe(true)
    if (step.ok) expect(toText(step.line)).toBe('18 − 9 + 6')
  })

  test('un numero rimasto fra parentesi non sposta i passaggi della riga', () => {
    expect(check('2 × (7) + (3 × 5 + 1)', '2 × 7 + (15 + 1)')).toEqual({
      ok: true,
    })
    expect(check('2 × {10} + 6 : 2', '20 + 3')).toEqual({ ok: true })
  })

  test('togliere le parentesi intorno a un numero è una riga valida', () => {
    expect(check('2 × (7) + 1', '2 × 7 + 1')).toEqual({ ok: true })
  })

  test('un conto scritto come operazione va dove il passaggio è possibile', () => {
    const step = operation('2 × 3 + (2 × 3 + 1)', '2 × 3 = 6')
    expect(step.ok).toBe(true)
    if (step.ok) expect(toText(step.line)).toBe('2 × 3 + (6 + 1)')
    const inner = operation('3 + 4 + (3 + 4)', '3 + 4 = 7')
    expect(inner.ok).toBe(true)
    if (inner.ok) expect(toText(inner.line)).toBe('3 + 4 + 7')
    expect(operation('2 × 3 + (2 × 3 + 1)', '2 × 3 = 7')).toMatchObject({
      ok: false,
      reason: 'value',
    })
  })
})
