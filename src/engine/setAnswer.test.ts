import { expect, test } from 'vitest'
import { setToText } from './finiteSet.ts'
import { readSetAnswer } from './setAnswer.ts'

// La lettura di un insieme scritto dallo studente (SPEC.md, "Insiemi",
// "Risposte"): la forma non si normalizza, serve per giudicarla.

function read(answer: string) {
  const reading = readSetAnswer(answer)
  if (!reading.ok) return { message: reading.message }
  return {
    value: setToText(reading.value),
    withEmpty: reading.withEmpty,
    rewrite: reading.rewrite,
  }
}

test('l’ordine non conta, e la forma resta quella scritta', () => {
  expect(read('{5, 1, 3}')).toEqual({
    value: '{1, 3, 5}',
    withEmpty: false,
    rewrite: null,
  })
  const reading = readSetAnswer('{5,1, 3}')
  expect(reading.ok && reading.form).toEqual({
    tex: '\\{5, 1, 3\\}',
    text: '{5, 1, 3}',
  })
})

test('il vuoto si scrive ∅ oppure {}', () => {
  expect(read('∅')).toEqual({ value: '∅', withEmpty: false, rewrite: null })
  expect(read('{}')).toEqual({ value: '∅', withEmpty: false, rewrite: null })
  expect(read('{ }')).toEqual({ value: '∅', withEmpty: false, rewrite: null })
})

test('un elemento ripetuto va riscritto', () => {
  expect(read('{1, 3, 3}')).toMatchObject({
    value: '{1, 3}',
    rewrite: 'repeated-element',
  })
})

test('senza graffe si legge come un insieme, da riscrivere, prima dei doppioni', () => {
  expect(read('1, 3, 5')).toMatchObject({
    value: '{1, 3, 5}',
    rewrite: 'missing-braces',
  })
  expect(read('1, 3, 3')).toMatchObject({ rewrite: 'missing-braces' })
  // Un numero solo vale l'insieme che lo contiene.
  expect(read('3')).toMatchObject({ value: '{3}', rewrite: 'missing-braces' })
})

test('dentro le graffe ∅ è un elemento: {∅} non è il vuoto', () => {
  expect(read('{∅}')).toEqual({ value: '∅', withEmpty: true, rewrite: null })
})

test('un elemento che non è naturale non è valido', () => {
  expect(read('{1, -2}')).toEqual({
    message: 'Gli elementi sono numeri naturali.',
  })
  expect(read('{1, 2/3}')).toEqual({
    message: 'Gli elementi sono numeri naturali.',
  })
})

test('ciò che non si legge come insieme non è valido', () => {
  expect(read('')).toEqual({ message: 'Scrivi il risultato.' })
  expect(read('{1, 2')).toEqual({
    message:
      'Scrivi l’insieme fra graffe, con gli elementi separati da virgole.',
  })
  expect(read('{1,, 2}')).toEqual({
    message:
      'Scrivi l’insieme fra graffe, con gli elementi separati da virgole.',
  })
})
