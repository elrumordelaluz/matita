import { expect, test } from 'vitest'
import { parseExpression, toText } from './expression.ts'
import { rationalToText as rationalText } from './rational.ts'
import { solve, type Solution } from './solver.ts'

function describeSolution(solution: Solution) {
  return solution.lines.map((line) => ({
    line: toText(line.expression),
    steps: line.steps.map(
      (s) =>
        `${rationalText(s.left)} ${s.op} ${rationalText(s.right)} = ${rationalText(s.result)} → ${toText(s.expression)}`,
    ),
  }))
}

test('addizioni e sottrazioni da sinistra a destra', () => {
  expect(describeSolution(solve(parseExpression('12 − 5 + 3 − 4')))).toEqual([
    {
      line: '6',
      steps: [
        '12 - 5 = 7 → 7 + 3 − 4',
        '7 + 3 = 10 → 10 − 4',
        '10 - 4 = 6 → 6',
      ],
    },
  ])
})

test('ogni passaggio dichiara la regola', () => {
  const [line] = solve(parseExpression('20 + 8 − 15')).lines
  expect(line?.steps.map((s) => s.rule)).toEqual([
    'add-sub-left-to-right',
    'add-sub-left-to-right',
  ])
})

test('il risultato è il valore dell’ultima riga', () => {
  expect(rationalText(solve(parseExpression('30 − 12 − 9 + 4')).result)).toBe(
    '13',
  )
})

test('prima × e :, poi + e −, una riga per livello', () => {
  expect(describeSolution(solve(parseExpression('2 + 3 × 4 − 6 : 2')))).toEqual(
    [
      {
        line: '2 + 12 − 3',
        steps: ['3 × 4 = 12 → 2 + 12 − 6 : 2', '6 : 2 = 3 → 2 + 12 − 3'],
      },
      {
        line: '11',
        steps: ['2 + 12 = 14 → 14 − 3', '14 - 3 = 11 → 11'],
      },
    ],
  )
})

test('moltiplicazioni e divisioni da sinistra a destra', () => {
  expect(describeSolution(solve(parseExpression('24 : 4 × 3 : 2')))).toEqual([
    {
      line: '9',
      steps: [
        '24 : 4 = 6 → 6 × 3 : 2',
        '6 × 3 = 18 → 18 : 2',
        '18 : 2 = 9 → 9',
      ],
    },
  ])
})

test('un prodotto in mezzo a una somma', () => {
  expect(
    describeSolution(solve(parseExpression('20 − 3 × 4 + 5 × 2 : 5'))),
  ).toEqual([
    {
      line: '20 − 12 + 2',
      steps: [
        '3 × 4 = 12 → 20 − 12 + 5 × 2 : 5',
        '5 × 2 = 10 → 20 − 12 + 10 : 5',
        '10 : 5 = 2 → 20 − 12 + 2',
      ],
    },
    {
      line: '10',
      steps: ['20 - 12 = 8 → 8 + 2', '8 + 2 = 10 → 10'],
    },
  ])
})

test('i passaggi di × e : dichiarano la loro regola', () => {
  const lines = solve(parseExpression('2 + 3 × 4')).lines
  expect(lines.map((l) => l.steps.map((s) => s.rule))).toEqual([
    ['mul-div-left-to-right'],
    ['add-sub-left-to-right'],
  ])
})

test('un numero da solo non ha righe', () => {
  const solution = solve(parseExpression('7'))
  expect(solution.lines).toEqual([])
  expect(rationalText(solution.result)).toBe('7')
})
