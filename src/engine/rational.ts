// Un razionale è una coppia di bigint normalizzata: denominatore positivo,
// MCD 1. Ogni costruzione passa da `rational`, così la forma è sempre quella.

export interface Rational {
  readonly num: bigint
  readonly den: bigint
}

function abs(n: bigint): bigint {
  return n < 0n ? -n : n
}

function gcd(a: bigint, b: bigint): bigint {
  a = abs(a)
  b = abs(b)
  while (b !== 0n) [a, b] = [b, a % b]
  return a
}

export function rational(num: bigint, den = 1n): Rational {
  if (den === 0n) throw new RangeError('Denominatore zero')
  if (num === 0n) return { num: 0n, den: 1n }
  const sign = den < 0n ? -1n : 1n
  const g = gcd(num, den)
  return { num: (sign * num) / g, den: (sign * den) / g }
}

export function add(a: Rational, b: Rational): Rational {
  return rational(a.num * b.den + b.num * a.den, a.den * b.den)
}

export function sub(a: Rational, b: Rational): Rational {
  return rational(a.num * b.den - b.num * a.den, a.den * b.den)
}

export function mul(a: Rational, b: Rational): Rational {
  return rational(a.num * b.num, a.den * b.den)
}

export function div(a: Rational, b: Rational): Rational {
  if (b.num === 0n) throw new RangeError('Divisione per zero')
  return rational(a.num * b.den, a.den * b.num)
}

export function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  const d = a.num * b.den - b.num * a.den
  return d < 0n ? -1 : d > 0n ? 1 : 0
}

export function equals(a: Rational, b: Rational): boolean {
  return compare(a, b) === 0
}

export function isInteger(r: Rational): boolean {
  return r.den === 1n
}

export function rationalToText(r: Rational): string {
  return isInteger(r) ? `${r.num}` : `${r.num}/${r.den}`
}
