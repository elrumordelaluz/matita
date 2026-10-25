import { rational, rationalToText, type Rational } from './rational.ts'

// L'albero di un'espressione: numeri, operazioni binarie e gruppi. Il meno
// unario entra con la slice che lo usa (vedi SPEC.md, "Motore").
//
// L'albero rispetta la precedenza: un nodo + o − non sta mai sotto un nodo ×
// o : senza un gruppo in mezzo, e le catene della stessa priorità sono
// associate a sinistra. Per questo la resa non aggiunge parentesi.

export type Operator = '+' | '-' | '×' | ':'

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

export function isMulDiv(op: Operator): boolean {
  return op === '×' || op === ':'
}

interface Symbols {
  readonly op: Record<Operator, string>
  readonly open: Record<Bracket, string>
  readonly close: Record<Bracket, string>
}

const textOperator: Record<Operator, string> = {
  '+': '+',
  '-': '−',
  '×': '×',
  ':': ':',
}
const katexOperator: Record<Operator, string> = {
  '+': '+',
  '-': '-',
  '×': '\\times',
  ':': '\\mathbin{:}',
}

const textSymbols: Symbols = {
  op: textOperator,
  open: { round: '(', square: '[', curly: '{' },
  close: { round: ')', square: ']', curly: '}' },
}
const katexSymbols: Symbols = {
  op: katexOperator,
  open: { round: '(', square: '[', curly: '\\{' },
  close: { round: ')', square: ']', curly: '\\}' },
}

function render(e: Expression, symbols: Symbols): string {
  switch (e.kind) {
    case 'number':
      return rationalToText(e.value)
    case 'binary':
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
const tokenPattern = /\s*(?:(\d+)|([+\-−×·*:÷()[\]{}]))/y
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
    tokens.push(match[1] ?? match[2] ?? '')
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
  const product = () => chain(factor, isMulDiv)
  function sum() {
    return chain(product, (op) => !isMulDiv(op))
  }

  const tree = sum()
  if (i < tokens.length) throw fail()
  return tree
}
