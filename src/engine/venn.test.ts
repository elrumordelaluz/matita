import { expect, test } from 'vitest'
import { toText } from './expression.ts'
import { generate } from './generators.ts'
import {
  quantityName,
  quantities,
  regionsKnownAfter,
  solveVenn,
  vennAnswer,
  type ProblemExercise,
  type VennProblem,
} from './venn.ts'
import { problemText } from './venn.ts'
import { verify } from './verify.ts'

// I problemi con due insiemi e il diagramma di Eulero-Venn (SPEC.md,
// "Insiemi", "Problemi"). Le regioni: nessuno, solo A, solo B, entrambi.

const two = quantities(2)

function exercise(problem: VennProblem): ProblemExercise {
  return {
    kind: 'problem',
    skill: 'set.venn2',
    seed: 1,
    generatorVersion: 1,
    problem,
  }
}

// C3, Esempio 5.36: classe di 28, 17 inglese, 12 francese, 5 entrambi.
// Quanti non frequentano nessun corso?
const c3536 = exercise({
  setting: 'languages',
  regions: [4n, 12n, 7n, 5n],
  data: [two.total, two.atLeast(0), two.atLeast(1), two.region(3)],
  asked: two.region(0),
})

// C3 5.84: classe di 28, 18 teatro, 22 fotografia, 3 nessun laboratorio.
// Quanti seguono entrambi?
const c3584 = exercise({
  setting: 'workshops',
  regions: [3n, 3n, 7n, 15n],
  data: [two.total, two.atLeast(0), two.atLeast(1), two.region(0)],
  asked: two.region(3),
})

function rows(e: ProblemExercise) {
  return solveVenn(e.problem).map(
    (row) =>
      `${row.name} = ${[toText(row.expression), ...row.solution.lines.map((l) => toText(l.expression))].join(' = ')}`,
  )
}

test('il testo nasce dai modelli di frase', () => {
  expect(problemText(c3536.problem)).toBe(
    'In una classe di 28 studenti, 17 studiano inglese, 12 studiano francese e 5 studiano entrambe le lingue. Quanti non studiano nessuna delle due lingue?',
  )
})

test('con due insiemi la strada della formula è quella del libro', () => {
  // C3 5.36: 17 + 12 − 5 = 24, 28 − 24 = 4.
  expect(rows(c3536)).toEqual([
    'almeno uno = 17 + 12 − 5 = 24',
    'nessuno = 28 − 24 = 4',
  ])
  expect(vennAnswer(c3536.problem)).toBe(4n)
})

test('una riga trova l’unione quando il testo dà il totale e nessuno', () => {
  // C3 5.84: 28 − 3 = 25, poi 18 + 22 − 25 = 15.
  expect(rows(c3584)).toEqual([
    'almeno uno = 28 − 3 = 25',
    'entrambi = 18 + 22 − 25 = 15',
  ])
})

test('ogni riga è svolta dal risolutore del capitolo 1, con i passaggi', () => {
  const [first] = solveVenn(c3536.problem)
  expect(
    first?.solution.lines
      .flatMap((l) => l.steps)
      .map((s) => `${toText(s.operation)} = ${toText(s.outcome)}`),
  ).toEqual(['17 + 12 = 29', '29 − 5 = 24'])
})

test('le regioni si riempiono nell’ordine delle righe, dopo i dati', () => {
  const names = (regions: readonly number[]) =>
    regions.map((r) => quantityName(two.region(r), 2, ['inglese', 'francese']))
  // I dati danno subito "entrambi"; la seconda riga trova "nessuno".
  expect(names(regionsKnownAfter(c3536.problem, 0))).toEqual(['entrambi'])
  expect(names(regionsKnownAfter(c3536.problem, 1))).toEqual(['entrambi'])
  expect(names(regionsKnownAfter(c3536.problem, 2))).toEqual([
    'entrambi',
    'nessuno',
  ])
  expect(names(regionsKnownAfter(c3584.problem, 2))).toEqual([
    'nessuno',
    'entrambi',
  ])
})

test('nell’ordine del quaderno: intersezione, solo A, solo B, esterno', () => {
  // Dati: totale 40, solo A 9, A 15, B 20. Si chiede quanti sono fuori.
  const e = exercise({
    setting: 'sports',
    regions: [11n, 9n, 14n, 6n],
    data: [two.total, two.region(1), two.atLeast(0), two.atLeast(1)],
    asked: two.region(0),
  })
  expect(rows(e)).toEqual([
    'entrambi = 15 − 9 = 6',
    'solo nuoto = 20 − 6 = 14',
    'nessuno = 40 − (9 + 14 + 6) = 40 − 29 = 11',
  ])
})

test('una domanda che somma più regioni finisce con la somma', () => {
  const e = exercise({
    setting: 'languages',
    regions: [4n, 12n, 7n, 5n],
    data: [two.total, two.atLeast(0), two.atLeast(1), two.region(3)],
    asked: two.exactlyOne,
  })
  expect(rows(e).at(-1)).toBe('uno solo = 12 + 7 = 19')
})

test('la risposta è un numero', () => {
  expect(verify('4', c3536)).toEqual({ kind: 'correct' })
  expect(verify('8/2', c3536)).toMatchObject({ kind: 'rewrite' })
  expect(verify('7', c3536)).toEqual({ kind: 'wrong' })
})

test('l’intersezione contata due volte è un errore tipico', () => {
  // 17 + 12 = 29 al posto di 24: nessuno = 28 − 29, che non si può.
  const union = exercise({ ...c3536.problem, asked: two.union })
  expect(verify('29', exercise(union.problem))).toMatchObject({
    kind: 'misconception',
    misconception: 'intersection-counted-twice',
  })
})

test('la regione esterna dimenticata è un errore tipico', () => {
  // La risposta a "nessuno" è quella di "almeno uno".
  expect(verify('24', c3536)).toMatchObject({
    kind: 'misconception',
    misconception: 'outside-forgotten',
  })
})

test('"solo A" letto come "almeno A" è un errore tipico', () => {
  const onlyA = exercise({ ...c3536.problem, asked: two.region(1) })
  expect(verify('17', onlyA)).toMatchObject({
    kind: 'misconception',
    misconception: 'only-as-at-least',
  })
  expect(verify('12', onlyA)).toEqual({ kind: 'correct' })
})

test('il generatore scarta i problemi senza una riga a un’incognita', () => {
  for (let seed = 0; seed < 200; seed++) {
    const { problem } = generate('set.venn2', seed)
    const text = problemText(problem) ?? 'senza testo'
    expect(problem.regions).toHaveLength(4)
    const total = problem.regions.reduce((a, b) => a + b, 0n)
    expect(total, text).toBeLessThanOrEqual(60n)
    for (const r of problem.regions) expect(r, text).toBeLessThanOrEqual(30n)
    const lines = solveVenn(problem)
    expect(lines.length, text).toBeGreaterThanOrEqual(2)
    expect(lines.at(-1)?.found, text).toBe(problem.asked)
    expect(problem.data, text).not.toContain(problem.asked)
  }
})

test('stesso seme, stesso problema', () => {
  expect(problemText(generate('set.venn2', 9).problem)).toEqual(
    problemText(generate('set.venn2', 9).problem),
  )
})
