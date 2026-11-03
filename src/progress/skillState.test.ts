import { expect, test } from 'vitest'
import { attempt } from './fixtures.ts'
import { skillStates } from './skillState.ts'

// Il grafo del primo capitolo, ricopiato qui: i progressi ricevono il grafo
// come parametro e non lo leggono da content/.
const graph = [
  { id: 'n.add-sub', prerequisites: [] },
  { id: 'n.mul-div', prerequisites: [] },
  { id: 'n.order', prerequisites: ['n.add-sub', 'n.mul-div'] },
  { id: 'n.parens', prerequisites: ['n.order'] },
]

test('senza tentativi si studiano solo le abilità senza prerequisiti', () => {
  expect(skillStates(graph, [])).toEqual({
    'n.add-sub': 'learning',
    'n.mul-div': 'learning',
    'n.order': 'locked',
    'n.parens': 'locked',
  })
})

test('tre corretti consecutivi senza aiuti rendono l’abilità acquisita', () => {
  const attempts = [
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
  ]
  expect(skillStates(graph, attempts)['n.add-sub']).toBe('learning')
  attempts.push(attempt({ skill: 'n.add-sub', outcome: 'correct' }))
  expect(skillStates(graph, attempts)['n.add-sub']).toBe('mastered')
})

test('un errore azzera la serie', () => {
  const attempts = [
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
    attempt({ skill: 'n.add-sub', outcome: 'wrong' }),
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
  ]
  expect(skillStates(graph, attempts)['n.add-sub']).toBe('learning')
})

test('un suggerimento azzera la serie', () => {
  const attempts = [
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
    attempt({ skill: 'n.add-sub', outcome: 'correct', hints: 1 }),
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
  ]
  expect(skillStates(graph, attempts)['n.add-sub']).toBe('learning')
  attempts.push(attempt({ skill: 'n.add-sub', outcome: 'correct' }))
  expect(skillStates(graph, attempts)['n.add-sub']).toBe('mastered')
})

test('una riscrittura azzera la serie', () => {
  const attempts = [
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
    attempt({ skill: 'n.add-sub', outcome: 'correct', rewrites: 1 }),
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
  ]
  expect(skillStates(graph, attempts)['n.add-sub']).toBe('learning')
})

test('conta l’ordine dei tentativi, non l’ordine in cui arrivano', () => {
  const attempts = [
    attempt({ skill: 'n.add-sub', outcome: 'correct', answeredAt: 1 }),
    attempt({ skill: 'n.add-sub', outcome: 'correct', answeredAt: 3 }),
    attempt({ skill: 'n.add-sub', outcome: 'correct', answeredAt: 4 }),
    attempt({ skill: 'n.add-sub', outcome: 'wrong', answeredAt: 2 }),
  ]
  expect(skillStates(graph, attempts)['n.add-sub']).toBe('learning')
})

test('un’abilità si sblocca quando tutti i prerequisiti sono acquisiti', () => {
  const masterAddSub = [1, 2, 3].map(() =>
    attempt({ skill: 'n.add-sub', outcome: 'correct' }),
  )
  expect(skillStates(graph, masterAddSub)['n.order']).toBe('locked')
  const masterMulDiv = [1, 2, 3].map(() =>
    attempt({ skill: 'n.mul-div', outcome: 'correct' }),
  )
  const states = skillStates(graph, [...masterAddSub, ...masterMulDiv])
  expect(states['n.order']).toBe('learning')
  expect(states['n.parens']).toBe('locked')
})

test('un’abilità acquisita resta acquisita: da lì la segue il ripasso', () => {
  const attempts = [
    ...[1, 2, 3].map(() => attempt({ skill: 'n.add-sub', outcome: 'correct' })),
    attempt({ skill: 'n.add-sub', outcome: 'wrong' }),
  ]
  expect(skillStates(graph, attempts)['n.add-sub']).toBe('mastered')
})

// Vedi SPEC.md, "Il blocco è un consiglio": i tentativi su un'abilità
// bloccata contano come tutti gli altri.
test('un’abilità bloccata si acquisisce lo stesso, e sblocca chi la richiede', () => {
  const attempts = [1, 2, 3].map(() =>
    attempt({ skill: 'n.order', outcome: 'correct' }),
  )
  const states = skillStates(graph, attempts)
  expect(states['n.add-sub']).toBe('learning')
  expect(states['n.mul-div']).toBe('learning')
  expect(states['n.order']).toBe('mastered')
  expect(states['n.parens']).toBe('learning')
})
