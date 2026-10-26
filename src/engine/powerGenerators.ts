import {
  binary,
  group,
  num,
  power,
  type Expression,
  type Operator,
} from './expression.ts'
import { isVisible, type MisconceptionId } from './misconceptions.ts'
import type { Random } from './random.ts'
import { rational } from './rational.ts'

// I generatori del capitolo sulle potenze, con basi naturali. Le potenze
// restano nel calcolo mentale: base fino a 10, valore fino a 125 (5³). Le
// proprietà lavorano con esponenti anche grandi, ma la potenza che resta da
// calcolare alla fine rispetta lo stesso limite. Vedi SPEC.md, "Generatore".

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

function divisorsOf(n: bigint): bigint[] {
  const ds: bigint[] = []
  for (let d = 2n; d < n && d <= 20n; d++) if (n % d === 0n) ds.push(d)
  return ds
}

// Un termine con una potenza: da sola, con la base fra parentesi, per un
// numero o divisa per un suo divisore.
function powerTerm(random: Random): Built {
  const p = random.pick([plainPower, groupPower])(random)
  const options: (() => Built)[] = [() => p]
  if (p.value * 2n <= productMax) {
    const factor = () => random.int(2n, min(9n, productMax / p.value))
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
  const ds = divisorsOf(p.value)
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
 * `pow.basics`: una potenza da sola, oppure una somma di due o tre termini
 * in cui almeno uno ha una potenza. Le potenze non stanno mai una accanto
 * all'altra in un prodotto, così nessuna proprietà anticipa la lezione.
 */
export function basicPowers(random: Random): Expression {
  // Una potenza da sola ogni quattro esercizi, più o meno.
  const count = random.pick([1, 2, 2, 3])
  if (count === 1) return plainPower(random).expression
  const terms = Array.from({ length: count }, (_, i) =>
    i === 0 || random.pick([true, false]) ? powerTerm(random) : literal(random),
  )
  const first = terms.shift()
  if (!first) throw new RangeError('Nessun termine')
  terms.splice(Number(random.int(0n, BigInt(terms.length))), 0, first)
  return sumOf(terms, random).expression
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

function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}
