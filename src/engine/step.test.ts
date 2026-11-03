import { describe, expect, test } from 'vitest'
import {
  checkStep,
  operationStep,
  operationStepAt,
  parseExpression,
  parseOperationLine,
  rational,
  toText,
  type Expression,
  type Path,
} from './index.ts'

// Il controllo delle righe della modalità "Passo passo", su espressioni da
// libro di testo. Vedi SPEC.md, "Pratica / Passo passo".

const check = (previous: string, next: string) =>
  checkStep(parseExpression(previous), parseExpression(next))

const operation = (previous: string, written: string) =>
  operationStep(parseExpression(previous), parseOperationLine(written)!)

// Un conto toccato sulla riga: la posizione dell'operatore e il risultato.
const tapped = (previous: string, path: Path, result: bigint) =>
  operationStepAt(parseExpression(previous), path, rational(result))

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

// Il conto toccato sulla riga invece che scritto: la posizione dice quale
// operatore, anche fra copie uguali, e l'ordine si giudica come sempre.
describe('un conto toccato', () => {
  test('diventa il suo risultato dove lo studente ha toccato', () => {
    const step = tapped('2 + 3 × 4', ['right'], 12n)
    expect(step.ok).toBe(true)
    if (step.ok) expect(toText(step.line)).toBe('2 + 12')
  })

  test('fra copie uguali vale quella toccata, non la prima', () => {
    const second = tapped('2 × 3 + 2 × 3', ['right'], 6n)
    expect(second.ok).toBe(true)
    if (second.ok) expect(toText(second.line)).toBe('2 × 3 + 6')
    const inner = tapped('2 × 3 + (2 × 3 + 1)', ['right', 'inner', 'left'], 6n)
    expect(inner.ok).toBe(true)
    if (inner.ok) expect(toText(inner.line)).toBe('2 × 3 + (6 + 1)')
  })

  test("la copia che non si può ancora fare è un errore di ordine, anche se l'altra si può", () => {
    const refused = tapped('2 × 3 + (2 × 3 + 1)', ['left'], 6n)
    expect(refusal(refused)).toEqual({ reason: 'order', operation: '2 × 3' })
  })

  test('un operatore con operandi non ancora numeri è un errore di ordine', () => {
    expect(refusal(tapped('2 + 3 × 4', [], 5n))).toEqual({
      reason: 'order',
      operation: '3 × 4',
    })
    expect(refusal(tapped('2 + 3 × 4', [], 14n))).toEqual({
      reason: 'order',
      operation: '3 × 4',
    })
  })

  test('in una catena il conto toccato è quello che si vede, e si giudica l’ordine', () => {
    // 10 − 2 − 3: il secondo − mostra 2 − 3, che va fatto dopo 10 − 2.
    for (const result of [5n, 7n])
      expect(refusal(tapped('10 − 2 − 3', [], result))).toEqual({
        reason: 'order',
        operation: '10 − 2',
      })
    expect(refusal(tapped('20 : 2 × 5', [], 10n))).toEqual({
      reason: 'order',
      operation: '20 : 2',
    })
    expect(refusal(tapped('20 : 2 × 5', [], 50n))).toEqual({
      reason: 'order',
      operation: '20 : 2',
    })
    // Un conto toccato dà una riga sola, non due conti insieme.
    expect(refusal(tapped('2 + 3 × 4 × 5', ['right'], 60n))).toEqual({
      reason: 'order',
      operation: '3 × 4',
    })
  })

  test('un risultato sbagliato è un errore di valore', () => {
    expect(refusal(tapped('2 + 3 × 4', ['right'], 13n))).toEqual({
      reason: 'value',
      operation: '3 × 4',
    })
  })

  test('il conto dentro le parentesi fa cadere le parentesi', () => {
    const step = tapped('2 × (3 + 4)', ['right', 'inner'], 7n)
    expect(step.ok).toBe(true)
    if (step.ok) expect(toText(step.line)).toBe('2 × 7')
    const settled = tapped('18 − 9 + (72) : 12', ['right'], 6n)
    expect(settled.ok).toBe(true)
    if (settled.ok) expect(toText(settled.line)).toBe('18 − 9 + 6')
  })

  test("l'ultimo conto lascia il risultato", () => {
    const step = tapped('2 + 12', [], 14n)
    expect(step.ok).toBe(true)
    if (step.ok) expect(toText(step.line)).toBe('14')
  })

  test('una divisione per zero è rifiutata, senza mai lanciare', () => {
    expect(refusal(tapped('2 × 3 + 4 : 0', ['left'], 6n))).toMatchObject({
      reason: 'zero-divisor',
    })
  })
})
