import { expect, test } from 'vitest'
import { attempt } from './fixtures.ts'
import { composeSession } from './session.ts'

const graph = [
  { id: 'n.add-sub', prerequisites: [] },
  { id: 'n.mul-div', prerequisites: [] },
  { id: 'n.order', prerequisites: ['n.add-sub', 'n.mul-div'] },
  { id: 'n.parens', prerequisites: ['n.order'] },
  { id: 'n.brackets', prerequisites: ['n.parens'] },
]

const day = 86_400_000
const monday = Date.UTC(2026, 8, 14, 9)

function mastery(skill: string, at: number) {
  return [0, 1, 2].map((i) => attempt({ skill, answeredAt: at + i * 60_000 }))
}

// L'orologio finto è la data passata a composeSession.
const at = (ms: number) => new Date(ms)

test('al primo giorno: l’abilità da cui si parte, poi la prossima sbloccata', () => {
  const session = composeSession({ graph, attempts: [], now: at(monday) })
  expect(session).toHaveLength(10)
  expect(session.slice(0, 6)).toEqual(
    Array(6).fill({ skill: 'n.add-sub', reason: 'new' }),
  )
  expect(session.slice(6)).toEqual(
    Array(4).fill({ skill: 'n.mul-div', reason: 'new' }),
  )
})

test('l’abilità già iniziata viene prima di quella mai vista', () => {
  const attempts = [attempt({ skill: 'n.mul-div', answeredAt: monday })]
  const session = composeSession({ graph, attempts, now: at(monday + 1) })
  expect(session[0]).toEqual({ skill: 'n.mul-div', reason: 'learning' })
  expect(session.at(-1)).toEqual({ skill: 'n.add-sub', reason: 'new' })
})

test('i ripassi scaduti vengono prima, mescolati fra abilità', () => {
  const attempts = [
    ...mastery('n.add-sub', monday),
    ...mastery('n.mul-div', monday + day),
    ...mastery('n.order', monday + 2 * day),
    attempt({ skill: 'n.parens', answeredAt: monday + 3 * day }),
  ]
  const session = composeSession({
    graph,
    attempts,
    now: at(monday + 60 * day),
  })
  const reviews = session.filter((i) => i.reason === 'review')
  expect(session.slice(0, reviews.length)).toEqual(reviews)
  expect(reviews.map((i) => i.skill).sort()).toEqual([
    'n.add-sub',
    'n.mul-div',
    'n.order',
  ])
  session.slice(1).forEach((item, i) => {
    if (item.reason === 'review') expect(item.skill).not.toBe(session[i]?.skill)
  })
  expect(session.slice(reviews.length)).toEqual(
    Array(10 - reviews.length).fill({ skill: 'n.parens', reason: 'learning' }),
  )
})

test('un ripasso non ancora scaduto non entra nella sessione', () => {
  const attempts = mastery('n.add-sub', monday)
  const session = composeSession({ graph, attempts, now: at(monday + day) })
  expect(session.some((i) => i.reason === 'review')).toBe(false)
  expect(session.some((i) => i.skill === 'n.add-sub')).toBe(false)
})

test('nessuna abilità bloccata', () => {
  const attempts = [
    ...mastery('n.add-sub', monday),
    attempt({ skill: 'n.mul-div', outcome: 'wrong', answeredAt: monday + 1 }),
  ]
  for (const days of [0, 1, 10, 100]) {
    const session = composeSession({
      graph,
      attempts,
      now: at(monday + days * day),
    })
    const skills = new Set(session.map((i) => i.skill))
    expect(skills.has('n.order')).toBe(false)
    expect(skills.has('n.parens')).toBe(false)
    expect(skills.has('n.brackets')).toBe(false)
  }
})

test('le abilità che non si possono ancora allenare restano fuori', () => {
  const session = composeSession({
    graph,
    attempts: [],
    now: at(monday),
    canPractise: (skill) => skill === 'n.add-sub',
  })
  expect(session).toEqual(Array(10).fill({ skill: 'n.add-sub', reason: 'new' }))
})

test('con tutto acquisito e niente di scaduto la sessione è vuota', () => {
  const attempts = graph.flatMap((s, i) => mastery(s.id, monday + i * 600_000))
  expect(composeSession({ graph, attempts, now: at(monday + day) })).toEqual([])
})
