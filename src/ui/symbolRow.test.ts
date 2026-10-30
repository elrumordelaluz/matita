import { describe, expect, test } from 'vitest'
import { insertAtCursor, symbolKeys } from './symbolRow.ts'

// I tasti che la riga offre, uno per simbolo: il menu' li chiama per nome.
describe('insertAtCursor', () => {
  test('campo vuoto: il simbolo si scrive e il cursore sta dopo', () => {
    for (const { symbol } of symbolKeys) {
      expect(insertAtCursor('', symbol, 0, 0)).toEqual({
        value: symbol,
        caret: symbol.length,
      })
    }
  })

  test('a fine campo il simbolo si accoda', () => {
    for (const { symbol } of symbolKeys) {
      expect(insertAtCursor('12', symbol, 2, 2)).toEqual({
        value: `12${symbol}`,
        caret: 2 + symbol.length,
      })
    }
  })

  test('in mezzo al campo il simbolo si inserisce al cursore', () => {
    expect(insertAtCursor('12', '−', 1, 1)).toEqual({ value: '1−2', caret: 2 })
  })

  test('la selezione viene sostituita dal simbolo', () => {
    expect(insertAtCursor('1/6', '−', 0, 3)).toEqual({ value: '−', caret: 1 })
  })

  test('una selezione collassata si comporta come il cursore', () => {
    expect(insertAtCursor('23', '/', 1, 1)).toEqual({ value: '2/3', caret: 2 })
  })

  test('campo sfocato: nessuna selezione nota, si accoda in fondo', () => {
    for (const { symbol } of symbolKeys) {
      expect(insertAtCursor('2', symbol, null, null)).toEqual({
        value: `2${symbol}`,
        caret: 1 + symbol.length,
      })
    }
  })

  test('i limiti fuori campo vengono riportati dentro', () => {
    expect(insertAtCursor('23', '(', -4, 99)).toEqual({
      value: '(',
      caret: 1,
    })
  })
})
