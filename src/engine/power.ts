import {
  binary,
  group,
  isAddSub,
  power,
  type Expression,
  type Operator,
} from './expression.ts'
import { div, equals, mul, rational, type Rational } from './rational.ts'

// Le potenze: il calcolo, le proprietà che il risolutore applica prima di
// calcolare e le letture sbagliate degli errori tipici. Vedi SPEC.md,
// "Risolutore" e "Errori tipici".

/** `base` elevato a `exponent`. Con l'esponente negativo, il reciproco. */
export function raise(base: Rational, exponent: bigint): Rational {
  if (exponent < 0n) return raise(div(rational(1n), base), -exponent)
  if (exponent === 0n && base.num === 0n)
    throw new RangeError('0⁰ non ha significato')
  return rational(base.num ** exponent, base.den ** exponent)
}

/** Una potenza con base ed esponente già numeri: `2³`. */
export interface NumericPower {
  readonly base: Rational
  readonly exponent: bigint
}

export function numericPower(e: Expression): NumericPower | null {
  if (e.kind !== 'binary' || e.op !== '^') return null
  if (e.left.kind !== 'number' || e.right.kind !== 'number') return null
  if (e.right.value.den !== 1n) return null
  return { base: e.left.value, exponent: e.right.value.num }
}

/**
 * Una potenza di potenza, `(3²)³`: la base è una parentesi con dentro una
 * potenza di numeri. Il risolutore la tratta come un'unica potenza, non come
 * un gruppo da svolgere.
 */
export function powerOfPower(
  e: Expression,
): { readonly inner: NumericPower; readonly exponent: bigint } | null {
  if (e.kind !== 'binary' || e.op !== '^') return null
  if (e.left.kind !== 'group' || e.right.kind !== 'number') return null
  const inner = numericPower(e.left.inner)
  if (!inner || e.right.value.den !== 1n) return null
  return { inner, exponent: e.right.value.num }
}

const valueOf = ({ base, exponent }: NumericPower) => raise(base, exponent)

const numeric = (value: Rational): Expression => ({ kind: 'number', value })
const powerOf = (base: Rational, exponent: bigint) =>
  power(numeric(base), exponent)

export type PropertyRule =
  | 'same-base-product'
  | 'same-base-quotient'
  | 'power-of-power'
  | 'same-exponent-product'
  | 'same-exponent-quotient'

/** Una proprietà applicata a un nodo: che cosa c'era, che cosa diventa. */
export interface PropertyStep {
  readonly rule: PropertyRule
  readonly operation: Expression
  readonly outcome: Expression
  // I valori, come in ogni passaggio: le due potenze e il risultato.
  readonly left: Rational
  readonly op: Operator
  readonly right: Rational
  readonly result: Rational
}

// La proprietà che si applica proprio a questo nodo, se ce n'è una. La
// stessa base vince sullo stesso esponente: 2³ × 2³ fa 2⁶.
function propertyAt(e: Expression): PropertyStep | null {
  const nested = powerOfPower(e)
  if (nested) {
    const exponent = nested.inner.exponent * nested.exponent
    const left = valueOf(nested.inner)
    return {
      rule: 'power-of-power',
      operation: e,
      outcome: powerOf(nested.inner.base, exponent),
      left,
      op: '^',
      right: rational(nested.exponent),
      result: raise(left, nested.exponent),
    }
  }
  if (e.kind !== 'binary' || (e.op !== '×' && e.op !== ':')) return null
  const a = numericPower(e.left)
  const b = numericPower(e.right)
  if (!a || !b) return null
  const product = e.op === '×'
  const values = { left: valueOf(a), op: e.op, right: valueOf(b) }
  const result = product
    ? mul(values.left, values.right)
    : div(values.left, values.right)
  if (equals(a.base, b.base))
    return {
      rule: product ? 'same-base-product' : 'same-base-quotient',
      operation: e,
      outcome: powerOf(
        a.base,
        product ? a.exponent + b.exponent : a.exponent - b.exponent,
      ),
      ...values,
      result,
    }
  if (a.exponent === b.exponent)
    return {
      rule: product ? 'same-exponent-product' : 'same-exponent-quotient',
      operation: e,
      outcome: powerOf(
        product ? mul(a.base, b.base) : div(a.base, b.base),
        a.exponent,
      ),
      ...values,
      result,
    }
  return null
}

