import {
  binary,
  group,
  isAddSub,
  isMulDiv,
  literal as numberOf,
  num,
  type Bracket,
  type Expression,
  type Operator,
} from './expression.ts'
import { isVisible, type MisconceptionId } from './misconceptions.ts'
import {
  basicPowers,
  powerExpressions,
  powerProperties,
  zeroAndNegativePowers,
} from './powerGenerators.ts'
import { seededRandom, type Random } from './random.ts'
import { rational, type Rational } from './rational.ts'
import { solve, type Solution } from './solver.ts'

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
  /**
   * I vincoli che la costruzione non garantisce da sola, controllati sulla
   * soluzione: in Z e in Q i numeri si scelgono e poi si guarda dove portano.
   */
  accepts?(solution: Solution, expression: Expression): boolean
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

// In Z i numeri scritti restano nel calcolo mentale: addendi fino a 15,
// fattori fino a 10, ogni risultato intermedio intero e fino a 100 in valore
// assoluto. Un esercizio si scrive tutto in un modo: i positivi con il segno,
// (+4), oppure senza.
const zTermMax = 15n
const zFactorMax = 10n
const zValueMax = 100n

type Atom = (random: Random, plus: boolean) => Expression

function relative(
  random: Random,
  min: bigint,
  max: bigint,
  plus: boolean,
): Expression {
  const magnitude = random.int(min, max)
  const value = random.pick([true, false]) ? -magnitude : magnitude
  return numberOf(rational(value), { plus })
}

const zTerm: Atom = (random, plus) => relative(random, 1n, zTermMax, plus)
const zSmall: Atom = (random, plus) => relative(random, 1n, 9n, plus)

const addSub = ['+', '-'] as const

// Una somma algebrica di `count` numeri.
function algebraicSum(
  random: Random,
  atom: Atom,
  count: number,
  plus: boolean,
): Expression {
  let tree = atom(random, plus)
  for (let i = 1; i < count; i++)
    tree = binary(random.pick(addSub), tree, atom(random, plus))
  return tree
}

function abs(n: bigint): bigint {
  return n < 0n ? -n : n
}

// Una catena di × e : fra relativi. Come in N, ogni numero si sceglie
// conoscendo il risultato parziale: divisioni esatte, prodotti entro 100.
function relativeChain(
  random: Random,
  count: number,
  plus: boolean,
): Expression {
  const sign = () => (random.pick([true, false]) ? -1n : 1n)
  let current = sign() * random.int(2n, zFactorMax)
  let tree = numberOf(rational(current), { plus })
  for (let i = 1; i < count; i++) {
    const size = abs(current)
    const ds = divisors(size).filter((d) => d <= zFactorMax)
    const options: Operator[] = []
    if (size * 2n <= zValueMax) options.push('×')
    if (ds.length > 0) options.push(':')
    const op = random.pick(options)
    const factor =
      sign() *
      (op === '×'
        ? random.int(2n, min(zFactorMax, zValueMax / size))
        : random.pick(ds))
    current = op === '×' ? current * factor : current / factor
    tree = binary(op, tree, numberOf(rational(factor), { plus }))
  }
  return tree
}

interface Term {
  readonly tree: Expression
  readonly isGroup: boolean
}

// Una somma con gruppi alti `height`: un gruppo (uno o due se sono tonde) e
// un numero, in ordine a caso. Davanti a un gruppo il meno è più probabile
// del più, e un gruppo all'inizio può avere il meno davanti.
function sumWithRelativeGroups(
  random: Random,
  atom: Atom,
  height: number,
  plus: boolean,
  factors: boolean,
): Expression {
  const count = height === 0 ? Number(random.int(1n, 2n)) : 1
  const terms: Term[] = Array.from({ length: count }, () => ({
    tree: relativeGroupTerm(random, atom, height, plus, factors),
    isGroup: true,
  }))
  terms.splice(Number(random.int(0n, BigInt(count))), 0, {
    tree: atom(random, plus),
    isGroup: false,
  })
  const [first, ...rest] = terms
  if (!first) throw new RangeError('Nessun termine')
  let tree =
    first.tree.kind === 'group' && random.pick([true, false])
      ? group(first.tree.bracket, first.tree.inner, { negated: true })
      : first.tree
  for (const term of rest) {
    const op = random.pick(term.isGroup ? (['+', '-', '-'] as const) : addSub)
    tree = binary(op, tree, term.tree)
  }
  return tree
}

