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

test('un numero da solo non ha righe', () => {
  const solution = solve(parseExpression('7'))
  expect(solution.lines).toEqual([])
  expect(rationalText(solution.result)).toBe('7')
})
