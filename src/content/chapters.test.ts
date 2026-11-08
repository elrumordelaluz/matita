import { expect, test } from 'vitest'
import { chapters } from './chapters.ts'

test('ogni capitolo ha almeno un’abilità', () => {
  const empty = chapters
    .filter((c) => c.skills.length === 0)
    .map((c) => `${c.id} (${c.title})`)
  expect(empty).toEqual([])
})

test('i numeri dei capitoli seguono l’ordine dell’elenco', () => {
  expect(
    chapters.flatMap((c, i) =>
      c.number === i + 1
        ? []
        : [`${c.id} (${c.title}): numero ${c.number}, atteso ${i + 1}`],
    ),
  ).toEqual([])
})
