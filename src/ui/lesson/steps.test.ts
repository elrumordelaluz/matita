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

test('senza parentesi si evidenzia l’operazione svolta', () => {
  expect(marks('6 : 3 + 3 × 8')).toEqual([
    { before: '6 : 3 + 3 × 8', target: '6 : 3', bracket: null, settles: false },
    { before: '2 + 3 × 8', target: '3 × 8', bracket: null, settles: false },
    { before: '2 + 24', target: '2 + 24', bracket: null, settles: false },
  ])
})

test('un gruppo che si riduce a un numero si evidenzia con le parentesi', () => {
  expect(marks('1 + (7 + 8) × 3')[0]).toEqual({
    before: '1 + (7 + 8) × 3',
    target: '(7 + 8)',
    bracket: 'round',
    settles: true,
  })
})

test('dentro una quadra si lavora nella quadra', () => {
  expect(marks('[4 × (8 + 8) − 20] : 4 + 16')).toEqual([
    {
      before: '[4 × (8 + 8) − 20] : 4 + 16',
      target: '(8 + 8)',
      bracket: 'round',
      settles: true,
    },
    {
      before: '[4 × 16 − 20] : 4 + 16',
      target: '4 × 16',
      bracket: 'square',
      settles: false,
    },
    {
      before: '[64 − 20] : 4 + 16',
      target: '[64 − 20]',
      bracket: 'square',
      settles: true,
    },
    { before: '44 : 4 + 16', target: '44 : 4', bracket: null, settles: false },
    { before: '11 + 16', target: '11 + 16', bracket: null, settles: false },
  ])
})

test('la resa KaTeX avvolge solo il pezzo svolto', () => {
  const start = parseExpression('6 : 3 + 3 × 8')
  const [first] = markedSteps(start, solve(start).lines).flat()
  expect(first?.tex).toBe(
    `\\mathord{\\htmlClass{${markClass}}{6 \\mathbin{:} 3}} + 3 \\times 8`,
  )
})
