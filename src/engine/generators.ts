import {
  binary,
  group,
  num,
  type Bracket,
  type Expression,
  type Operator,
} from './expression.ts'
import { isVisible, type MisconceptionId } from './misconceptions.ts'
import { basicPowers, powerProperties } from './powerGenerators.ts'
import { seededRandom, type Random } from './random.ts'
import { solve } from './solver.ts'

// Un generatore per abilità: dal seme all'esercizio, con i vincoli del
// capitolo dentro. Cambiare cosa produce un seme richiede di alzare la
// versione, perché i tentativi salvati ricostruiscono l'esercizio dal seme.

export interface Exercise {
  readonly skill: GeneratedSkill
  readonly seed: number
  readonly generatorVersion: number
  readonly expression: Expression
}

interface Generator {
  readonly version: number
  build(random: Random): Expression
  /**
   * Gli errori tipici che l'esercizio deve far vedere: con la regola
   * sbagliata il valore deve cambiare, altrimenti l'errore passa per giusto.
   */
  readonly shows?: readonly MisconceptionId[]
}

const maxAttempts = 1000

// In N i numeri scritti e i fattori restano nel calcolo mentale.
const factorMax = 20n
const productMax = 100n

interface Built {
  readonly expression: Expression
  readonly value: bigint
}

// I divisori utili: dividere per sé stesso dà 1 e non allena niente.
function divisors(n: bigint): bigint[] {
  const ds: bigint[] = []
  for (let d = 2n; d < n && d <= factorMax; d++) if (n % d === 0n) ds.push(d)
  return ds
}

// Una catena di × e : con `count` fattori. Ogni numero si sceglie conoscendo
// il risultato parziale, così ogni divisione è esatta e il prodotto resta
// entro `productMax`.
function productChain(random: Random, count: number): Built {
  let value = random.int(2n, factorMax)
  let expression = num(value)
  for (let i = 1; i < count; i++) {
    const options: Operator[] = []
    if (value * 2n <= productMax) options.push('×')
    if (divisors(value).length > 0) options.push(':')
    const op = random.pick(options)
    const n =
      op === '×'
        ? random.int(2n, min(factorMax, productMax / value))
        : random.pick(divisors(value))
    value = op === '×' ? value * n : value / n
    expression = binary(op, expression, num(n))
  }
  return { expression, value }
}

// Una somma algebrica di termini, con ogni sottrazione possibile in N.
function sumOf(terms: readonly Built[], random: Random): Built {
  const [first, ...rest] = terms
  if (!first) throw new RangeError('Nessun termine')
  let { expression, value } = first
  for (const term of rest) {
    const op = term.value > value ? '+' : random.pick(['+', '-'] as const)
    value = op === '+' ? value + term.value : value - term.value
    expression = binary(op, expression, term.expression)
  }
  return { expression, value }
}

function literal(random: Random): Built {
  const value = random.int(1n, factorMax)
  return { expression: num(value), value }
}

// Un termine senza gruppi: un numero o un prodotto di due fattori.
function simpleTerm(random: Random): Built {
  return random.pick([true, false]) ? literal(random) : productChain(random, 2)
}

// Un termine che contiene il gruppo `g`: da solo, come fattore, come
// dividendo o come divisore. Il valore del gruppo decide quali vanno bene.
function termWith(random: Random, g: Built): Built {
  const { value } = g
  const make = (op: Operator, left: Built, right: Built): Built => ({
    expression: binary(op, left.expression, right.expression),
    value: op === '×' ? left.value * right.value : left.value / right.value,
  })
  const number = (n: bigint): Built => ({ expression: num(n), value: n })
  const options: (() => Built)[] = [() => g]
  if (value >= 2n && value <= factorMax && value * 2n <= productMax) {
    const factor = () =>
      number(random.int(2n, min(factorMax, productMax / value)))
    options.push(() => make('×', g, factor()))
    options.push(() => make('×', factor(), g))
  }
  const ds = divisors(value)
  if (ds.length > 0) options.push(() => make(':', g, number(random.pick(ds))))
  if (value >= 2n && value * 2n <= factorMax)
    options.push(() =>
      make(':', number(value * random.int(2n, factorMax / value)), g),
    )
  return random.pick(options)()
}

