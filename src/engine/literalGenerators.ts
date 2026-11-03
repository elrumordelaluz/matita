import {
  binary,
  group,
  literal,
  monomial,
  negatedPower,
  power,
  type LiteralExpression,
  type MonomialNode,
} from './expression.ts'
import { isVisibleLiteral } from './literalMisconceptions.ts'
import { solveLiteral, type LiteralSolution } from './literalSolver.ts'
import { asMonomial, polynomialValue } from './polynomial.ts'
import { isVisible } from './misconceptions.ts'
import type { Random } from './random.ts'
import { rational, type Rational } from './rational.ts'
import { solveWithValues, substitute, type Assignment } from './value.ts'

// I generatori del calcolo letterale, capitoli 6 e 7. Lettere minuscole, al
// massimo tre per esercizio, coefficienti con i limiti di Q. Ogni generatore
// costruisce e poi controlla la soluzione: quello che la costruzione non
// garantisce da solo si scarta, e lo stesso seme scarta sempre gli stessi.
// Vedi SPEC.md, "Calcolo letterale", "Generatori".

const maxAttempts = 1000

/** Un generatore e la versione di quello che produce. */
export interface LiteralGenerator<T> {
  readonly version: number
  build(random: Random): T
}

// Costruisce finché `accepts` va bene. Lo stesso generatore pseudocasuale
// continua da un tentativo all'altro, quindi il seme decide anche quanti
// tentativi servono.
function until<T>(
  random: Random,
  build: (random: Random) => T,
  accepts: (built: T) => boolean,
): T {
  for (let i = 0; i < maxAttempts; i++) {
    const built = build(random)
    try {
      if (accepts(built)) return built
    } catch (error) {
      // Un conto impossibile, come una divisione per zero, scarta e basta.
      if (!(error instanceof RangeError)) throw error
    }
  }
  throw new Error('Nessun esercizio valido')
}

const abs = (n: bigint) => (n < 0n ? -n : n)

const addSub = ['+', '-'] as const

/** L'esercizio sul valore numerico: l'espressione e i valori delle lettere. */
export interface ValueBuild {
  readonly expression: LiteralExpression
  readonly substitution: readonly Assignment[]
}

// Le lettere di un esercizio sul valore numerico: una o due, come sul libro.
const valueLetters = [['a'], ['x'], ['a', 'b'], ['x', 'y']] as const

// Valori interi piccoli, i negativi più spesso: sono loro a chiedere le
// tonde. Ogni tanto una frazione, perché il capitolo viene dopo Q.
const integerValues = [-3n, -2n, -2n, -1n, -1n, 1n, 2n, 3n]
const fractionValues = [
  rational(1n, 2n),
  rational(-1n, 2n),
  rational(1n, 3n),
  rational(-1n, 3n),
]

function valueOf(random: Random): Rational {
  return random.pick([true, true, true, true, false])
    ? rational(random.pick(integerValues))
    : random.pick(fractionValues)
}

// Un termine: un monomio con coefficiente intero fino a 5, a volte
// sottinteso, e una o due lettere con esponente fino a 3.
function valueTerm(
  random: Random,
  letters: readonly string[],
): LiteralExpression {
  const chosen =
    letters.length === 1
      ? letters
      : random.pick([letters, [letters[0] ?? 'a'], [letters[1] ?? 'b']])
  const coefficient = random.pick([1n, 1n, 2n, 3n, 4n, 5n])
  return monomial(
    rational(coefficient),
    chosen.map((l) => [l, random.int(1n, 3n)] as const),
  )
}

