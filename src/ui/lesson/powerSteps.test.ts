import { expect, test } from 'vitest'
import { parseExpression, solve, toText } from '../../engine/index.ts'
import { markClass, markedSteps } from './steps.ts'

function marks(source: string) {
  const start = parseExpression(source)
  return markedSteps(start, solve(start).lines)
    .flat()
    .map(({ before, target, bracket, settles }) => ({
      before: toText(before),
      target: toText(target),
      bracket,
      settles,
    }))
}

test('una potenza si evidenzia intera, base ed esponente', () => {
  expect(marks('3 × 2³')).toEqual([
    { before: '3 × 2³', target: '2³', bracket: null, settles: false },
    { before: '3 × 8', target: '3 × 8', bracket: null, settles: false },
  ])
})

test('la parentesi alla base si svolge e cade, l’esponente resta', () => {
  expect(marks('(5 − 2)² + 4')).toEqual([
    {
      before: '(5 − 2)² + 4',
      target: '(5 − 2)',
      bracket: 'round',
      settles: true,
    },
    { before: '3² + 4', target: '3²', bracket: null, settles: false },
    { before: '9 + 4', target: '9 + 4', bracket: null, settles: false },
  ])
})

test('una proprietà evidenzia le potenze che unisce', () => {
  expect(marks('(3²)³ : 3⁴')).toEqual([
    { before: '(3²)³ : 3⁴', target: '(3²)³', bracket: null, settles: false },
    { before: '3⁶ : 3⁴', target: '3⁶ : 3⁴', bracket: null, settles: false },
    { before: '3²', target: '3²', bracket: null, settles: false },
  ])
  expect(marks('2⁵ × 2³ : 2⁶')[0]).toEqual({
    before: '2⁵ × 2³ : 2⁶',
    target: '2⁵ × 2³',
    bracket: null,
    settles: false,
  })
})

test('la resa KaTeX avvolge la potenza con il suo esponente', () => {
  const start = parseExpression('3 × 2³')
  const [first] = markedSteps(start, solve(start).lines).flat()
  expect(first?.tex).toBe(
    `3 \\times \\mathord{\\htmlClass{${markClass}}{{2}^{3}}}`,
  )
})

test('−3² si evidenzia con il suo meno, senza parentesi da togliere', () => {
  expect(marks('−3² + 5')).toEqual([
    { before: '−3² + 5', target: '−3²', bracket: null, settles: false },
    { before: '−9 + 5', target: '−9 + 5', bracket: null, settles: false },
  ])
})

test('con la parentesi alla base, prima la parentesi dentro il meno', () => {
  expect(marks('−(5 − 2)² + 1')[0]).toEqual({
    before: '−(5 − 2)² + 1',
    target: '(5 − 2)',
    bracket: 'round',
    settles: true,
  })
})
