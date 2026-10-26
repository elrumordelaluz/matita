import { isInteger, rational, type Rational } from './rational.ts'

// L'albero di un'espressione: numeri, operazioni binarie e gruppi. Vedi
// SPEC.md, "Motore".
//
// L'albero rispetta la precedenza: un nodo + o − non sta mai sotto un nodo ×
// o : senza un gruppo in mezzo, e le catene della stessa priorità sono
// associate a sinistra. Per questo la resa non aggiunge parentesi.
//
// Un numero relativo è un nodo `number` con valore negativo, una frazione un
// nodo `number` con valore non intero: il valore è sempre un razionale. Il
// meno davanti a un gruppo, −(3 − 7), è un gruppo con `negated`; il meno
// davanti a una potenza, −3², è lo stesso gruppo intorno alla potenza, che
// non disegna le parentesi perché la potenza lega più del meno.
//
// La potenza è un nodo binario con l'operatore `^`: a sinistra la base, un
// numero o un gruppo, a destra l'esponente, sempre un numero intero. Lega più
// di × e :, e non si concatena: una potenza di potenza ha la base fra
// parentesi, come sul libro.

export type Operator = '+' | '-' | '×' | ':' | '^'

/** Il tipo di parentesi di un gruppo: tonda, quadra o graffa. */
export type Bracket = 'round' | 'square' | 'curly'

export type Expression =
  | {
      readonly kind: 'number'
      readonly value: Rational
      /** Un positivo scritto con il suo segno, come numero relativo: (+4). */
      readonly plus?: true
    }
  | {
      readonly kind: 'binary'
      readonly op: Operator
      readonly left: Expression
      readonly right: Expression
    }
  | {
      readonly kind: 'group'
      readonly bracket: Bracket
      readonly inner: Expression
      /** Il gruppo è preceduto dal meno: −(3 − 7). */
      readonly negated?: true
    }

export function num(value: bigint): Expression {
  return { kind: 'number', value: rational(value) }
}

export function frac(numerator: bigint, denominator: bigint): Expression {
  return { kind: 'number', value: rational(numerator, denominator) }
}

/** Un numero dal suo valore; con `plus` un positivo si scrive (+4). */
export function literal(
  value: Rational,
  { plus = false }: { plus?: boolean } = {},
): Expression {
  return plus && value.num > 0n
    ? { kind: 'number', value, plus: true }
    : { kind: 'number', value }
}

export function binary(
  op: Operator,
  left: Expression,
  right: Expression,
): Expression {
  return { kind: 'binary', op, left, right }
}

export function group(
  bracket: Bracket,
  inner: Expression,
  { negated = false }: { negated?: boolean } = {},
): Expression {
  return negated
    ? { kind: 'group', bracket, inner, negated: true }
    : { kind: 'group', bracket, inner }
}

/** La potenza `base^exponent`. L'esponente può essere negativo. */
export function power(base: Expression, exponent: bigint): Expression {
  return binary('^', base, num(exponent))
}

export function isMulDiv(op: Operator): boolean {
  return op === '×' || op === ':'
}

export function isAddSub(op: Operator): boolean {
  return op === '+' || op === '-'
}

export function isPower(op: Operator): boolean {
  return op === '^'
}

// L'esponente di una potenza: un numero intero, per costruzione.
function exponentOf(e: Expression): bigint {
  if (e.kind !== 'number' || e.value.den !== 1n)
    throw new RangeError('Esponente non intero')
  return e.value.num
}

const superscriptDigits = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const superscriptMinus = '⁻'

// L'esponente in cifre ad apice, come si scrive a mano: 2³, 10⁻².
function superscript(n: bigint): string {
  const digits = [...`${n < 0n ? -n : n}`].map(
    (d) => superscriptDigits[Number(d)] ?? '',
  )
  return `${n < 0n ? superscriptMinus : ''}${digits.join('')}`
}