// Il primo termine può avere il meno davanti, che è il segno del suo
// coefficiente; gli altri sono monomi positivi fra + e −. A volte l'ultimo
// è un numero, il termine noto.
function valueExpression(random: Random): ValueBuild {
  const letters = random.pick(valueLetters)
  const count = Number(random.int(2n, 3n))
  const terms: LiteralExpression[] = Array.from({ length: count }, () =>
    valueTerm(random, letters),
  )
  if (random.pick([true, false, false]))
    terms[count - 1] = literal(rational(random.int(1n, 9n)))
  const [first, ...rest] = terms
  if (!first) throw new RangeError('Nessun termine')
  const leading =
    first.kind === 'monomial' && random.pick([true, false, false])
      ? { ...first, coefficient: rational(-first.coefficient.num) }
      : first
  const expression = rest.reduce<LiteralExpression>(
    (sum, term) => binary(random.pick(addSub), sum, term),
    leading,
  )
  const used = new Set<string>()
  const collect = (e: LiteralExpression): void => {
    if (e.kind === 'monomial') e.letters.forEach((l) => used.add(l.letter))
    else if (e.kind === 'group') collect(e.inner)
    else if (e.kind === 'binary') {
      collect(e.left)
      collect(e.right)
    }
  }
  collect(expression)
  return {
    expression,
    substitution: letters
      .filter((l) => used.has(l))
      .map((letter) => ({ letter, value: valueOf(random) })),
  }
}

// La parte letterale di un termine, per riconoscere i simili.
function letterPart(e: LiteralExpression): string {
  if (e.kind !== 'monomial') return ''
  const exponents = new Map<string, bigint>()
  for (const { letter, exponent } of e.letters)
    exponents.set(letter, (exponents.get(letter) ?? 0n) + exponent)
  return [...exponents]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([l, n]) => `${l}${n}`)
    .join('')
}

function terms(e: LiteralExpression): LiteralExpression[] {
  return e.kind === 'binary' && (e.op === '+' || e.op === '-')
    ? [...terms(e.left), e.right]
    : [e]
}

// Nessun termine simile a un altro: ridurli è un'altra abilità. I conti
// restano mentali: intermedi fino a 100 con denominatore fino a 36,
// risultato fino a 60 con denominatore fino a 12. Il negativo sostituito
// senza tonde deve cambiare il risultato.
function cleanValue({ expression, substitution }: ValueBuild): boolean {
  const parts = terms(expression).map(letterPart)
  if (new Set(parts).size < parts.length) return false
  const { lines, result } = solveWithValues(expression, substitution)
  const steps = lines.flatMap((l) => l.steps)
  return (
    steps.every((s) => s.result.den <= 36n && abs(s.result.num) <= 100n) &&
    result.den <= 12n &&
    abs(result.num) <= 60n &&
    isVisible(
      'negative-substituted-without-brackets',
      substitute(expression, substitution),
      result,
    )
  )
}

export const valueGenerator: LiteralGenerator<ValueBuild> = {
  version: 1,
  build: (random) => until(random, valueExpression, cleanValue),
}

// I coefficienti scritti seguono i limiti di Q: interi piccoli, a volte una
// frazione già ridotta con denominatore fino a 12. Negativi una volta su
// tre.
const coefficientDenominators = [2n, 2n, 3n, 3n, 4n, 5n, 6n]

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b]
  return abs(a)
}

function coefficientOf(random: Random): Rational {
  const sign = random.pick([-1n, 1n, 1n])
  if (random.pick([true, false, false, false])) {
    const den = random.pick(coefficientDenominators)
    const numerators: bigint[] = []
    for (let n = 1n; n < 2n * den; n++)
      if (gcd(n, den) === 1n) numerators.push(n)
    return rational(sign * random.pick(numerators), den)
  }
  return rational(sign * random.pick([1n, 2n, 2n, 3n, 3n, 4n, 5n, 6n]))
}

// Le lettere di un esercizio del capitolo 6: due o tre, come sul libro.
const monomialLetters = [
  ['a', 'b'],
  ['x', 'y'],
  ['a', 'b', 'c'],
  ['x', 'y', 'z'],
] as const