// Le tonde non contengono gruppi, le quadre contengono tonde, le graffe
// contengono quadre: la parentesi dipende da quanti livelli ha dentro.
function bracketFor(height: number): Bracket {
  if (height === 0) return 'round'
  if (height === 1) return 'square'
  return 'curly'
}

function groupOf(random: Random, height: number): Built {
  const inner =
    height === 0
      ? sumOf([simpleTerm(random), simpleTerm(random)], random)
      : sumWithGroups(
          random,
          height - 1,
          height === 1 ? random.int(1n, 2n) : 1n,
        )
  return {
    expression: group(bracketFor(height), inner.expression),
    value: inner.value,
  }
}

// Una somma algebrica di `count` termini con un gruppo di altezza `height`
// e un termine semplice, messo in una posizione a caso.
function sumWithGroups(random: Random, height: number, count: bigint): Built {
  const terms = Array.from({ length: Number(count) }, () =>
    termWith(random, groupOf(random, height)),
  )
  terms.splice(Number(random.int(0n, count)), 0, simpleTerm(random))
  return sumOf(terms, random)
}

const generators = {
  'n.add-sub': {
    version: 1,
    build(random) {
      const count = Number(random.int(3n, 5n))
      let total = random.int(1n, 50n)
      let tree = num(total)
      for (let i = 1; i < count; i++) {
        const op = total === 0n ? '+' : random.pick(['+', '-'] as const)
        const n =
          op === '+' ? random.int(1n, 50n) : random.int(1n, min(total, 50n))
        total = op === '+' ? total + n : total - n
        tree = binary(op, tree, num(n))
      }
      return tree
    },
  },
  'n.mul-div': {
    version: 1,
    build(random) {
      return productChain(random, Number(random.int(3n, 4n))).expression
    },
  },
  'n.order': {
    version: 1,
    build(random) {
      const count = Number(random.int(2n, 3n))
      const products = Array.from({ length: count }, () =>
        random.pick([true, false]),
      )
      if (!products.includes(true))
        products[Number(random.int(0n, BigInt(count - 1)))] = true
      const terms = products.map((isProduct) =>
        isProduct
          ? productChain(random, Number(random.int(2n, 3n)))
          : literal(random),
      )
      return sumOf(terms, random).expression
    },
    shows: ['add-before-mul'],
  },
  'n.parens': {
    version: 1,
    build(random) {
      return sumWithGroups(random, 0, random.int(1n, 2n)).expression
    },
    shows: ['ignored-group'],
  },
  'n.brackets': {
    version: 1,
    build(random) {
      return sumWithGroups(random, Number(random.int(1n, 2n)), 1n).expression
    },
    shows: ['ignored-group'],
  },
  'pow.basics': {
    version: 1,
    build: basicPowers,
    shows: ['power-as-product'],
  },
  'pow.properties': {
    version: 1,
    build: powerProperties,
    shows: ['power-as-product'],
  },
} satisfies Record<string, Generator>

export type GeneratedSkill = keyof typeof generators

function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}

// Costruisce finché l'esercizio rispetta `shows`. Lo stesso generatore
// pseudocasuale continua da un tentativo all'altro, quindi il seme decide
// anche quanti tentativi servono.
function build(generator: Generator, random: Random): Expression {
  for (let i = 0; i < maxAttempts; i++) {
    const expression = generator.build(random)
    const { result } = solve(expression)
    if (
      (generator.shows ?? []).every((id) => isVisible(id, expression, result))
    )
      return expression
  }
  throw new Error('Nessun esercizio valido')
}

export function generate(skill: GeneratedSkill, seed: number): Exercise {
  const generator: Generator = generators[skill]
  return {
    skill,
    seed,
    generatorVersion: generator.version,
    expression: build(generator, seededRandom(seed)),
  }
}
