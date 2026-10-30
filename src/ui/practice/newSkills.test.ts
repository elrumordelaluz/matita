import { describe, expect, test } from 'vitest'
import type { SessionItem } from '../../progress/session.ts'
import { firstNewBySkill } from './newSkills.ts'

const item = (skill: string, reason: SessionItem['reason']): SessionItem => ({
  skill,
  reason,
})

describe('firstNewBySkill', () => {
  test('ogni abilità nuova compare col suo primo indice', () => {
    const items = [
      item('n.add-sub', 'review'),
      item('n.mul-div', 'new'),
      item('n.add-sub', 'new'),
      item('n.mul-div', 'new'),
    ]
    expect(firstNewBySkill(items)).toEqual(
      new Map([
        ['n.mul-div', 1],
        ['n.add-sub', 2],
      ]),
    )
  })

  test('le voci non nuove non contano', () => {
    const items = [item('n.add-sub', 'review'), item('n.mul-div', 'learning')]
    expect(firstNewBySkill(items).size).toBe(0)
  })

  test('la sessione vuota non ha abilità nuove', () => {
    expect(firstNewBySkill([]).size).toBe(0)
  })
})