// Un monomio scritto con lettere diverse, in ordine qualsiasi, esponenti
// fino a 4.
function plainMonomial(
  random: Random,
  letters: readonly string[],
): MonomialNode {
  const count = random.int(1n, BigInt(Math.min(3, letters.length)))
  const pool = [...letters]
  const chosen: [string, bigint][] = []
  for (let i = 0n; i < count; i++) {
    const at = Number(random.int(0n, BigInt(pool.length - 1)))
    const [letter] = pool.splice(at, 1)
    if (letter) chosen.push([letter, random.int(1n, 4n)])
  }
  return monomial(coefficientOf(random), chosen)
}

// Un monomio scritto con una lettera ripetuta, come 6a³ab.
function repeatedMonomial(
  random: Random,
  letters: readonly string[],
): LiteralExpression {
  const base = plainMonomial(random, letters)
  const again = random.pick(base.letters)
  const written = base.letters.map((l) => [l.letter, l.exponent] as const)
  written.splice(Number(random.int(1n, BigInt(written.length))), 0, [
    again.letter,
    random.int(1n, 3n),
  ])
  return monomial(base.coefficient, written)
}

// Due monomi, a volte con un numero negativo in mezzo, come in
// 12a²b³(−2)a³.
function productOfMonomials(
  random: Random,
  letters: readonly string[],
): LiteralExpression {
  const left = plainMonomial(random, letters)
  const right = plainMonomial(random, letters)
  if (random.pick([true, false, false, false, false])) {
    const factor = literal(rational(-random.int(2n, 5n)))
    return binary('×', binary('×', left, factor), right)
  }
  return binary('×', left, right)
}

function normalFormExercise(random: Random): LiteralExpression {
  const letters = random.pick(monomialLetters)
  return random.pick([true, false, false])
    ? repeatedMonomial(random, letters)
    : productOfMonomials(random, letters)
}

// Una lettera che compare due volte, nello stesso monomio o in due.
function repeatsLetter(e: LiteralExpression): boolean {
  const seen: string[] = []
  const visit = (node: LiteralExpression): void => {
    if (node.kind === 'monomial')
      seen.push(...node.letters.map((l) => l.letter))
    else if (node.kind === 'group') visit(node.inner)
    else if (node.kind === 'binary') {
      visit(node.left)
      visit(node.right)
    }
  }
  visit(e)
  return new Set(seen).size < seen.length
}

// Coefficienti fino a 60 con denominatore fino a 36, esponenti fino a 12,
// in ogni passaggio e nel risultato.
function withinLiteralLimits(solution: LiteralSolution): boolean {
  const values = [
    ...solution.lines.flatMap((l) => l.steps.map((s) => s.result)),
    solution.result,
  ].flatMap((p) => [...p.values()])
  return values.every(
    (m) =>
      m.coefficient.den <= 36n &&
      abs(m.coefficient.num) <= 60n &&
      [...m.letters.values()].every((n) => n <= 12n),
  )
}

// Una catena di × e : fra due o tre monomi, da sinistra a destra. Ogni
// divisore si sceglie conoscendo il risultato parziale, così il quoziente è
// sempre un monomio: le sue lettere sono fra quelle del dividendo, con
// esponente non più grande.
function mulDivChain(random: Random): LiteralExpression {
  const letters = random.pick(monomialLetters)
  let tree: LiteralExpression = plainMonomial(random, letters)
  const count = Number(random.int(2n, 3n))
  for (let i = 1; i < count; i++) {
    const partial = asMonomial(polynomialValue(tree))
    const op = random.pick(['×', ':'] as const)
    if (op === '×' || !partial || partial.letters.size === 0) {
      tree = binary('×', tree, plainMonomial(random, letters))
      continue
    }
    const own = [...partial.letters]
    const chosen = own.filter(() => random.pick([true, false]))
    const divisorLetters = (chosen.length > 0 ? chosen : own.slice(0, 1)).map(
      ([letter, n]) => [letter, random.int(1n, n < 5n ? n : 5n)] as const,
    )
    const coefficient = rational(
      random.pick([-1n, 1n, 1n]) * random.pick([1n, 2n, 2n, 3n, 4n, 6n]),
    )
    tree = binary(':', tree, monomial(coefficient, divisorLetters))
  }
  return tree
}

