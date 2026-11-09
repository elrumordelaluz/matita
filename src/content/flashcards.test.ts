import katex from 'katex'
import { expect, test } from 'vitest'
import { chapters } from './chapters.ts'
import { flashcardProblems, flashcards, type Flashcard } from './flashcards.ts'
import { skills } from './skills.ts'

// Un mazzo valido: cinque carte per capitolo, ciascuna senza abilità.
const valid: Flashcard[] = chapters.flatMap((c) =>
  [1, 2, 3, 4, 5].map((n) => ({
    id: `${c.id}.card-${n}`,
    chapter: c.id,
    front: 'davanti',
    back: 'dietro',
  })),
)

const problems = (extra: Flashcard[], base = valid) =>
  flashcardProblems([...base, ...extra], skills)

test('i dati veri non hanno problemi', () => {
  expect(flashcardProblems(flashcards, skills)).toEqual([])
})

test('ogni capitolo ha almeno cinque flashcard', () => {
  for (const c of chapters)
    expect(flashcards.filter((f) => f.chapter === c.id).length).toBeGreaterThan(
      4,
    )
})

test('un mazzo valido, anche con abilità del proprio capitolo, passa', () => {
  expect(problems([])).toEqual([])
  expect(
    problems([
      {
        id: 'pow.with-skill',
        chapter: 'pow',
        skill: 'pow.basics',
        front: 'a',
        back: 'b',
      },
    ]),
  ).toEqual([])
})

test('un id ripetuto è segnalato', () => {
  expect(
    problems([{ id: 'n.card-1', chapter: 'n', front: 'a', back: 'b' }]),
  ).toEqual(['Duplicate flashcard id: n.card-1'])
})

test('un’abilità che non esiste è segnalata', () => {
  expect(
    problems([
      {
        id: 'n.ghost',
        chapter: 'n',
        skill: 'n.nothing',
        front: 'a',
        back: 'b',
      },
    ]),
  ).toEqual(['Flashcard n.ghost names an unknown skill: n.nothing'])
})

test('un’abilità di un altro capitolo è segnalata', () => {
  expect(
    problems([
      { id: 'n.far', chapter: 'n', skill: 'z.add-sub', front: 'a', back: 'b' },
    ]),
  ).toEqual(['Flashcard n.far names a skill of another chapter: z.add-sub'])
})

test('un id che non comincia con il capitolo è segnalato', () => {
  expect(
    problems([{ id: 'z.stray', chapter: 'n', front: 'a', back: 'b' }]),
  ).toEqual(['Flashcard z.stray does not start with its chapter id: n.'])
})

test('un capitolo con meno di cinque flashcard è segnalato', () => {
  expect(
    problems(
      [],
      valid.filter((f) => f.id !== 'q.card-5'),
    ),
  ).toEqual(['Chapter q has 4 flashcards, at least 5 needed'])
})

test('un lato vuoto è segnalato', () => {
  expect(
    problems([
      { id: 'n.blank-front', chapter: 'n', front: ' ', back: 'b' },
      { id: 'n.blank-back', chapter: 'n', front: 'a', back: '' },
    ]),
  ).toEqual([
    'Flashcard n.blank-front has an empty front',
    'Flashcard n.blank-back has an empty back',
  ])
})

test('ogni formula dei dati veri si rende con KaTeX', () => {
  for (const card of flashcards)
    for (const side of [card.front, card.back])
      side
        .split('$')
        .filter((_, i) => i % 2 === 1)
        .forEach((tex) =>
          expect(
            () => katex.renderToString(tex, { throwOnError: true }),
            `${card.id}: ${tex}`,
          ).not.toThrow(),
        )
})
