import { expect, test } from 'vitest'
import { finiteSet } from './finiteSet.ts'
import { generate } from './generators.ts'
import {
  correctSymbol,
  objectToText,
  solveRelations,
  type RelationObject,
  type SymbolsExercise,
} from './relations.ts'
import { verify } from './verify.ts'

// Appartenenza e inclusione: quattro scritture da completare con ∈ ∉ ⊂ ⊆ ⊄ =
// (SPEC.md, "Insiemi", "Appartenenza e inclusione" e "Risposte").

const number = (value: bigint): RelationObject => ({ kind: 'number', value })
const set = (...elements: bigint[]): RelationObject => ({
  kind: 'set',
  elements,
})

// C3 5.14 parte da A = {0, 2, 5}: 0 ∈ A, 5 ∈ A, 3 ∉ A.
function relations(objects: readonly RelationObject[]): SymbolsExercise {
  return {
    kind: 'symbols',
    skill: 'set.relations',
    seed: 1,
    generatorVersion: 1,
    set: finiteSet([0n, 2n, 5n]),
    objects,
  }
}

const exercise = relations([number(2n), number(3n), set(2n), set(5n, 0n, 2n)])

test('davanti a un numero l’appartenenza, davanti a un insieme l’inclusione', () => {
  const a = exercise.set
  expect(exercise.objects.map((o) => correctSymbol(o, a))).toEqual([
    '∈',
    '∉',
    '⊂',
    '=',
  ])
  expect(correctSymbol(set(2n, 7n), a)).toBe('⊄')
})

test('la soluzione scrive una riga per scrittura, con il perché', () => {
  expect(
    solveRelations(exercise).map(
      (line) => `${objectToText(line.object)} ${line.symbol} A: ${line.reason}`,
    ),
  ).toEqual([
    '2 ∈ A: element',
    '3 ∉ A: not-element',
    '{2} ⊂ A: proper',
    '{5, 0, 2} = A: equal',
  ])
})

test('corretto solo se lo sono tutte e quattro', () => {
  expect(verify('∈,∉,⊂,=', exercise)).toEqual({ kind: 'correct' })
})

test('tutte vere ma con un ⊆: da riscrivere con il simbolo più preciso', () => {
  for (const answer of ['∈,∉,⊆,=', '∈,∉,⊂,⊆', '∈,∉,⊆,⊆'])
    expect(verify(answer, exercise), answer).toEqual({
      kind: 'rewrite',
      reason: 'imprecise-subset',
      message: 'È vero, ma c’è un simbolo più preciso.',
    })
})

test('{2} ∈ A al posto di {2} ⊂ A è un errore tipico', () => {
  expect(verify('∈,∉,∈,=', exercise)).toMatchObject({
    kind: 'misconception',
    misconception: 'subset-as-element',
  })
})

test('2 ⊂ A al posto di 2 ∈ A è un errore tipico', () => {
  expect(verify('⊂,∉,⊂,=', exercise)).toMatchObject({
    kind: 'misconception',
    misconception: 'element-as-subset',
  })
})

test('⊂ fra due insiemi uguali è un errore tipico', () => {
  expect(verify('∈,∉,⊂,⊂', exercise)).toMatchObject({
    kind: 'misconception',
    misconception: 'proper-subset-of-equal',
  })
})

test('si giudica dalla prima scrittura sbagliata', () => {
  // La prima sbagliata è 3 ∈ A, senza spiegazione nota; poi viene un errore
  // tipico, che non conta.
  expect(verify('∈,∈,∈,=', exercise)).toEqual({ kind: 'wrong' })
  // Un ⊆ prima della scrittura sbagliata non salva la risposta.
  expect(verify('∈,∉,⊆,⊂', exercise)).toMatchObject({
    misconception: 'proper-subset-of-equal',
  })
})

test('senza un simbolo per ogni scrittura la risposta non è valida', () => {
  for (const answer of ['∈,∉,⊂', '∈,,⊂,=', '∈,∉,⊂,x'])
    expect(verify(answer, exercise), answer).toEqual({
      kind: 'invalid',
      message: 'Scegli un simbolo per ogni scrittura.',
    })
})

test('il generatore dà quattro oggetti diversi, numeri e insiemi non vuoti', () => {
  for (let seed = 0; seed < 300; seed++) {
    const { set: a, objects } = generate('set.relations', seed)
    expect(objects).toHaveLength(4)
    const texts = objects.map(objectToText)
    expect(new Set(texts).size, texts.join()).toBe(4)
    expect(objects.some((o) => o.kind === 'number')).toBe(true)
    expect(objects.some((o) => o.kind === 'set')).toBe(true)
    for (const o of objects)
      if (o.kind === 'set') expect(o.elements.length).toBeGreaterThan(0)
    const symbols = new Set(objects.map((o) => correctSymbol(o, a)))
    expect(symbols.size, texts.join()).toBeGreaterThanOrEqual(3)
  }
})
