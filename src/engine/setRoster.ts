import { finiteSet, setEquals, type FiniteSet } from './finiteSet.ts'
import type { Random } from './random.ts'
import type { SetMisconceptionId } from './setMisconceptions.ts'

// Un insieme per proprietà caratteristica, `{x ∈ N | x < 7 e x è pari}`, e
// la sua elencazione. Vedi SPEC.md, "Insiemi": la condizione si scrive a
// parole, come in Matematica C3, con al più due estremi e una proprietà.

export interface Bound {
  readonly value: bigint
  /** `<` se vero, `≤` se falso. */
  readonly strict: boolean
}

export type Filter =
  | { readonly kind: 'even' }
  | { readonly kind: 'odd' }
  | { readonly kind: 'multiple'; readonly of: bigint }
  | { readonly kind: 'divisor'; readonly of: bigint }

/** La condizione su x. È finita: ha un estremo superiore o un divisore. */
export interface Property {
  readonly lower?: Bound
  readonly upper?: Bound
  readonly filter?: Filter
}

// Le regole con cui si legge la condizione: quella giusta, o una variante
// sbagliata (SPEC.md, "Errori tipici").
interface Reading {
  /** Gli estremi letti con il `<` e il `≤` scambiati. */
  readonly swapped?: readonly ('lower' | 'upper')[]
  /** N comincia da 1. */
  readonly noZero?: boolean
  /** Lo zero non è pari, né multiplo di qualcosa. */
  readonly zeroNotEven?: boolean
}

function limitOf(p: Property): bigint {
  if (p.upper) return p.upper.value
  if (p.filter?.kind === 'divisor') return p.filter.of
  throw new RangeError('Una proprietà senza limite superiore')
}

function satisfies(x: bigint, p: Property, reading: Reading): boolean {
  const swap = (side: 'lower' | 'upper', strict: boolean) =>
    reading.swapped?.includes(side) ? !strict : strict
  if (reading.noZero && x === 0n) return false
  if (p.lower) {
    const strict = swap('lower', p.lower.strict)
    if (strict ? x <= p.lower.value : x < p.lower.value) return false
  }
  if (p.upper) {
    const strict = swap('upper', p.upper.strict)
    if (strict ? x >= p.upper.value : x > p.upper.value) return false
  }
  const f = p.filter
  if (!f) return true
  switch (f.kind) {
    case 'even':
      return x % 2n === 0n && !(reading.zeroNotEven && x === 0n)
    case 'odd':
      return x % 2n === 1n
    case 'multiple':
      return x % f.of === 0n && !(reading.zeroNotEven && x === 0n)
    case 'divisor':
      return x > 0n && f.of % x === 0n
  }
}

function read(p: Property, reading: Reading): FiniteSet {
  const elements: bigint[] = []
  for (let x = 0n; x <= limitOf(p); x++)
    if (satisfies(x, p, reading)) elements.push(x)
  return finiteSet(elements)
}

/** L'elencazione dell'insieme, in ordine crescente. */
export function rosterOf(p: Property): FiniteSet {
  return read(p, {})
}

/**
 * Gli insiemi che dà la condizione letta con una regola sbagliata, con
 * l'errore che li spiega, dal più preciso. Ognuno è diverso dalla risposta
 * giusta: un errore che non cambia niente non si vede.
 */
export function rosterWrongResults(
  p: Property,
): { readonly id: SetMisconceptionId; readonly value: FiniteSet }[] {
  const zeroCounts = p.filter?.kind === 'even' || p.filter?.kind === 'multiple'
  const sides = (['lower', 'upper'] as const).filter((s) => p[s])
  const readings: [SetMisconceptionId, Reading][] = [
    ...(zeroCounts
      ? [
          ['zero-not-even', { zeroNotEven: true }] as [
            SetMisconceptionId,
            Reading,
          ],
        ]
      : []),
    ['natural-without-zero', { noZero: true }],
    ...sides.map((side): [SetMisconceptionId, Reading] => [
      'bound-inclusion-swapped',
      { swapped: [side] },
    ]),
    ...(sides.length > 1
      ? [
          ['bound-inclusion-swapped', { swapped: sides }] as [
            SetMisconceptionId,
            Reading,
          ],
        ]
      : []),
  ]
  const correct = rosterOf(p)
  return readings
    .map(([id, reading]) => ({ id, value: read(p, reading) }))
    .filter(({ value }) => !setEquals(value, correct))
}

const lessThan = (b: Bound, text: boolean) =>
  b.strict ? '<' : text ? '≤' : '\\le'

function conditions(p: Property, text: boolean): string[] {
  const parts: string[] = []
  const { lower, upper } = p
  if (lower && upper)
    parts.push(
      `${lower.value} ${lessThan(lower, text)} x ${lessThan(upper, text)} ${upper.value}`,
    )
  else if (upper) parts.push(`x ${lessThan(upper, text)} ${upper.value}`)
  else if (lower)
    parts.push(`x ${lower.strict ? '>' : text ? '≥' : '\\ge'} ${lower.value}`)
  const f = p.filter
  if (f) {
    const words =
      f.kind === 'even'
        ? 'è pari'
        : f.kind === 'odd'
          ? 'è dispari'
          : f.kind === 'multiple'
            ? `è multiplo di ${f.of}`
            : `è divisore di ${f.of}`
    parts.push(text ? `x ${words}` : `x \\text{ ${words}}`)
  }
  return parts
}

export function propertyToText(p: Property): string {
  return `{x ∈ N | ${conditions(p, true).join(' e ')}}`
}

export function propertyToKatex(p: Property): string {
  return `\\{x \\in \\mathbb{N} \\mid ${conditions(p, false).join(' \\text{ e } ')}\\}`
}

// Divisori di cui l'elencazione resta entro otto elementi.
const dividends = [6n, 8n, 10n, 12n, 15n, 16n, 18n, 20n, 21n, 24n, 28n, 30n]

const bound = (random: Random, value: bigint): Bound => ({
  value,
  strict: random.pick([true, false]),
})

/**
 * Una proprietà da elencare. I vincoli (elementi fino a 30, da due a otto,
 * un errore tipico che si vede) li controlla `acceptsRoster`: la costruzione
 * li rende probabili, il controllo li garantisce.
 */
export function buildProperty(random: Random): Property {
  const kind = random.pick([
    'none',
    'even',
    'odd',
    'multiple',
    'divisor',
  ] as const)
  if (kind === 'divisor') {
    const of = random.pick(dividends)
    const upper = random.pick([true, false, false])
      ? bound(random, random.int(4n, of - 1n))
      : undefined
    return { filter: { kind, of }, ...(upper && { upper }) }
  }
  const upper = bound(random, random.int(4n, 30n))
  // Senza proprietà l'intervallo è corto; con una, può allargarsi.
  const span = kind === 'none' ? 7n : 15n
  const lower =
    upper.value > span || random.pick([true, false])
      ? bound(
          random,
          random.int(
            upper.value > span ? upper.value - span : 1n,
            upper.value - 2n,
          ),
        )
      : undefined
  const filter: Filter | undefined =
    kind === 'none'
      ? undefined
      : kind === 'multiple'
        ? { kind, of: random.int(3n, 6n) }
        : { kind }
  return { upper, ...(lower && { lower }), ...(filter && { filter }) }
}

/** Fra due e otto elementi, e almeno un errore tipico che si vede. */
export function acceptsRoster(p: Property): boolean {
  const size = rosterOf(p).elements.length
  return size >= 2 && size <= 8 && rosterWrongResults(p).length > 0
}