// La potenza di un monomio, a volte con il meno davanti, a volte per un
// altro monomio. Il coefficiente non è 1, così si vede che si eleva anche
// lui, e almeno una lettera ha già un esponente.
const powerCoefficients = [
  rational(2n),
  rational(3n),
  rational(2n),
  rational(1n, 2n),
  rational(2n, 3n),
  rational(3n, 2n),
]

function monomialPower(random: Random): LiteralExpression {
  const letters = random.pick(monomialLetters)
  const exponent = random.int(2n, 3n)
  const written = plainMonomial(random, letters)
  const magnitude = random.pick(powerCoefficients)
  const sign = random.pick([-1n, 1n])
  const base = monomial(
    rational(sign * magnitude.num, magnitude.den),
    written.letters.map((l) => [l.letter, l.exponent] as const),
  )
  const p = power(base, exponent)
  return random.pick([
    () => p,
    () => p,
    () => negatedPower(p),
    () => binary('×', p, plainMonomial(random, letters)),
  ])()
}

// Le parti letterali di una somma di monomi: due lettere, al più tre parti
// diverse, come a², b, ab.
function letterParts(
  random: Random,
  letters: readonly string[],
): (readonly [string, bigint])[][] {
  const [x = 'a', y = 'b'] = letters
  const shapes: (readonly [string, bigint])[][] = [
    [[x, 1n]],
    [[x, 2n]],
    [[y, 1n]],
    [[y, 2n]],
    [
      [x, 1n],
      [y, 1n],
    ],
    [
      [x, 2n],
      [y, 1n],
    ],
    [
      [x, 1n],
      [y, 3n],
    ],
  ]
  const count = Number(random.int(1n, 3n))
  const parts: (readonly [string, bigint])[][] = []
  while (parts.length < count) {
    const shape = random.pick(shapes)
    if (!parts.includes(shape)) parts.push(shape)
  }
  return parts
}

// Coefficienti interi fino a 9, 1 spesso, perché il sottinteso è il punto
// dell'abilità; oppure frazioni con denominatori piccoli, come in Q.
const sumIntegers = [1n, 1n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n]
const sumFractions = [
  rational(1n, 2n),
  rational(3n, 2n),
  rational(1n, 3n),
  rational(2n, 3n),
  rational(1n, 4n),
  rational(3n, 4n),
  rational(1n, 6n),
  rational(5n, 6n),
  rational(1n),
]

// Una somma algebrica di tre, quattro o cinque monomi. Il primo può avere il
// meno davanti; gli altri sono monomi positivi fra + e −. I simili non sono
// per forza vicini.
function sumOfMonomials(random: Random): LiteralExpression {
  const letters = random.pick(monomialLetters)
  const parts = letterParts(random, letters)
  const fractions = random.pick([true, false, false])
  const count = Number(random.int(3n, 5n))
  const terms = Array.from({ length: count }, (_, i) => {
    // Il primo gruppo ha almeno due simili.
    const part = i < 2 ? parts[0] : random.pick(parts)
    const coefficient = fractions
      ? random.pick(sumFractions)
      : rational(random.pick(sumIntegers))
    return monomial(coefficient, part ?? [['a', 1n]])
  })
  for (let i = terms.length - 1; i > 0; i--) {
    const j = Number(random.int(0n, BigInt(i)))
    const [a, b] = [terms[i], terms[j]]
    if (a && b) [terms[i], terms[j]] = [b, a]
  }
  const [first, ...rest] = terms
  if (!first) throw new RangeError('Nessun termine')
  const leading = random.pick([true, false, false])
    ? monomial(
        rational(-first.coefficient.num, first.coefficient.den),
        first.letters.map((l) => [l.letter, l.exponent] as const),
      )
    : first
  return rest.reduce<LiteralExpression>(
    (sum, term) => binary(random.pick(addSub), sum, term),
    leading,
  )
}

