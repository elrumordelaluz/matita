import { expect, test } from 'vitest'
import { toText } from './expression.ts'
import { generate } from './generators.ts'
import {
  problemText,
  quantities,
  quantityName,
  regionsKnownAfter,
  solveVenn,
  vennAnswer,
  type ProblemExercise,
  type VennProblem,
} from './venn.ts'
import { verify } from './verify.ts'

// I problemi con tre insiemi (SPEC.md, "Insiemi", "Problemi"): otto
// regioni, e il quaderno le riempie dal centro verso l'esterno.

const three = quantities(3)

function exercise(problem: VennProblem): ProblemExercise {
  return {
    kind: 'problem',
    skill: 'set.venn3',
    seed: 1,
    generatorVersion: 1,
    problem,
  }
}

// La regione r ha il bit i se sta nell'insieme i: 1 solo il primo, 3 solo
// il primo e il secondo, 7 il centro.

// C3 5.81: 12 almeno ballato, 8 almeno cantato, 16 almeno recitato; 5
// ballato e cantato, 3 cantato e recitato, 8 ballato e recitato, 2 tutto.
// Quanti componenti?
const c3581 = exercise({
  setting: 'company',
  regions: [0n, 1n, 2n, 3n, 7n, 6n, 1n, 2n],
  data: [
    three.atLeast(0),
    three.atLeast(1),
    three.atLeast(2),
    three.atLeastBoth(0, 1),
    three.atLeastBoth(1, 2),
    three.atLeastBoth(0, 2),
    three.region(7),
  ],
  asked: three.union,
})

// C3 5.78: 98 iscritti a Salsa, Hip Hop, Break; 6 tutti e tre, 37 Salsa, 15
// solo Salsa e Hip Hop, 7 solo Salsa e Break, 9 almeno Hip Hop e Break, 28
// Salsa o Break ma non Hip Hop. Quanti solo Hip Hop?
const c3578 = exercise({
  setting: 'dance',
  regions: [0n, 9n, 46n, 15n, 12n, 7n, 3n, 6n],
  data: [
    three.union,
    three.region(7),
    three.atLeast(0),
    three.region(3),
    three.region(5),
    three.atLeastBoth(1, 2),
    three.eitherButNot(0, 2, 1),
  ],
  asked: three.region(2),
})

function rows(e: ProblemExercise) {
  return solveVenn(e.problem).map(
    (row) =>
      `${row.name} = ${[toText(row.expression), ...row.solution.lines.map((l) => toText(l.expression))].join(' = ')}`,
  )
}

test('il testo nasce dai modelli di frase', () => {
  expect(problemText(c3578.problem)).toBe(
    'Una scuola di danza ha 98 iscritti, ognuno a uno o più corsi fra Salsa, Hip Hop e Break: 6 seguono tutti e tre i corsi, 37 seguono almeno Salsa, 15 seguono solo Salsa e Hip Hop, 7 seguono solo Salsa e Break, 9 seguono almeno Hip Hop e Break e 28 seguono Salsa o Break ma non Hip Hop. Quanti seguono solo Hip Hop?',
  )
})

test('dal centro: le tre regioni di solo due, poi le tre di solo uno', () => {
  // C3 5.81: 12 + 8 + 16 − 5 − 3 − 8 + 2 = 22, regione per regione.
  expect(rows(c3581)).toEqual([
    'solo ballo e canto = 5 − 2 = 3',
    'solo ballo e recitazione = 8 − 2 = 6',
    'solo canto e recitazione = 3 − 2 = 1',
    'solo ballo = 12 − (3 + 6 + 2) = 12 − 11 = 1',
    'solo canto = 8 − (3 + 1 + 2) = 8 − 6 = 2',
    'solo recitazione = 16 − (6 + 1 + 2) = 16 − 9 = 7',
    'almeno uno = 1 + 2 + 3 + 7 + 6 + 1 + 2 = 22',
  ])
  expect(vennAnswer(c3581.problem)).toBe(22n)
})

test('una riga può andare all’indietro da un dato, e lo dice', () => {
  // C3 5.78: da "Salsa o Break ma non Hip Hop" si ricava solo Break.
  const solution = solveVenn(c3578.problem)
  expect(rows(c3578)).toEqual([
    'solo Hip Hop e Break = 9 − 6 = 3',
    'solo Salsa = 37 − (15 + 7 + 6) = 37 − 28 = 9',
    'solo Break = 28 − (9 + 7) = 28 − 16 = 12',
    'solo Hip Hop = 98 − (9 + 15 + 12 + 7 + 3 + 6) = 98 − 52 = 46',
  ])
  expect(solution.map((r) => r.backwards)).toEqual([
    null,
    null,
    'Salsa o Break ma non Hip Hop',
    null,
  ])
  expect(vennAnswer(c3578.problem)).toBe(46n)
})

test('le regioni si riempiono nell’ordine del quaderno', () => {
  const words = ['ballo', 'canto', 'recitazione']
  const filled = regionsKnownAfter(c3581.problem, 6).map((r) =>
    quantityName(three.region(r), 3, words),
  )
  expect(filled).toEqual([
    'tutti e tre',
    'solo ballo e canto',
    'solo ballo e recitazione',
    'solo canto e recitazione',
    'solo ballo',
    'solo canto',
    'solo recitazione',
  ])
})

test('il centro non riaggiunto è un errore tipico', () => {
  // 12 + 8 + 16 − 5 − 3 − 8 = 20, senza il + 2.
  expect(verify('20', c3581)).toMatchObject({
    kind: 'misconception',
    misconception: 'centre-not-added-back',
  })
  expect(verify('22', c3581)).toEqual({ kind: 'correct' })
})

test('"solo A e B" letto come "almeno A e B" è un errore tipico', () => {
  const onlyPair = exercise({ ...c3581.problem, asked: three.region(3) })
  expect(verify('5', onlyPair)).toMatchObject({
    misconception: 'only-as-at-least',
  })
})

test('il generatore di set.venn3 dà problemi con una riga a un’incognita', () => {
  for (let seed = 0; seed < 60; seed++) {
    const { problem } = generate('set.venn3', seed)
    const text = problemText(problem) ?? 'senza testo'
    expect(problem.regions, text).toHaveLength(8)
    const total = problem.regions.reduce((a, b) => a + b, 0n)
    expect(total, text).toBeLessThanOrEqual(60n)
    const lines = solveVenn(problem)
    expect(lines.length, text).toBeGreaterThanOrEqual(3)
    expect(lines.at(-1)?.found, text).toBe(problem.asked)
  }
})