export interface PropertyReduction {
  readonly expression: Expression
  readonly step: PropertyStep
}

/**
 * Applica la prima proprietà, da sinistra, senza entrare nei gruppi. Le
 * proprietà valgono fra potenze vicine nella stessa catena di × e :, come
 * nell'ordine da sinistra a destra.
 */
export function applyFirstProperty(e: Expression): PropertyReduction | null {
  if (e.kind !== 'binary') return null
  if (e.op !== '^') {
    const left = applyFirstProperty(e.left)
    if (left)
      return { ...left, expression: binary(e.op, left.expression, e.right) }
  }
  const step = propertyAt(e)
  if (step) return { expression: step.outcome, step }
  if (e.op === '^') return null
  const right = applyFirstProperty(e.right)
  if (right)
    return { ...right, expression: binary(e.op, e.left, right.expression) }
  return null
}

// Le letture sbagliate delle potenze, per gli errori tipici: ognuna riscrive
// l'albero come lo legge chi sbaglia, poi l'albero si valuta con le regole
// giuste.

function rewrite(
  e: Expression,
  at: (e: Expression) => Expression | null,
): Expression {
  const here = at(e)
  if (here) return here
  if (e.kind === 'group') return group(e.bracket, rewrite(e.inner, at))
  if (e.kind === 'binary')
    return binary(e.op, rewrite(e.left, at), rewrite(e.right, at))
  return e
}

/** (3²)³ letto come 3⁵: gli esponenti sommati invece che moltiplicati. */
export function addExponentsOfPowerOfPower(e: Expression): Expression {
  return rewrite(e, (node) => {
    const nested = powerOfPower(node)
    if (!nested) return null
    return powerOf(nested.inner.base, nested.inner.exponent + nested.exponent)
  })
}

/**
 * 2⁵ × 2³ letto come 2¹⁵: gli esponenti moltiplicati invece che sommati, e
 * nel quoziente divisi invece che sottratti, quando la divisione è esatta.
 * Si rilegge dal basso, così in 2⁵ × 2³ : 2⁴ la lettura va avanti da
 * sinistra.
 */
export function multiplyExponentsOfSameBase(e: Expression): Expression {
  if (e.kind === 'group')
    return group(e.bracket, multiplyExponentsOfSameBase(e.inner))
  if (e.kind !== 'binary') return e
  const left = multiplyExponentsOfSameBase(e.left)
  const right = multiplyExponentsOfSameBase(e.right)
  const a = numericPower(left)
  const b = numericPower(right)
  if (a && b && equals(a.base, b.base)) {
    if (e.op === '×') return powerOf(a.base, a.exponent * b.exponent)
    if (e.op === ':' && b.exponent !== 0n && a.exponent % b.exponent === 0n)
      return powerOf(a.base, a.exponent / b.exponent)
  }
  return binary(e.op, left, right)
}

/** (2 + 3)² letto come 2² + 3²: l'esponente distribuito sui termini. */
export function distributeExponentOverSum(e: Expression): Expression {
  return rewrite(e, (node) => {
    if (node.kind !== 'binary' || node.op !== '^') return null
    if (node.left.kind !== 'group' || node.right.kind !== 'number') return null
    const { inner, bracket } = node.left
    if (inner.kind !== 'binary' || !isAddSub(inner.op)) return null
    const exponent = node.right
    const distribute = (term: Expression): Expression =>
      term.kind === 'binary' && isAddSub(term.op)
        ? binary(term.op, distribute(term.left), distribute(term.right))
        : binary(
            '^',
            term.kind === 'number' ? term : group('round', term),
            exponent,
          )
    return group(bracket, distribute(inner))
  })
}
