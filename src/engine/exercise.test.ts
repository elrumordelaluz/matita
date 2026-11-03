import { expect, test } from 'vitest'
import { parseExpression } from './expression.ts'
import { generate, numberSkills, type Exercise } from './generators.ts'
import { verify } from './verify.ts'

// Il tipo di risposta (SPEC.md, "Tipi di risposta"): fino al capitolo 4 ogni
// esercizio chiede un numero, e un esercizio senza tipo è di numeri.

test('ogni generatore dei capitoli 1-4 dà un esercizio di numeri', () => {
  expect(numberSkills.length).toBeGreaterThan(0)
  for (const skill of numberSkills)
    expect(generate(skill, 42).kind, skill).toBe('number')
})

test('verifica allo stesso modo con il tipo scritto e senza', () => {
  // 12 − 5 + 3 − 4 = 6
  const untyped: Exercise = {
    skill: 'n.add-sub',
    seed: 1,
    generatorVersion: 1,
    expression: parseExpression('12 − 5 + 3 − 4'),
  }
  const typed: Exercise = { ...untyped, kind: 'number' }
  for (const answer of ['6', '12/2', '14', 'sei'])
    expect(verify(answer, typed), answer).toEqual(verify(answer, untyped))
})
