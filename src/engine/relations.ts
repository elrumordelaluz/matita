import {
  finiteSet,
  has,
  isSubset,
  setEquals,
  setToKatex,
  setToText,
  type FiniteSet,
} from './finiteSet.ts'
import { seededRandom, type Random } from './random.ts'
import { setRewriteMessages } from './setAnswer.ts'
import { setExplanation, type SetMisconceptionId } from './setMisconceptions.ts'
import type { Outcome } from './verify.ts'

// Appartenenza e inclusione: un insieme A per elencazione e quattro oggetti
// da confrontare con A, ciascuno con il suo simbolo. Vedi SPEC.md, "Insiemi",
// "Appartenenza e inclusione". Il vuoto non compare fra gli oggetti.

export const relationSymbols = ['∈', '∉', '⊂', '⊆', '⊄', '='] as const
export type RelationSymbol = (typeof relationSymbols)[number]

/**
 * Un oggetto da confrontare con A: un numero, o un insieme non vuoto con gli
 * elementi nell'ordine in cui la consegna li scrive. A stesso compare così,
 * scritto in un altro ordine.
 */
export type RelationObject =
  | { readonly kind: 'number'; readonly value: bigint }
  | { readonly kind: 'set'; readonly elements: readonly bigint[] }

/** Un esercizio la cui risposta è una scelta di simboli, uno per scrittura. */
export interface SymbolsExercise {
  readonly kind: 'symbols'
  readonly skill: 'set.relations'
  readonly seed: number
  readonly generatorVersion: number
  /** L'insieme A, per elencazione. */
  readonly set: FiniteSet
  readonly objects: readonly RelationObject[]
}

export function objectToText(o: RelationObject): string {
  return o.kind === 'number' ? String(o.value) : `{${o.elements.join(', ')}}`
}

export function objectToKatex(o: RelationObject): string {
  return o.kind === 'number'
    ? String(o.value)
    : `\\{${o.elements.join(', ')}\\}`
}

export const symbolKatex: Record<RelationSymbol, string> = {
  '∈': '\\in',
  '∉': '\\notin',
  '⊂': '\\subset',
  '⊆': '\\subseteq',
  '⊄': '\\not\\subset',
  '=': '=',
}

/** A per elencazione: A = {0, 2, 5}. */
export function relationSetText(a: FiniteSet): string {
  return `A = ${setToText(a)}`
}

export function relationSetKatex(a: FiniteSet): string {
  return `A = ${setToKatex(a)}`
}

const asSet = (o: RelationObject & { kind: 'set' }) => finiteSet(o.elements)

/** Il simbolo giusto, il più preciso: ⊆ non lo è mai, perché si sa sempre. */
export function correctSymbol(o: RelationObject, a: FiniteSet): RelationSymbol {
  if (o.kind === 'number') return has(a, o.value) ? '∈' : '∉'
  const x = asSet(o)
  if (setEquals(x, a)) return '='
  return isSubset(x, a) ? '⊂' : '⊄'
}

/** Perché vale il simbolo: la soluzione lo dice a parole. */
export type RelationReason =
  'element' | 'not-element' | 'proper' | 'equal' | 'outside'

export interface RelationLine {
  readonly object: RelationObject
  readonly symbol: RelationSymbol
  readonly reason: RelationReason
  /** Nel ⊄, un elemento dell'oggetto che non sta in A. */
  readonly witness?: bigint
}

const reasons: Record<RelationSymbol, RelationReason> = {
  '∈': 'element',
  '∉': 'not-element',
  '⊂': 'proper',
  '=': 'equal',
  '⊄': 'outside',
  '⊆': 'proper',
}

export function solveRelations({
  set: a,
  objects,
}: SymbolsExercise): RelationLine[] {
  return objects.map((object) => {
    const symbol = correctSymbol(object, a)
    const witness =
      object.kind === 'set' && symbol === '⊄'
        ? object.elements.find((n) => !has(a, n))
        : undefined
    return {
      object,
      symbol,
      reason: reasons[symbol],
      ...(witness !== undefined && { witness }),
    }
  })
}

type Judgement =
  | { readonly kind: 'correct' }
  /** Vera, ma con ⊆ dove si sa se gli insiemi coincidono. */
  | { readonly kind: 'imprecise' }
  | {
      readonly kind: 'wrong'
      readonly misconception: SetMisconceptionId | null
    }

// Lo scambio fra appartenenza e inclusione: ∈ letto come ⊂, ∉ come ⊄.
const asInclusion: Partial<Record<RelationSymbol, readonly RelationSymbol[]>> =
  { '∈': ['⊂', '⊆'], '∉': ['⊄'] }
const asMembership: Partial<Record<RelationSymbol, readonly RelationSymbol[]>> =
  { '⊂': ['∈'], '=': ['∈'], '⊄': ['∉'] }

