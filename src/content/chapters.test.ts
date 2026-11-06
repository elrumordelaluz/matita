import { expect, test } from 'vitest'
import { chapters } from './chapters.ts'

test('ogni capitolo ha almeno un’abilità', () => {
  const empty = chapters
    .filter((c) => c.skills.length === 0)
    .map((c) => `${c.id} (${c.title})`)
  expect(empty).toEqual([])
})
