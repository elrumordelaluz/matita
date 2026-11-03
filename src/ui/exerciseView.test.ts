import { expect, test } from 'vitest'
import { generate } from '../engine/index.ts'
import { answerPreview, keysOf } from './exerciseView.tsx'

// Ciò che la pagina prende dal tipo di risposta: i tasti sul telefono e
// l'anteprima della risposta scritta.

test('la tastierina degli insiemi ha le graffe, la virgola e il vuoto', () => {
  const keys = keysOf(generate('set.roster', 1)).map((k) => k.label)
  expect(keys).toEqual([
    'apri graffa',
    'chiudi graffa',
    'virgola',
    'insieme vuoto',
  ])
  expect(keysOf(generate('n.add-sub', 1)).map((k) => k.label)).toContain(
    'linea di frazione',
  )
})

test('l’anteprima di un insieme lo mostra come è scritto', () => {
  const exercise = generate('set.roster', 1)
  expect(answerPreview(exercise, '{3,1}')?.text).toBe('{3, 1}')
  expect(answerPreview(exercise, '∅')?.text).toBe('∅')
  expect(answerPreview(exercise, '{1, -2}')).toBeNull()
})