function judge(
  written: RelationSymbol,
  o: RelationObject,
  a: FiniteSet,
): Judgement {
  const correct = correctSymbol(o, a)
  if (written === correct) return { kind: 'correct' }
  if (written === '⊆' && (correct === '⊂' || correct === '='))
    return { kind: 'imprecise' }
  if (o.kind === 'number' && asInclusion[correct]?.includes(written))
    return { kind: 'wrong', misconception: 'element-as-subset' }
  if (o.kind === 'set' && asMembership[correct]?.includes(written))
    return { kind: 'wrong', misconception: 'subset-as-element' }
  if (written === '⊂' && correct === '=')
    return { kind: 'wrong', misconception: 'proper-subset-of-equal' }
  return { kind: 'wrong', misconception: null }
}

const isSymbol = (s: string): s is RelationSymbol =>
  (relationSymbols as readonly string[]).includes(s)

/** La risposta come la salva il tentativo: i simboli in ordine, `∈,∉,⊂,=`. */
export function readSymbols(
  answer: string,
  count: number,
): RelationSymbol[] | null {
  const symbols = answer.split(',').map((s) => s.trim())
  if (symbols.length !== count || !symbols.every(isSymbol)) return null
  return symbols
}

export function verifySymbols(
  answer: string,
  exercise: SymbolsExercise,
): Outcome {
  const symbols = readSymbols(answer, exercise.objects.length)
  if (!symbols)
    return { kind: 'invalid', message: 'Scegli un simbolo per ogni scrittura.' }
  const judgements = exercise.objects.map((o, i) =>
    judge(symbols[i] ?? '=', o, exercise.set),
  )
  const firstWrong = judgements.find((j) => j.kind === 'wrong')
  if (firstWrong) {
    const id = firstWrong.misconception
    return id
      ? {
          kind: 'misconception',
          misconception: id,
          explanation: setExplanation(id),
        }
      : { kind: 'wrong' }
  }
  if (judgements.some((j) => j.kind === 'imprecise'))
    return {
      kind: 'rewrite',
      reason: 'imprecise-subset',
      message: setRewriteMessages['imprecise-subset'],
    }
  return { kind: 'correct' }
}

// La costruzione: A ha da quattro a sei elementi fino a 12. Gli oggetti sono
// due numeri e due insiemi, in ordine sparso: dentro o fuori da A, un
// sottoinsieme proprio (a volte di un elemento solo, dove ∈ e ⊂ si
// confondono), A stesso in un altro ordine, o un insieme che esce da A.

function shuffled<T>(random: Random, items: readonly T[]): T[] {
  const rest = [...items]
  const out: T[] = []
  while (rest.length > 0) {
    const i = rest.indexOf(random.pick(rest))
    out.push(...rest.splice(i, 1))
  }
  return out
}

const pool = Array.from({ length: 13 }, (_, i) => BigInt(i))

function buildRelations(random: Random): {
  set: FiniteSet
  objects: RelationObject[]
} {
  const elements = shuffled(random, pool).slice(0, Number(random.int(4n, 6n)))
  const a = finiteSet(elements)
  const outside = pool.filter((n) => !has(a, n))
  const inside = a.elements
  const someOf = (from: readonly bigint[], n: number) =>
    shuffled(random, from).slice(0, n)

  const numberObject = (): RelationObject => ({
    kind: 'number',
    value: random.pick(random.pick([inside, outside])),
  })
  const setObjects: (() => RelationObject)[] = [
    () => ({ kind: 'set', elements: someOf(inside, 1) }),
    () => ({
      kind: 'set',
      elements: someOf(
        inside,
        Number(random.int(2n, BigInt(inside.length - 1))),
      ),
    }),
    () => ({ kind: 'set', elements: shuffled(random, inside) }),
    () => ({
      kind: 'set',
      elements: shuffled(random, [
        ...someOf(inside, Number(random.int(1n, 2n))),
        random.pick(outside),
      ]),
    }),
  ]
  const objects = shuffled(random, [
    numberObject(),
    numberObject(),
    random.pick(setObjects)(),
    random.pick(setObjects)(),
  ])
  return { set: a, objects }
}

// Quattro oggetti diversi anche come insiemi, e almeno tre simboli giusti
// diversi: le scritture non si completano tutte allo stesso modo.
function acceptsRelations(a: FiniteSet, objects: readonly RelationObject[]) {
  const values = new Set(
    objects.map((o) =>
      o.kind === 'number' ? String(o.value) : setToText(finiteSet(o.elements)),
    ),
  )
  const symbols = new Set(objects.map((o) => correctSymbol(o, a)))
  return values.size === objects.length && symbols.size >= 3
}

export const relationsVersion = 1

export function generateRelations(seed: number): SymbolsExercise {
  const random = seededRandom(seed)
  for (let i = 0; i < 1000; i++) {
    const { set, objects } = buildRelations(random)
    if (acceptsRelations(set, objects))
      return {
        kind: 'symbols',
        skill: 'set.relations',
        seed,
        generatorVersion: relationsVersion,
        set,
        objects,
      }
  }
  throw new Error('Nessun esercizio valido')
}
