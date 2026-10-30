import { expect, test } from 'vitest'
import type { SessionItem } from '../../progress/session.ts'
import { firstNewItems } from './newSkillGate.ts'

const item = (skill: string, reason: SessionItem['reason']): SessionItem => ({
  skill,
  reason,
})

test('per ogni abilità solo la prima voce new', () => {
  const items = [
    item('n.add-sub', 'new'),
    item('n.add-sub', 'new'),
    item('n.mul-div', 'learning'),
    item('n.add-sub', 'new'),
    item('n.mul-div', 'new'),
    item('n.mul-div', 'new'),
  ]
  expect(firstNewItems(items)).toEqual(
    new Map([
      ['n.add-sub', 0],
      ['n.mul-div', 4],
    ]),
  )
})

test('chi non ha voci new resta fuori, anche se altre ne hanno', () => {
  const items = [
    item('n.add-sub', 'learning'),
    item('n.mul-div', 'new'),
    item('n.add-sub', 'review'),
    item('n.mul-div', 'new'),
  ]
  expect(firstNewItems(items)).toEqual(new Map([['n.mul-div', 1]]))
})

test('senza voci new, o senza piano, nessun cancello', () => {
  expect(
    firstNewItems([
      item('n.order', 'review'),
      item('n.parens', 'learning'),
      item('n.brackets', 'review'),
    ]),
  ).toEqual(new Map())
  expect(firstNewItems([])).toEqual(new Map())
})
