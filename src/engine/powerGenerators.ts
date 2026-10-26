import {
  binary,
  group,
  literal as numberOf,
  negatedPower,
  num,
  power,
  type Expression,
  type Operator,
} from './expression.ts'
import { isVisible, type MisconceptionId } from './misconceptions.ts'
import type { Random } from './random.ts'
import { rational } from './rational.ts'
import { solve } from './solver.ts'

// I generatori del capitolo sulle potenze. Con basi intere le potenze
// restano nel calcolo mentale: base fino a 10, valore fino a 125 (5³), in
// valore assoluto. Le proprietà lavorano con esponenti anche grandi, ma la
// potenza che resta da calcolare alla fine rispetta lo stesso limite. Vedi
// SPEC.md, "Generatore".

const baseMax = 10n
const powerMax = 125n
// I fattori accanto a una potenza, come nel primo capitolo.
const productMax = 100n

/** Un pezzo di espressione con il suo valore, per scegliere il resto. */
export interface Built {
  readonly expression: Expression
  readonly value: bigint
}

/** L'esponente più alto con `base` elevato che resta entro `powerMax`. */
export function maxExponent(base: bigint): bigint {
  let exponent = 1n
  while (base ** (exponent + 1n) <= powerMax) exponent++
  return exponent
}

function plainPower(random: Random): Built {
  const base = random.int(2n, baseMax)
  const exponent = random.int(2n, maxExponent(base))
  return { expression: power(num(base), exponent), value: base ** exponent }
}

// Una potenza con la base fra parentesi: (5 − 2)², (2 + 3)³. I numeri dentro
// partono da 2, così la parentesi è un conto vero.
function groupPower(random: Random): Built {
  const base = random.int(2n, 5n)
  const exponent = random.int(2n, maxExponent(base))
  const op = base >= 4n ? random.pick(['+', '-'] as const) : '-'
  const right = op === '+' ? random.int(2n, base - 2n) : random.int(2n, 9n)
  const left = op === '+' ? base - right : base + right
  const inner = binary(op, num(left), num(right))
  return {
    expression: power(group('round', inner), exponent),
    value: base ** exponent,
  }
}

// Una base negativa fra parentesi: (−2)³, (−3)².
function negativeBasePower(random: Random): Built {
  const base = random.int(2n, 5n)
  const exponent = random.int(2n, maxExponent(base))
  return {
    expression: power(num(-base), exponent),
    value: (-base) ** exponent,
  }
}

// Il meno davanti alla potenza: −3², che vale −9.
function minusPower(random: Random): Built {
  const { expression, value } = plainPower(random)
  return { expression: negatedPower(expression), value: -value }
}

function abs(n: bigint): bigint {
  return n < 0n ? -n : n
}

function divisorsOf(n: bigint): bigint[] {
  const ds: bigint[] = []
  for (let d = 2n; d < n && d <= 20n; d++) if (n % d === 0n) ds.push(d)
  return ds
}

// Un termine con una potenza: da sola, con la base fra parentesi o
// negativa, per un numero o divisa per un suo divisore.
function powerTerm(random: Random): Built {
  const p = random.pick([
    plainPower,
    plainPower,
    groupPower,
    negativeBasePower,
  ])(random)
  const size = abs(p.value)
  const options: (() => Built)[] = [() => p]
  if (size * 2n <= productMax) {
    const factor = () => random.int(2n, min(9n, productMax / size))
    options.push(() => {
      const k = factor()
      return {
        expression: binary('×', p.expression, num(k)),
        value: p.value * k,
      }
    })
    options.push(() => {
      const k = factor()
      return {
        expression: binary('×', num(k), p.expression),
        value: p.value * k,
      }
    })
  }
  const ds = divisorsOf(size)
  if (ds.length > 0)
    options.push(() => {
      const d = random.pick(ds)
      return {
        expression: binary(':', p.expression, num(d)),
        value: p.value / d,
      }
    })
  return random.pick(options)()
}