// Le espressioni con i monomi, come gli esercizi guida del libro: due o tre
// termini che diventano simili, ciascuno con il suo conto (una potenza, un
// prodotto, un quoziente, un gruppo di simili per un monomio), a volte un
// termine che resta da solo. La parte letterale comune si sceglie prima, e
// ogni termine si costruisce per arrivarci.

type LetterPart = readonly (readonly [string, bigint])[]

const smallCoefficient = (random: Random): Rational =>
  random.pick([true, true, true, false])
    ? rational(random.pick([-3n, -2n, -1n, 1n, 2n, 3n, 4n]))
    : random.pick([rational(1n, 2n), rational(-1n, 2n), rational(3n, 2n)])

// Una parte letterale con una o due lettere, esponenti fino a 4 o 6.
function targetPart(random: Random): LetterPart {
  const letters = random.pick(monomialLetters)
  const [x = 'a', y = 'b'] = letters
  const exponent = () => random.pick([2n, 2n, 3n, 4n, 6n])
  return random.pick([true, false])
    ? [[x, exponent()]]
    : [
        [x, exponent()],
        [y, random.pick([1n, 2n, 3n])],
      ]
}

// (c · base)ⁿ con la parte letterale data: ogni esponente diviso per n.
function powerTerm(random: Random, part: LetterPart): LiteralExpression | null {
  const exponents = [2n, 3n].filter((n) => part.every(([, e]) => e % n === 0n))
  if (exponents.length === 0) return null
  const n = random.pick(exponents)
  const base = monomial(
    random.pick([
      rational(2n),
      rational(-2n),
      rational(3n),
      rational(-1n, 2n),
      rational(-1n),
    ]),
    part.map(([l, e]) => [l, e / n] as const),
  )
  return power(base, n)
}

// Due monomi il cui prodotto ha la parte letterale data.
function productTerm(
  random: Random,
  part: LetterPart,
): LiteralExpression | null {
  const left: [string, bigint][] = []
  const right: [string, bigint][] = []
  for (const [l, e] of part) {
    const k = random.int(0n, e)
    if (k > 0n) left.push([l, k])
    if (e - k > 0n) right.push([l, e - k])
  }
  if (left.length === 0 || right.length === 0) return null
  return binary(
    '×',
    monomial(smallCoefficient(random), left),
    monomial(smallCoefficient(random), right),
  )
}

// Un quoziente esatto con la parte letterale data.
function quotientTerm(
  random: Random,
  part: LetterPart,
): LiteralExpression | null {
  const divisor = part
    .filter(([, e]) => e < 5n)
    .map(([l, e]) => [l, random.int(1n, 5n - e)] as const)
  if (divisor.length === 0) return null
  const k = random.pick([2n, 3n, 4n])
  const dividend = part.map(([l, e]) => {
    const d = divisor.find(([m]) => m === l)?.[1] ?? 0n
    return [l, e + d] as const
  })
  return binary(
    ':',
    monomial(rational(k * random.pick([-3n, -1n, 1n, 2n, 3n])), dividend),
    monomial(rational(random.pick([-1n, 1n]) * k), divisor),
  )
}

// Un monomio per un gruppo di simili: 2a · (3a − 5a).
function groupTerm(random: Random, part: LetterPart): LiteralExpression | null {
  const outside: [string, bigint][] = []
  const inside: [string, bigint][] = []
  for (const [l, e] of part) {
    const k = random.int(0n, e)
    if (k > 0n) outside.push([l, k])
    if (e - k > 0n) inside.push([l, e - k])
  }
  if (outside.length === 0 || inside.length === 0) return null
  const first = random.int(1n, 5n)
  const second = random.int(1n, 5n)
  const sum = binary(
    random.pick(addSub),
    monomial(rational(first), inside),
    monomial(rational(second), inside),
  )
  return binary(
    '×',
    monomial(smallCoefficient(random), outside),
    group('round', sum),
  )
}

const termShapes = [powerTerm, productTerm, quotientTerm, groupTerm]

function likeTerm(random: Random, part: LetterPart): LiteralExpression {
  for (;;) {
    const term = random.pick(termShapes)(random, part)
    if (term) return term
  }
}

