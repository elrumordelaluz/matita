import { rational, rationalToText, type Rational } from './rational.ts'

// L'albero di un'espressione: numeri, operazioni binarie e gruppi. Il meno
// unario entra con la slice che lo usa (vedi SPEC.md, "Motore").
//
// L'albero rispetta la precedenza: un nodo + o − non sta mai sotto un nodo ×
// o : senza un gruppo in mezzo, e le catene della stessa priorità sono
// associate a sinistra. Per questo la resa non aggiunge parentesi.
//
// La potenza è un nodo binario con l'operatore `^`: a sinistra la base, un
// numero o un gruppo, a destra l'esponente, sempre un numero intero. Lega più
// di × e :, e non si concatena: una potenza di potenza ha la base fra
// parentesi, come sul libro.

export type Operator = '+' | '-' | '×' | ':' | '^'

/** Il tipo di parentesi di un gruppo: tonda, quadra o graffa. */
export type Bracket = 'round' | 'square' | 'curly'

export type Expression =
  | { readonly kind: 'number'; readonly value: Rational }
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
    }

export function num(value: bigint): Expression {
  return { kind: 'number', value: rational(value) }
}

export function binary(
  op: Operator,
  left: Expression,
  right: Expression,
): Expression {
  return { kind: 'binary', op, left, right }
}

export function group(bracket: Bracket, inner: Expression): Expression {
  return { kind: 'group', bracket, inner }
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

interface Symbols {
  readonly op: Record<Operator, string>
  readonly open: Record<Bracket, string>
  readonly close: Record<Bracket, string>
  /** La base già resa, con l'esponente in alto. */
  power(base: string, exponent: bigint): string
}

const textOperator: Record<Operator, string> = {
  '+': '+',
  '-': '−',
  '×': '×',
  ':': ':',
  '^': '^',
}
const katexOperator: Record<Operator, string> = {
  '+': '+',
  '-': '-',
  '×': '\\times',
  ':': '\\mathbin{:}',
  '^': '^',
}

const textSymbols: Symbols = {
  op: textOperator,
  open: { round: '(', square: '[', curly: '{' },
  close: { round: ')', square: ']', curly: '}' },
  power: (base, exponent) => `${base}${superscript(exponent)}`,
}
const katexSymbols: Symbols = {
  op: katexOperator,
  open: { round: '(', square: '[', curly: '\\{' },
  close: { round: ')', square: ']', curly: '\\}' },
  // Le graffe tengono insieme la base: l'apice va sopra tutto il numero o
  // tutta la parentesi.
  power: (base, exponent) => `{${base}}^{${exponent}}`,
}

function render(e: Expression, symbols: Symbols): string {
  switch (e.kind) {
    case 'number':
      return rationalToText(e.value)
    case 'binary':
      if (isPower(e.op))
        return symbols.power(render(e.left, symbols), exponentOf(e.right))
      return `${render(e.left, symbols)} ${symbols.op[e.op]} ${render(e.right, symbols)}`
    case 'group':
      return `${symbols.open[e.bracket]}${render(e.inner, symbols)}${symbols.close[e.bracket]}`
  }
}

export function toText(e: Expression): string {
  return render(e, textSymbols)
}

export function toKatex(e: Expression): string {
  return render(e, katexSymbols)
}

// Lettura di un'espressione scritta a mano, per i test e per le lezioni.
// L'esponente si scrive ad apice (2³) o dopo `^` (2^3).
const tokenPattern = /\s*(?:(\d+)|(⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)|([+\-−×·*:÷()[\]{}^]))/y
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
const closeBracket: Record<Bracket, string> = {
  round: ')',
  square: ']',
  curly: '}',
}

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
  const factor = (): Expression => {
    const t = tokens[i++]
    const bracket = openBracket[t ?? '']
    if (bracket) {
      const inner = sum()
      if (tokens[i++] !== closeBracket[bracket]) throw fail()
      return group(bracket, inner)
    }
    if (t === undefined || !/^\d+$/.test(t)) throw fail()
    return num(BigInt(t))
  }
  // Una base con il suo esponente, se c'è. Dopo `^` l'esponente può avere
  // il segno meno.
  const raised = (): Expression => {
    const base = factor()
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
    operand: () => Expression,
    accepts: (op: Operator) => boolean,
  ): Expression => {
    let tree = operand()
    for (;;) {
      const op = operatorOf[tokens[i] ?? '']
      if (op === undefined || !accepts(op)) return tree
      i++
      tree = binary(op, tree, operand())
    }
  }
  const product = () => chain(raised, isMulDiv)
  function sum() {
    return chain(product, isAddSub)
  }

  const tree = sum()
  if (i < tokens.length) throw fail()
  return tree
}
