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
// meno davanti a un gruppo, −(3 − 7), è un gruppo con `negated`.

export type Operator = '+' | '-' | '×' | ':'

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

export function isMulDiv(op: Operator): boolean {
  return op === '×' || op === ':'
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
}

const open = { round: '(', square: '[', curly: '{' }
const close = { round: ')', square: ']', curly: '}' }

const textSymbols: Symbols = {
  op: { '+': '+', '-': '−', '×': '×', ':': ':' },
  minus: '−',
  magnitude: (r) => (isInteger(r) ? `${r.num}` : `${r.num}/${r.den}`),
  enclose: (bracket, inner) => `${open[bracket]}${inner}${close[bracket]}`,
}

const katexOpen = { round: '(', square: '[', curly: '\\{' }
const katexClose = { round: ')', square: ']', curly: '\\}' }

const katexSymbols: Symbols = {
  op: { '+': '+', '-': '-', '×': '\\times', ':': '\\mathbin{:}' },
  minus: '-',
  magnitude: (r) => (isInteger(r) ? `${r.num}` : `\\frac{${r.num}}{${r.den}}`),
  // Intorno a una frazione le parentesi crescono con lei.
  enclose: (bracket, inner, tall) =>
    tall
      ? `\\left${katexOpen[bracket]}${inner}\\right${katexClose[bracket]}`
      : `${katexOpen[bracket]}${inner}${katexClose[bracket]}`,
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

function render(e: Expression, symbols: Symbols, leading: boolean): string {
  switch (e.kind) {
    case 'number':
      return renderNumber(e, symbols, leading)
    case 'binary':
      return `${render(e.left, symbols, leading)} ${symbols.op[e.op]} ${render(e.right, symbols, false)}`
    case 'group': {
      const tall = hasFraction(e.inner)
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
// la linea di frazione.
const tokenPattern = /\s*(?:(\d+)|([+\-−×·*:÷/()[\]{}]))/y
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
    tokens.push(match[1] ?? match[2] ?? '')
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
  // All'inizio di un'espressione o di un gruppo il primo fattore può avere
  // il segno: −3, +4, −(3 − 7).
  const leadingFactor = (): Expression => {
    const sign = operatorOf[tokens[i] ?? '']
    if (sign !== '+' && sign !== '-') return factor()
    i++
    const bracket = openBracket[tokens[i] ?? '']
    if (bracket) {
      if (sign === '+') throw fail()
      return bracketed(bracket, true)
    }
    const value = magnitude()
    return sign === '-'
      ? literal(rational(-value.num, value.den))
      : literal(value, { plus: true })
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
    chain(leading ? leadingFactor() : factor(), factor, isMulDiv)
  function sum(): Expression {
    return chain(
      product(true),
      () => product(false),
      (op) => !isMulDiv(op),
    )
  }

  const tree = sum()
  if (i < tokens.length) throw fail()
  return tree
}