function fromSuperscript(text: string): bigint {
  const negative = text.startsWith(superscriptMinus)
  const digits = [...(negative ? text.slice(1) : text)]
    .map((c) => superscriptDigits.indexOf(c))
    .join('')
  return negative ? -BigInt(digits) : BigInt(digits)
}

/** Il meno davanti alla potenza `p`: −3², −(2 + 1)². */
export function negatedPower(p: Expression): Expression {
  return group('round', p, { negated: true })
}

/**
 * Un meno davanti a una potenza, −3²: il gruppo con `negated` intorno a una
 * potenza. Si scrive senza parentesi e non è un gruppo da svolgere: il meno
 * resta fuori mentre si calcola la potenza.
 */
export function isNegatedPower(e: Expression): boolean {
  return (
    e.kind === 'group' &&
    e.negated === true &&
    e.inner.kind === 'binary' &&
    e.inner.op === '^'
  )
}

/**
 * Un gruppo preceduto dal meno con dentro un solo numero, −(−4): non è più
 * un gruppo da svolgere ma un numero a cui cambiare segno.
 */
export function isSignChange(e: Expression): boolean {
  return e.kind === 'group' && e.negated === true && e.inner.kind === 'number'
}

// La resa. Un numero con il segno scritto (negativo o con `plus`) va fra
// tonde, (−3), tranne all'inizio dell'espressione o di un gruppo: −3 + 5,
// [−2 + (3 − 7)]. "All'inizio" vuol dire la foglia più a sinistra: la
// posizione iniziale passa solo al ramo sinistro di un'operazione e
// ricomincia dentro ogni gruppo.

interface Symbols {
  readonly op: Record<Operator, string>
  readonly minus: string
  readonly magnitude: (r: Rational) => string
  /** Racchiude fra parentesi; `tall` se dentro c'è una frazione. */
  readonly enclose: (bracket: Bracket, inner: string, tall: boolean) => string
  /** La base già resa, con l'esponente in alto. */
  readonly power: (base: string, exponent: bigint) => string
}

const open = { round: '(', square: '[', curly: '{' }
const close = { round: ')', square: ']', curly: '}' }

const textSymbols: Symbols = {
  op: { '+': '+', '-': '−', '×': '×', ':': ':', '^': '^' },
  minus: '−',
  magnitude: (r) => (isInteger(r) ? `${r.num}` : `${r.num}/${r.den}`),
  enclose: (bracket, inner) => `${open[bracket]}${inner}${close[bracket]}`,
  power: (base, exponent) => `${base}${superscript(exponent)}`,
}

const katexOpen = { round: '(', square: '[', curly: '\\{' }
const katexClose = { round: ')', square: ']', curly: '\\}' }

const katexSymbols: Symbols = {
  op: { '+': '+', '-': '-', '×': '\\times', ':': '\\mathbin{:}', '^': '^' },
  minus: '-',
  magnitude: (r) => (isInteger(r) ? `${r.num}` : `\\frac{${r.num}}{${r.den}}`),
  // Intorno a una frazione le parentesi crescono con lei.
  enclose: (bracket, inner, tall) =>
    tall
      ? `\\left${katexOpen[bracket]}${inner}\\right${katexClose[bracket]}`
      : `${katexOpen[bracket]}${inner}${katexClose[bracket]}`,
  // Le graffe tengono insieme la base: l'apice va sopra tutto il numero o
  // tutta la parentesi.
  power: (base, exponent) => `{${base}}^{${exponent}}`,
}

function abs(r: Rational): Rational {
  return r.num < 0n ? { num: -r.num, den: r.den } : r
}

function hasFraction(e: Expression): boolean {
  if (e.kind === 'number') return !isInteger(e.value)
  if (e.kind === 'group') return hasFraction(e.inner)
  return hasFraction(e.left) || hasFraction(e.right)
}

// `sign`: il segno si scrive anche per un positivo, come in −(+3).
function renderNumber(
  e: Extract<Expression, { kind: 'number' }>,
  symbols: Symbols,
  leading: boolean,
  sign = false,
): string {
  const { value } = e
  const prefix = value.num < 0n ? symbols.minus : e.plus || sign ? '+' : ''
  const text = `${prefix}${symbols.magnitude(abs(value))}`
  return prefix && !leading
    ? symbols.enclose('round', text, !isInteger(value))
    : text
}

