import { expect, test } from 'vitest'
import { setToText } from './finiteSet.ts'
import { generate } from './generators.ts'
import { solveSet, type SetExercise } from './setExercise.ts'
import { propertyToText, rosterOf, type Property } from './setRoster.ts'
import { verify } from './verify.ts'

// Il tipo di risposta "insieme" e l'abilità set.roster (SPEC.md, "Insiemi").

function roster(property: Property): SetExercise {
  return {
    kind: 'set',
    skill: 'set.roster',
    seed: 1,
    generatorVersion: 1,
    task: { kind: 'roster', property },
  }
}

// C3 5.16b: B = {x ∈ N | 2 ≤ x < 5}.
const c3 = roster({
  lower: { value: 2n, strict: false },
  upper: { value: 5n, strict: true },
})
const evenBelow7 = roster({
  upper: { value: 7n, strict: true },
  filter: { kind: 'even' },
})
// Nessun dispari minore di 1: l'insieme vuoto.
const none = roster({
  upper: { value: 1n, strict: true },
  filter: { kind: 'odd' },
})

test('la soluzione è una riga con gli elementi in ordine crescente', () => {
  const solution = solveSet(c3)
  expect(solution.lines).toHaveLength(1)
  expect(setToText(solution.result)).toBe('{2, 3, 4}')
})

test('l’ordine della risposta non conta', () => {
  expect(verify('{2, 3, 4}', c3)).toEqual({ kind: 'correct' })
  expect(verify('{4, 2, 3}', c3)).toEqual({ kind: 'correct' })
})

test('il vuoto si accetta come ∅ e come {}', () => {
  expect(verify('∅', none)).toEqual({ kind: 'correct' })
  expect(verify('{}', none)).toEqual({ kind: 'correct' })
})

test('graffe mancanti e doppioni vanno riscritti, prima le graffe', () => {
  expect(verify('2, 3, 4', c3)).toEqual({
    kind: 'rewrite',
    reason: 'missing-braces',
    message: 'Un insieme si scrive fra graffe.',
  })
  expect(verify('2, 3, 3, 4', c3)).toMatchObject({ reason: 'missing-braces' })
  expect(verify('{2, 3, 3, 4}', c3)).toEqual({
    kind: 'rewrite',
    reason: 'repeated-element',
    message: 'Ogni elemento si scrive una volta sola.',
  })
})

test('un elemento non naturale non è valido', () => {
  expect(verify('{2, -3, 4}', c3)).toEqual({
    kind: 'invalid',
    message: 'Gli elementi sono numeri naturali.',
  })
})

test('una forma da riscrivere con il valore sbagliato si giudica dal valore', () => {
  expect(verify('{2, 3, 3}', c3)).toEqual({ kind: 'wrong' })
})

test('il < letto come ≤ è un errore tipico', () => {
  expect(verify('{2, 3, 4, 5}', c3)).toMatchObject({
    kind: 'misconception',
    misconception: 'bound-inclusion-swapped',
  })
})

test('lo zero escluso dai pari è un errore tipico', () => {
  expect(verify('{2, 4, 6}', evenBelow7)).toMatchObject({
    kind: 'misconception',
    misconception: 'zero-not-even',
  })
})

test('dove la risposta è ∅, {0}, {∅} e 0 sono errori tipici', () => {
  for (const answer of ['{0}', '{∅}', '0'])
    expect(verify(answer, none), answer).toMatchObject({
      kind: 'misconception',
      misconception: 'empty-set-has-elements',
    })
})

test('{∅} dove la risposta non è ∅ è sbagliato, mai non valido', () => {
  expect(verify('{∅}', c3)).toEqual({ kind: 'wrong' })
})

test('il generatore di set.roster rispetta i vincoli', () => {
  for (let seed = 0; seed < 300; seed++) {
    const exercise = generate('set.roster', seed)
    expect(exercise.kind).toBe('set')
    if (exercise.task.kind !== 'roster') throw new Error('Non è un’elencazione')
    const { elements } = rosterOf(exercise.task.property)
    const text = propertyToText(exercise.task.property)
    expect(elements.length, text).toBeGreaterThanOrEqual(2)
    expect(elements.length, text).toBeLessThanOrEqual(8)
    expect(
      elements.every((n) => n <= 30n),
      text,
    ).toBe(true)
  }
})

test('stesso seme, stesso esercizio', () => {
  expect(generate('set.roster', 7)).toEqual(generate('set.roster', 7))
})