// Un gruppo, da solo o, con `factors`, a volte per un numero piccolo.
function relativeGroupTerm(
  random: Random,
  atom: Atom,
  height: number,
  plus: boolean,
  factors: boolean,
): Expression {
  const inner =
    height === 0
      ? algebraicSum(random, atom, 2, plus)
      : sumWithRelativeGroups(random, atom, height - 1, plus, factors)
  const g = group(bracketFor(height), inner)
  if (!factors) return g
  const factor = () => relative(random, 2n, 5n, plus)
  return random.pick([
    () => g,
    () => g,
    () => binary('×', factor(), g),
    () => binary('×', g, factor()),
  ])()
}

function stepsOf(solution: Solution) {
  return solution.lines.flatMap((l) => l.steps)
}

// Ogni risultato intermedio è un intero non troppo grande, e solo l'ultimo
// può valere zero: un gruppo che vale zero non allena niente.
function cleanInZ(solution: Solution): boolean {
  const all = stepsOf(solution)
  return all.every(
    ({ result }, i) =>
      result.den === 1n &&
      abs(result.num) <= zValueMax &&
      (result.num !== 0n || i === all.length - 1),
  )
}

function values(e: Expression): Rational[] {
  if (e.kind === 'number') return [e.value]
  if (e.kind === 'group') return values(e.inner)
  return [...values(e.left), ...values(e.right)]
}

// Un esercizio di Z fa lavorare con i negativi: un numero scritto o un
// risultato intermedio sotto lo zero.
function withNegatives(solution: Solution, expression: Expression): boolean {
  return [
    ...values(expression),
    ...stepsOf(solution).map((s) => s.result),
  ].some((r) => r.num < 0n)
}

const inZ = (solution: Solution, expression: Expression) =>
  cleanInZ(solution) && withNegatives(solution, expression)

// In Q i denominatori scritti sono piccoli, i più comuni più spesso. Una
// frazione scritta è già ridotta, a volte impropria, negativa una volta su
// tre. Gli intermedi restano frazioni da calcolo mentale: denominatore fino
// a 36, minimo comune multiplo di una somma fino a 24, numeratore fino a 60.
// Il risultato ha denominatore fino a 12 e numeratore fino a 30.
const qDenominators = [2n, 2n, 3n, 3n, 4n, 4n, 5n, 6n, 6n, 8n, 9n, 10n, 12n]

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b]
  return abs(a)
}

const qFraction: Atom = (random, plus) => {
  const den = random.pick(qDenominators)
  const numerators: bigint[] = []
  for (let n = 1n; n < 2n * den; n++)
    if (n !== den && gcd(n, den) === 1n) numerators.push(n)
  const magnitude = random.pick(numerators)
  const negative = random.pick([true, false, false])
  return numberOf(rational(negative ? -magnitude : magnitude, den), { plus })
}

// Un termine di una somma in Q: quasi sempre una frazione, a volte un intero.
const qTerm: Atom = (random, plus) =>
  random.pick([true, true, true, true, false])
    ? qFraction(random, plus)
    : relative(random, 1n, 5n, plus)

function lcm(a: bigint, b: bigint): bigint {
  return (a * b) / gcd(a, b)
}

function cleanInQ(solution: Solution): boolean {
  const all = stepsOf(solution)
  const { result } = solution
  return (
    result.den <= 12n &&
    abs(result.num) <= 30n &&
    all.every(
      (s, i) =>
        s.result.den <= 36n &&
        abs(s.result.num) <= 60n &&
        (s.result.num !== 0n || i === all.length - 1) &&
        (isMulDiv(s.op) || lcm(s.left.den, s.right.den) <= 24n) &&
        !(
          s.op === ':' &&
          abs(s.left.num) === abs(s.right.num) &&
          s.left.den === s.right.den
        ),
    )
  )
}

