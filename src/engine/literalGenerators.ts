import {
  binary,
  literal,
  monomial,
  type LiteralExpression,
} from './expression.ts'
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
