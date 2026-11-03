import {
  binary,
  literal,
  monomial,
  type LiteralExpression,
  type MonomialNode,
} from './expression.ts'
import { solveLiteral, type LiteralSolution } from './literalSolver.ts'
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

/** Le abilità i cui esercizi chiedono un polinomio. */
export type PolynomialSkill = 'mono.normal-form'

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
}