// La base non sta mai all'inizio: un numero relativo va fra tonde, (−3)².
// Anche una frazione va fra tonde, (2/3)², perché l'esponente è di tutta la
// frazione.
function renderPower(
  base: Expression,
  exponent: Expression,
  symbols: Symbols,
): string {
  const text = render(base, symbols, false)
  const bareFraction =
    base.kind === 'number' &&
    !isInteger(base.value) &&
    base.value.num > 0n &&
    !base.plus
  return symbols.power(
    bareFraction ? symbols.enclose('round', text, true) : text,
    exponentOf(exponent),
  )
}

function render(e: Expression, symbols: Symbols, leading: boolean): string {
  switch (e.kind) {
    case 'number':
      return renderNumber(e, symbols, leading)
    case 'binary':
      if (isPower(e.op)) return renderPower(e.left, e.right, symbols)
      return `${render(e.left, symbols, leading)} ${symbols.op[e.op]} ${render(e.right, symbols, false)}`
    case 'group': {
      const tall = hasFraction(e.inner)
      if (isNegatedPower(e)) {
        const negated = `${symbols.minus}${render(e.inner, symbols, true)}`
        return leading ? negated : symbols.enclose('round', negated, tall)
      }
      const inner =
        e.negated && e.inner.kind === 'number'
          ? renderNumber(e.inner, symbols, true, true)
          : render(e.inner, symbols, true)
      const text = symbols.enclose(e.bracket, inner, tall)
      if (!e.negated) return text
      // Lontano dall'inizio anche il meno davanti al gruppo va fra tonde.
      const negated = `${symbols.minus}${text}`
      return leading ? negated : symbols.enclose('round', negated, tall)
    }
  }
}

export interface RenderOptions {
  /**
   * Se l'espressione sta all'inizio (di tutto o di un gruppo): lì un numero
   * negativo non va fra parentesi. Vero se non si dice.
   */
  readonly leading?: boolean
}

export function toText(e: Expression, { leading = true }: RenderOptions = {}) {
  return render(e, textSymbols, leading)
}

export function toKatex(e: Expression, { leading = true }: RenderOptions = {}) {
  return render(e, katexSymbols, leading)
}

// Lettura di un'espressione scritta a mano, per i test e per le lezioni.
// Legge quello che scrive `toText`: un segno davanti a un numero o a un
// gruppo solo all'inizio, altrove il numero relativo fra tonde; la barra è
// la linea di frazione. L'esponente si scrive ad apice (2³) o dopo `^` (2^3).
const tokenPattern = /\s*(?:(\d+)|(⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)|([+\-−×·*:÷/()[\]{}^]))/y
const superscriptToken = /^⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/
const operatorOf: Partial<Record<string, Operator>> = {
  '+': '+',
  '-': '-',
  '−': '-',
  '×': '×',
  '·': '×',
  '*': '×',
  ':': ':',
  '÷': ':',
}

const openBracket: Partial<Record<string, Bracket>> = {
  '(': 'round',
  '[': 'square',
  '{': 'curly',
}

const isDigits = (t: string | undefined): t is string =>
  t !== undefined && /^\d+$/.test(t)

