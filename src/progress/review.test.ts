import { Rating } from 'ts-fsrs'
import { expect, test } from 'vitest'
import { exportBackup, importBackup } from './backup.ts'
import { attempt } from './fixtures.ts'
import { dueReviews, gradeFor, reviewCards } from './review.ts'
import { createMemoryStore } from './store.ts'

const day = 86_400_000
const monday = Date.UTC(2026, 8, 14, 9)

test.each([
  ['sbagliato', attempt({ outcome: 'wrong' }), Rating.Again],
  ['errore tipico', attempt({ outcome: 'misconception' }), Rating.Again],
  ['non valido', attempt({ outcome: 'invalid' }), Rating.Again],
  [
    'sbagliato dopo un suggerimento',
    attempt({ outcome: 'wrong', hints: 1 }),
    Rating.Again,
  ],
  ['corretto dopo un suggerimento', attempt({ hints: 1 }), Rating.Hard],
  ['corretto dopo una riscrittura', attempt({ rewrites: 1 }), Rating.Hard],
  ['corretto senza aiuti', attempt(), Rating.Good],
])('%s vale %s', (_, a, grade) => {
  expect(gradeFor(a)).toBe(grade)
})

function mastery(skill: string, at: number) {
  return [0, 1, 2].map((i) => attempt({ skill, answeredAt: at + i * 60_000 }))
}

test('un’abilità ha una carta solo da quando è acquisita', () => {
  const attempts = mastery('n.add-sub', monday).slice(0, 2)
  expect(reviewCards(attempts).has('n.add-sub')).toBe(false)
  const cards = reviewCards(mastery('n.add-sub', monday))
  expect(cards.get('n.add-sub')?.due.getTime()).toBeGreaterThan(monday + day)
})

test('un’abilità acquisita scade e torna in ripasso', () => {
  const attempts = mastery('n.add-sub', monday)
  expect(dueReviews(attempts, new Date(monday + day))).toEqual([])
  expect(dueReviews(attempts, new Date(monday + 30 * day))).toEqual([
    'n.add-sub',
  ])
})

test('un errore in ripasso la fa tornare prima di un corretto', () => {
  const later = monday + 4 * day
  const good = reviewCards([
    ...mastery('n.add-sub', monday),
    attempt({ answeredAt: later }),
  ]).get('n.add-sub')
  const again = reviewCards([
    ...mastery('n.add-sub', monday),
    attempt({ outcome: 'wrong', answeredAt: later }),
  ]).get('n.add-sub')
  expect(again!.due.getTime()).toBeLessThan(good!.due.getTime())
})

test('lo stato FSRS si ricostruisce dal backup dei tentativi', async () => {
  const store = createMemoryStore()
  for (const a of [
    ...mastery('n.add-sub', monday),
    attempt({ skill: 'n.add-sub', answeredAt: monday + 3 * day, hints: 1 }),
    attempt({
      skill: 'n.add-sub',
      outcome: 'wrong',
      answeredAt: monday + 9 * day,
    }),
    ...mastery('n.mul-div', monday + day),
  ])
    await store.addAttempt(a)

  const restored = createMemoryStore()
  await importBackup(restored, await exportBackup(store))

  expect(reviewCards(await restored.attempts())).toEqual(
    reviewCards(await store.attempts()),
  )
})
