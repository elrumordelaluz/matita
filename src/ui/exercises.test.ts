import { expect, test } from 'vitest'
import { canPractise, exerciseFor } from './exercises.ts'

test('un’abilità con generatore produce il suo esercizio', () => {
  expect(exerciseFor('n.add-sub', 7)?.skill).toBe('n.add-sub')
  expect(canPractise('n.add-sub')).toBe(true)
})

test('un id che il motore non conosce non si allena', () => {
  expect(exerciseFor('z.order', 7)).toBeNull()
  expect(canPractise('z.order')).toBe(false)
})