export function parseExpression(source: string): Expression {
  const fail = () => new SyntaxError(`Espressione non valida: ${source}`)
  const tokens: string[] = []
  tokenPattern.lastIndex = 0
  while (tokenPattern.lastIndex < source.trimEnd().length) {
    const match = tokenPattern.exec(source)
    if (!match) throw fail()
    tokens.push(match[1] ?? match[2] ?? match[3] ?? '')
  }

  let i = 0
  // Un numero senza segno, intero o frazione.
  const magnitude = (): Rational => {
    const t = tokens[i++]
    if (!isDigits(t)) throw fail()
    if (tokens[i] !== '/') return rational(BigInt(t))
    i++
    const den = tokens[i++]
    if (!isDigits(den) || BigInt(den) === 0n) throw fail()
    return rational(BigInt(t), BigInt(den))
  }
  // Un gruppo. Le tonde intorno a un solo numero con il segno sono la
  // scrittura del numero relativo, (−3), non un gruppo; lo stesso per le
  // tonde intorno a un meno davanti a un gruppo.
  const bracketed = (bracket: Bracket, negated: boolean): Expression => {
    i++
    let inner = sum()
    if (tokens[i++] !== close[bracket]) throw fail()
    if (negated && inner.kind === 'number') inner = literal(inner.value)
    if (bracket === 'round' && !negated) {
      if (inner.kind === 'number' && (inner.plus || inner.value.num < 0n))
        return inner
      if (inner.kind === 'group' && inner.negated) return inner
    }
    return group(bracket, inner, { negated })
  }
  const factor = (): Expression => {
    const bracket = openBracket[tokens[i] ?? '']
    if (bracket) return bracketed(bracket, false)
    return literal(magnitude())
  }
  const hasExponent = () =>
    tokens[i] === '^' || superscriptToken.test(tokens[i] ?? '')
  // All'inizio di un'espressione o di un gruppo il primo fattore può avere
  // il segno: −3, +4, −(3 − 7). Davanti a una potenza il meno vale per
  // tutta la potenza, come sul libro: −3² è −(3²), non (−3)².
  const leadingFactor = (): Expression => {
    const sign = operatorOf[tokens[i] ?? '']
    if (sign !== '+' && sign !== '-') return raised(factor())
    i++
    const bracket = openBracket[tokens[i] ?? '']
    if (bracket) {
      if (sign === '+') throw fail()
      const negated = bracketed(bracket, true)
      if (!hasExponent() || negated.kind !== 'group') return negated
      // −(3 − 7)²: la base è la parentesi senza il meno.
      const { inner } = negated
      const base =
        bracket === 'round' && inner.kind === 'number'
          ? inner
          : group(bracket, inner)
      return negatedPower(raised(base))
    }
    const value = magnitude()
    if (sign === '-' && hasExponent())
      return negatedPower(raised(literal(value)))
    return raised(
      sign === '-'
        ? literal(rational(-value.num, value.den))
        : literal(value, { plus: true }),
    )
  }
  // Una base con il suo esponente, se c'è. Dopo `^` l'esponente può avere
  // il segno meno. Le tonde intorno a una frazione sono la sua scrittura come
  // base, (2/3)², non un gruppo.
  const raised = (written: Expression): Expression => {
    const base =
      written.kind === 'group' &&
      written.bracket === 'round' &&
      !written.negated &&
      written.inner.kind === 'number' &&
      !isInteger(written.inner.value) &&
      hasExponent()
        ? written.inner
        : written
    const t = tokens[i] ?? ''
    if (superscriptToken.test(t)) {
      i++
      return power(base, fromSuperscript(t))
    }
    if (t !== '^') return base
    i++
    const negative = operatorOf[tokens[i] ?? ''] === '-'
    if (negative) i++
    const digits = tokens[i++]
    if (digits === undefined || !/^\d+$/.test(digits)) throw fail()
    return power(base, negative ? -BigInt(digits) : BigInt(digits))
  }
  const chain = (
    first: Expression,
    operand: () => Expression,
    accepts: (op: Operator) => boolean,
  ): Expression => {
    let tree = first
    for (;;) {
      const op = operatorOf[tokens[i] ?? '']
      if (op === undefined || !accepts(op)) return tree
      i++
      tree = binary(op, tree, operand())
    }
  }
  const product = (leading: boolean) =>
    chain(
      leading ? leadingFactor() : raised(factor()),
      () => raised(factor()),
      isMulDiv,
    )
  function sum(): Expression {
    return chain(product(true), () => product(false), isAddSub)
  }

  const tree = sum()
  if (i < tokens.length) throw fail()
  return tree
}