function literal(random: Random): Built {
  const value = random.int(1n, 20n)
  return { expression: num(value), value }
}

/** Una somma algebrica di termini, in Z: + e − a caso. */
function algebraicSum(terms: readonly Built[], random: Random): Built {
  const [first, ...rest] = terms
  if (!first) throw new RangeError('Nessun termine')
  let { expression, value } = first
  for (const term of rest) {
    const op = random.pick(['+', '-'] as const)
    value = op === '+' ? value + term.value : value - term.value
    expression = binary(op, expression, term.expression)
  }
  return { expression, value }
}

/** Una somma algebrica di termini, con ogni sottrazione possibile in N. */
export function sumOf(terms: readonly Built[], random: Random): Built {
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

/**
 * `pow.basics`: una potenza da sola, oppure una somma algebrica di due o tre
 * termini in cui almeno uno ha una potenza. Le basi negative compaiono fra
 * parentesi, (−2)³, e il meno davanti alla potenza, −3², all'inizio, dove si
 * scrive senza parentesi. Le potenze non stanno mai una accanto all'altra in
 * un prodotto, così nessuna proprietà anticipa la lezione.
 */
export function basicPowers(random: Random): Expression {
  // Una potenza da sola ogni quattro esercizi, più o meno.
  const count = random.pick([1, 2, 2, 3])
  if (count === 1)
    return random.pick([plainPower, negativeBasePower, minusPower])(random)
      .expression
  const terms = Array.from({ length: count }, (_, i) =>
    i === 0 || random.pick([true, false]) ? powerTerm(random) : literal(random),
  )
  const first = terms.shift()
  if (!first) throw new RangeError('Nessun termine')
  terms.splice(Number(random.int(0n, BigInt(terms.length))), 0, first)
  if (random.pick([true, false, false])) terms[0] = minusPower(random)
  return algebraicSum(terms, random).expression
}

// Le proprietà. Ogni blocco finisce in una potenza `base^final` che resta
// nel calcolo mentale; gli esponenti in mezzo possono essere più grandi. Ogni
// blocco fa vedere l'errore tipico della sua proprietà, se ne ha uno.

function shows(block: Built, id: MisconceptionId): boolean {
  return isVisible(id, block.expression, rational(block.value))
}

function finalPower(random: Random): { base: bigint; final: bigint } {
  const base = random.pick([2n, 3n, 5n, 10n])
  return { base, final: random.int(2n, maxExponent(base)) }
}

// Una catena di potenze con la stessa base: 2⁵ × 2³ : 2⁶. L'ultimo
// esponente si sceglie perché la catena arrivi a `final`.
function sameBaseChain(random: Random): Built {
  const { base, final } = finalPower(random)
  for (;;) {
    const ops: Operator[] = Array.from(
      { length: Number(random.int(1n, 2n)) },
      () => random.pick(['×', ':'] as const),
    )
    const exponents = [random.int(2n, 7n)]
    let running = exponents[0] ?? 0n
    for (const op of ops.slice(0, -1)) {
      const n = random.int(2n, 6n)
      running = op === '×' ? running + n : running - n
      exponents.push(n)
    }
    const last = ops.at(-1) === '×' ? final - running : running - final
    if (running < 1n || last < 2n) continue
    exponents.push(last)
    let expression = power(num(base), exponents[0] ?? 0n)
    ops.forEach((op, i) => {
      const next = power(num(base), exponents[i + 1] ?? 0n)
      expression = binary(op, expression, next)
    })
    const built = { expression, value: base ** final }
    if (shows(built, 'same-base-multiplies-exponents')) return built
  }
}

// Una potenza di potenza, poi divisa per una potenza della stessa base:
// (3²)³ : 3⁴. Se la potenza di potenza resta già entro il limite, può stare
// da sola: (2²)³.
function powerOfPowerChain(random: Random): Built {
  const { base, final } = finalPower(random)
  for (;;) {
    const m = random.int(2n, 4n)
    const n = random.int(2n, 4n)
    const nested = power(group('round', power(num(base), m)), n)
    const alone = m * n <= maxExponent(base) && random.pick([true, false])
    const k = m * n - final
    if (!alone && k < 2n) continue
    const built = alone
      ? { expression: nested, value: base ** (m * n) }
      : {
          expression: binary(':', nested, power(num(base), k)),
          value: base ** final,
        }
    if (shows(built, 'power-of-power-adds-exponents')) return built
  }
}

// Due potenze con lo stesso esponente: 6³ : 2³ = 3³, 2² × 5² = 10².
function sameExponentPair(random: Random): Built {
  for (;;) {
    const result = random.int(2n, baseMax)
    const exponent = random.int(2n, maxExponent(result))
    const value = result ** exponent
    if (random.pick([true, false])) {
      const divisor = random.int(2n, 5n)
      return {
        expression: binary(
          ':',
          power(num(result * divisor), exponent),
          power(num(divisor), exponent),
        ),
        value,
      }
    }
    const factors = divisorsOf(result).filter((d) => d * d !== result)
    if (factors.length === 0) continue
    const left = random.pick(factors)
    return {
      expression: binary(
        '×',
        power(num(left), exponent),
        power(num(result / left), exponent),
      ),
      value,
    }
  }
}

/**
 * `pow.properties`: un blocco con una proprietà (stessa base, potenza di
 * potenza, stesso esponente), a volte due blocchi sommati o sottratti.
 */
export function powerProperties(random: Random): Expression {
  const block = () =>
    random.pick([sameBaseChain, powerOfPowerChain, sameExponentPair])(random)
  const blocks = random.pick([true, true, false])
    ? [block()]
    : [block(), block()]
  return sumOf(blocks, random).expression
}

// Esponente zero e negativo, e le potenze in Q. Qui le basi sono intere o
// frazioni piccole, e il valore dell'esercizio lo controlla la soluzione
// (vedi `accepts` in generators.ts): si costruisce e si guarda dove porta.

function gcd(a: bigint, b: bigint): bigint {
  a = abs(a)
  b = abs(b)
  while (b !== 0n) [a, b] = [b, a % b]
  return a
}

// Una frazione ridotta piccola, a volte negativa: 2/3, −1/2, 5/4.
function smallFraction(random: Random): Expression {
  const den = random.pick([2n, 2n, 3n, 3n, 4n, 5n])
  const numerators: bigint[] = []
  for (let n = 1n; n < 2n * den; n++)
    if (n !== den && gcd(n, den) === 1n) numerators.push(n)
  const magnitude = random.pick(numerators)
  const sign = random.pick([1n, 1n, -1n])
  return numberOf(rational(sign * magnitude, den))
}

// Un numero piccolo di Q: quasi sempre una frazione, a volte un intero.
function smallRational(random: Random): Expression {
  if (random.pick([true, true, true, false])) return smallFraction(random)
  const magnitude = random.int(1n, 5n)
  return num(random.pick([true, false]) ? -magnitude : magnitude)
}

// Una base per l'esponente zero o negativo: un intero da 2 a 5, anche
// negativo, o una frazione piccola.
function zeroNegativeBase(random: Random): Expression {
  if (random.pick([true, false])) return smallFraction(random)
  const magnitude = random.int(2n, 5n)
  return num(random.pick([true, true, false]) ? magnitude : -magnitude)
}

// a⁰: con qualunque base diversa da zero vale 1.
function zeroPower(random: Random): Expression {
  return power(zeroNegativeBase(random), 0n)
}

// a⁻ⁿ: il reciproco di aⁿ, con n da 1 a 3.
function negativePower(random: Random): Expression {
  return power(zeroNegativeBase(random), -random.int(1n, 3n))
}

// Un quoziente o un prodotto con la stessa base che porta a un esponente
// zero o negativo: 5³ : 5³, 2³ : 2⁵, 3² × 3⁻⁴.
function toZeroOrNegative(random: Random): Expression {
  const base = num(random.int(2n, 5n))
  const m = random.int(2n, 5n)
  const final = random.int(-2n, 0n)
  if (random.pick([true, true, false]))
    return binary(':', power(base, m), power(base, m - final))
  return binary('×', power(base, m), power(base, final - m))
}

/**
 * `pow.zero-negative`: uno o due blocchi, ognuno con un esponente zero o
 * negativo, scritto o in arrivo da una proprietà, a volte con una frazione
 * accanto. Ogni blocco fa vedere il suo errore tipico.
 */
export function zeroAndNegativePowers(random: Random): Expression {
  const block = (): Expression => {
    for (;;) {
      const expression = random.pick([
        zeroPower,
        negativePower,
        negativePower,
        toZeroOrNegative,
        toZeroOrNegative,
      ])(random)
      const ids: MisconceptionId[] = [
        'zero-exponent-is-zero',
        'negative-exponent-is-negative',
      ]
      if (ids.some((id) => showsIn(expression, id))) return expression
    }
  }
  // Un blocco da solo una volta su sei, più o meno.
  const blocks = [block()]
  const companion = random.pick([
    block,
    block,
    block,
    smallRational,
    smallRational,
    null,
  ])
  if (companion) blocks.push(companion(random))
  const [first, ...rest] = blocks
  if (!first) throw new RangeError('Nessun blocco')
  return rest.reduce(
    (tree, b) => binary(random.pick(['+', '-'] as const), tree, b),
    first,
  )
}

function showsIn(expression: Expression, id: MisconceptionId): boolean {
  try {
    return isVisible(id, expression, solve(expression).result)
  } catch (error) {
    if (error instanceof RangeError) return false
    throw error
  }
}

// Una potenza di Q: base intera piccola o frazione, esponente da −2 a 3.
function qPower(random: Random): Expression {
  const base = random.pick([true, true, false])
    ? smallFraction(random)
    : num(random.int(2n, 3n) * random.pick([1n, -1n]))
  return power(base, random.pick([2n, 2n, 3n, -1n, -2n]))
}

// Una parentesi tonda con una somma algebrica dentro, elevata: (1/2 − 1)².
function qGroupPower(random: Random): Expression {
  const inner = binary(
    random.pick(['+', '-'] as const),
    smallRational(random),
    smallRational(random),
  )
  return power(group('round', inner), random.pick([2n, 2n, 3n, -1n]))
}

// Una quadra con una potenza e un numero, a volte per un numero:
// [(1/2)² + 3/4] : 1/2.
function qBracket(random: Random): Expression {
  const raised = random.pick([qPower, qGroupPower])(random)
  const inner = binary(
    random.pick(['+', '-'] as const),
    raised,
    smallRational(random),
  )
  // Con una parentesi dentro, anche solo quella di (−2) o di (1/2), la
  // parentesi fuori è una quadra.
  const plainBase =
    raised.kind === 'binary' &&
    raised.left.kind === 'number' &&
    raised.left.value.den === 1n &&
    raised.left.value.num > 0n
  const bracketed = group(plainBase ? 'round' : 'square', inner)
  return random.pick([true, false])
    ? bracketed
    : binary(random.pick(['×', ':'] as const), bracketed, smallRational(random))
}

// Un termine di un'espressione con le potenze in Q.
function qPowerTerm(random: Random): Expression {
  return random.pick([
    qPower,
    qGroupPower,
    qBracket,
    (r: Random) =>
      binary(random.pick(['×', ':'] as const), qPower(r), smallRational(r)),
  ])(random)
}

/**
 * `pow.expressions`: due o tre termini con potenze di frazioni, basi
 * negative, esponenti negativi e parentesi, sommati o sottratti.
 */
export function powerExpressions(random: Random): Expression {
  const count = random.pick([2, 2, 3])
  let tree = qPowerTerm(random)
  for (let i = 1; i < count; i++)
    tree = binary(
      random.pick(['+', '-'] as const),
      tree,
      random.pick([true, true, false])
        ? qPowerTerm(random)
        : smallRational(random),
    )
  return tree
}

function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}