// Nel prodotto, o nel prodotto per il reciproco, un numeratore e un
// denominatore hanno un fattore in comune: c'è da semplificare in croce.
function crossSimplifies(solution: Solution): boolean {
  return stepsOf(solution).some(({ op, left, right }) => {
    if (op === '×')
      return gcd(left.num, right.den) > 1n || gcd(right.num, left.den) > 1n
    if (op === ':')
      return gcd(left.num, right.num) > 1n || gcd(left.den, right.den) > 1n
    return false
  })
}

// Un esercizio di Q lavora con le frazioni: almeno un'operazione ne ha una.
function withFractions(solution: Solution): boolean {
  return stepsOf(solution).some((s) => s.left.den > 1n || s.right.den > 1n)
}

const inQ = (solution: Solution) =>
  cleanInQ(solution) && withFractions(solution)

// Le potenze in Q seguono gli stessi limiti, ma un quoziente fra potenze
// uguali qui è il punto: 5³ : 5³ porta all'esponente zero.
function cleanPowersInQ(solution: Solution): boolean {
  const all = stepsOf(solution)
  const { result } = solution
  return (
    result.den <= 12n &&
    abs(result.num) <= 30n &&
    all.every(
      (s, i) =>
        s.result.den <= 36n &&
        abs(s.result.num) <= 60n &&
        (s.result.num !== 0n || i === all.length - 1) &&
        (!isAddSub(s.op) || lcm(s.left.den, s.right.den) <= 24n),
    )
  )
}

// Un'espressione con le potenze in Q ne ha almeno una con la base frazione
// o con l'esponente negativo: altrimenti è un esercizio di Z.
function powersInQ(solution: Solution): boolean {
  return stepsOf(solution).some(
    (s) => s.rule === 'power' && (s.left.den > 1n || s.right.num < 0n),
  )
}