function monomialExpressions(random: Random): LiteralExpression {
  const part = targetPart(random)
  const terms = Array.from({ length: Number(random.int(2n, 3n)) }, () =>
    likeTerm(random, part),
  )
  if (random.pick([true, false, false])) {
    const letters = part.map(([l]) => l)
    terms.splice(
      Number(random.int(0n, BigInt(terms.length))),
      0,
      monomial(smallCoefficient(random), [[letters[0] ?? 'a', 1n]]),
    )
  }
  const [first, ...rest] = terms
  if (!first) throw new RangeError('Nessun termine')
  return rest.reduce<LiteralExpression>(
    (sum, term) => binary(random.pick(addSub), sum, term),
    first,
  )
}

// I numeri scritti seguono i limiti: esponenti fino a 5, denominatori fino
// a 12.
function writtenWithin(e: LiteralExpression): boolean {
  if (e.kind === 'monomial')
    return e.coefficient.den <= 12n && e.letters.every((l) => l.exponent <= 5n)
  if (e.kind === 'number') return e.value.den <= 12n
  if (e.kind === 'group') return writtenWithin(e.inner)
  return writtenWithin(e.left) && writtenWithin(e.right)
}

/** Le abilità i cui esercizi chiedono un polinomio. */
export type PolynomialSkill =
  | 'mono.normal-form'
  | 'mono.mul-div'
  | 'mono.power'
  | 'mono.add-sub'
  | 'mono.expressions'

export const polynomialGenerators: Record<
  PolynomialSkill,
  LiteralGenerator<LiteralExpression>
> = {
  'mono.normal-form': {
    version: 1,
    // Una lettera ripetuta, così la forma normale ha qualcosa da fare, e una
    // riga sola.
    build: (random) =>
      until(random, normalFormExercise, (e) => {
        const solution = solveLiteral(e)
        return (
          repeatsLetter(e) &&
          solution.lines.length === 1 &&
          withinLiteralLimits(solution)
        )
      }),
  },
  'mono.mul-div': {
    version: 1,
    // Gli esponenti moltiplicati devono cambiare il risultato.
    build: (random) =>
      until(random, mulDivChain, (e) => {
        const solution = solveLiteral(e)
        return (
          solution.lines.length === 1 &&
          withinLiteralLimits(solution) &&
          isVisibleLiteral('same-base-multiplies-exponents', e, solution.result)
        )
      }),
  },
  'mono.power': {
    version: 1,
    build: (random) =>
      until(random, monomialPower, (e) => {
        const solution = solveLiteral(e)
        return (
          withinLiteralLimits(solution) &&
          (
            ['coefficient-not-raised', 'power-of-power-adds-exponents'] as const
          ).every((id) => isVisibleLiteral(id, e, solution.result))
        )
      }),
  },
  'mono.add-sub': {
    version: 1,
    // Il coefficiente sottinteso e gli esponenti sommati devono cambiare il
    // risultato; il risultato non è zero.
    build: (random) =>
      until(random, sumOfMonomials, (e) => {
        const solution = solveLiteral(e)
        return (
          solution.lines.length === 1 &&
          solution.result.size > 0 &&
          withinLiteralLimits(solution) &&
          (
            ['implicit-coefficient-zero', 'like-terms-exponents-added'] as const
          ).every((id) => isVisibleLiteral(id, e, solution.result))
        )
      }),
  },
  'mono.expressions': {
    version: 1,
    // Alla fine si riducono i simili, e gli esponenti sommati fra simili
    // cambiano il risultato.
    build: (random) =>
      until(random, monomialExpressions, (e) => {
        const solution = solveLiteral(e)
        return (
          solution.lines.length >= 2 &&
          solution.lines.at(-1)?.steps[0]?.rule === 'like-terms' &&
          solution.result.size > 0 &&
          writtenWithin(e) &&
          withinLiteralLimits(solution) &&
          isVisibleLiteral('like-terms-exponents-added', e, solution.result)
        )
      }),
  },
}
