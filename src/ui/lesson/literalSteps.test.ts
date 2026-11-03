import { expect, test } from 'vitest'
import {
  generate,
  parseLiteralExpression,
  solveLiteral,
  toText,
  type PolynomialSkill,
} from '../../engine/index.ts'
import { expressionLines } from '../exerciseView.tsx'
import { markedSteps } from './steps.ts'

// Ogni passaggio del calcolo letterale si apre sul quaderno della lezione,
// con il pezzo che svolge: la sostituzione, i passaggi fra monomi, la
// riduzione dei simili, la regola dei segni.

const skills: readonly PolynomialSkill[] = [
  'mono.normal-form',
  'mono.mul-div',
  'mono.power',
  'mono.add-sub',
  'mono.expressions',
  'poly.add-sub',
  'poly.mono-times',
  'poly.times',
]

test('ogni passaggio di un esercizio dei monomi ha il suo pezzo evidenziato', () => {
  for (const skill of skills)
    for (let seed = 0; seed < 60; seed++) {
      const exercise = generate(skill, seed)
      const marked = markedSteps(exercise.expression, expressionLines(exercise))
      for (const step of marked.flat())
        expect(step.tex, `${skill} ${seed}`).toContain('\\htmlClass')
    }
})

test('il meno davanti a un polinomio evidenzia il gruppo, anche se la somma cambia forma', () => {
  const start = parseLiteralExpression('(4y³ + 3y + 5) − (2y³ + 2y² + 2y − 2)')
  const [first, second] = markedSteps(start, solveLiteral(start).lines)
  expect(first?.map((s) => toText(s.target))).toEqual(['(2y³ + 2y² + 2y − 2)'])
  // Le parentesi dopo il più cadono a fine riga: la riga dopo parte da lì.
  expect(second?.[0] && toText(second[0].before)).toBe(
    '4y³ + 3y + 5 − 2y³ − 2y² − 2y + 2',
  )
})

test('la distributiva dentro una somma evidenzia il prodotto', () => {
  const start = parseLiteralExpression('5a² + 2a(3a + b)')
  const [first] = markedSteps(start, solveLiteral(start).lines)
  expect(first?.map((s) => toText(s.target))).toEqual(['2a(3a + b)'])
})

test('anche la riga della sostituzione', () => {
  const exercise = generate('mono.value', 36)
  const [first] = markedSteps(exercise.expression, expressionLines(exercise))
  expect(first?.[0]?.step.rule).toBe('substitution')
})