// Una catena di × e : fra frazioni.
function fractionChain(random: Random, count: number, plus: boolean) {
  let tree = qFraction(random, plus)
  for (let i = 1; i < count; i++)
    tree = binary(
      random.pick(['×', ':'] as const),
      tree,
      qFraction(random, plus),
    )
  return tree
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
  'z.add-sub': {
    version: 1,
    build(random) {
      const plus = random.pick([true, false])
      return algebraicSum(random, zTerm, Number(random.int(3n, 5n)), plus)
    },
    accepts: inZ,
    shows: ['sign-rule-in-sum'],
  },
  'z.mul-div': {
    version: 1,
    build(random) {
      const plus = random.pick([true, false])
      return relativeChain(random, Number(random.int(3n, 4n)), plus)
    },
    // Meno per meno compare sempre. Non si chiede che l'errore si veda: con
    // tre negativi la regola sbagliata dà lo stesso valore, e pretenderlo
    // lascerebbe solo risultati positivi.
    accepts: (solution, expression) =>
      inZ(solution, expression) &&
      stepsOf(solution).some((s) => s.left.num < 0n && s.right.num < 0n),
  },
  'z.order': {
    version: 1,
    build(random) {
      const plus = random.pick([true, false])
      const count = Number(random.int(2n, 3n))
      const products = Array.from({ length: count }, () =>
        random.pick([true, false]),
      )
      if (!products.includes(true))
        products[Number(random.int(0n, BigInt(count - 1)))] = true
      let tree: Expression | null = null
      for (const isProduct of products) {
        const term = isProduct
          ? relativeChain(random, Number(random.int(2n, 3n)), plus)
          : zTerm(random, plus)
        tree = tree ? binary(random.pick(addSub), tree, term) : term
      }
      if (!tree) throw new RangeError('Nessun termine')
      return tree
    },
    accepts: inZ,
    shows: ['add-before-mul'],
  },
  'z.minus-group': {
    version: 1,
    build(random) {
      const plus = random.pick([true, false])
      return sumWithRelativeGroups(random, zSmall, 0, plus, false)
    },
    accepts: inZ,
    shows: ['minus-group-signs-kept', 'minus-sign-dropped'],
  },
  'z.brackets': {
    version: 1,
    build(random) {
      const plus = random.pick([true, false])
      const height = Number(random.int(1n, 2n))
      return sumWithRelativeGroups(random, zSmall, height, plus, true)
    },
    // Al massimo sette numeri: con le graffe l'esercizio si allunga presto.
    accepts: (solution, expression) =>
      values(expression).length <= 7 && inZ(solution, expression),
    shows: ['ignored-group', 'minus-group-signs-kept'],
  },
  'q.add-sub': {
    version: 1,
    build(random) {
      const plus = random.pick([true, false])
      return algebraicSum(random, qTerm, Number(random.int(3n, 4n)), plus)
    },
    accepts: inQ,
    shows: ['added-numerators-denominators'],
  },
  'q.mul-div': {
    version: 1,
    build(random) {
      const plus = random.pick([true, false])
      return fractionChain(random, Number(random.int(2n, 3n)), plus)
    },
    // Sempre qualcosa da semplificare in croce. Il reciproco dimenticato
    // deve vedersi solo se c'è una divisione: con soli × non c'è niente da
    // sbagliare, e `shows` lo pretenderebbe sempre.
    accepts: (solution, expression) =>
      inQ(solution) &&
      crossSimplifies(solution) &&
      (stepsOf(solution).every((s) => s.op !== ':') ||
        isVisible('divided-without-reciprocal', expression, solution.result)),
  },
  'q.order': {
    version: 1,
    build(random) {
      const plus = random.pick([true, false])
      const count = Number(random.int(2n, 3n))
      const product = Number(random.int(0n, BigInt(count - 1)))
      let tree: Expression | null = null
      for (let i = 0; i < count; i++) {
        const term =
          i === product
            ? binary(
                random.pick(['×', ':'] as const),
                qTerm(random, plus),
                qFraction(random, plus),
              )
            : qTerm(random, plus)
        tree = tree ? binary(random.pick(addSub), tree, term) : term
      }
      if (!tree) throw new RangeError('Nessun termine')
      return tree
    },
    accepts: inQ,
    shows: ['add-before-mul'],
  },
  'q.brackets': {
    version: 1,
    build(random) {
      const plus = random.pick([true, false])
      const height = Number(random.int(0n, 1n))
      return sumWithRelativeGroups(random, qTerm, height, plus, true)
    },
    // Al massimo sei numeri: con le frazioni ogni numero pesa di più.
    accepts: (solution, expression) =>
      values(expression).length <= 6 && inQ(solution),
    shows: ['ignored-group'],
  },
  'pow.basics': {
    version: 2,
    build: basicPowers,
    shows: ['power-as-product'],
  },
  'pow.properties': {
    version: 1,
    build: powerProperties,
    shows: ['power-as-product'],
  },
  'pow.zero-negative': {
    version: 1,
    build: zeroAndNegativePowers,
    // Due blocchi possono annullarsi, 2⁰ − 4⁰: almeno uno dei due errori
    // deve vedersi sull'esercizio intero.
    accepts: (solution, expression) =>
      cleanPowersInQ(solution) &&
      (
        ['zero-exponent-is-zero', 'negative-exponent-is-negative'] as const
      ).some((id) => isVisible(id, expression, solution.result)),
  },
  'pow.expressions': {
    version: 1,
    build: powerExpressions,
    accepts: (solution) => cleanPowersInQ(solution) && powersInQ(solution),
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
    const solution = solvable(expression)
    if (!solution) continue
    if (generator.accepts && !generator.accepts(solution, expression)) continue
    if (
      (generator.shows ?? []).every((id) =>
        isVisible(id, expression, solution.result),
      )
    )
      return expression
  }
  throw new Error('Nessun esercizio valido')
}

// Un gruppo che vale zero può finire a fare da divisore.
function solvable(expression: Expression): Solution | null {
  try {
    return solve(expression)
  } catch (error) {
    if (error instanceof RangeError) return null
    throw error
  }
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
