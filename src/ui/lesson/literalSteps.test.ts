import { expect, test } from 'vitest'
import { generate, type PolynomialSkill } from '../../engine/index.ts'
import { solutionOf } from '../exerciseView.tsx'
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
]

test('ogni passaggio di un esercizio dei monomi ha il suo pezzo evidenziato', () => {
  for (const skill of skills)
    for (let seed = 0; seed < 60; seed++) {
      const exercise = generate(skill, seed)
      const marked = markedSteps(
        exercise.expression,
        solutionOf(exercise).lines,
      )
      for (const step of marked.flat())
        expect(step.tex, `${skill} ${seed}`).toContain('\\htmlClass')
    }
})

test('anche la riga della sostituzione', () => {
  const exercise = generate('mono.value', 36)
  const [first] = markedSteps(exercise.expression, solutionOf(exercise).lines)
  expect(first?.[0]?.step.rule).toBe('substitution')
})
