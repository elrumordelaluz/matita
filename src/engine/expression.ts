import { rational, rationalToText, type Rational } from './rational.ts'

// L'albero di un'espressione: numeri e operazioni binarie. Il meno unario e i
// gruppi entrano con le slice che li usano (vedi SPEC.md, "Motore").
//
// L'albero rispetta la precedenza: un nodo + o − non sta mai sotto un nodo ×
// o : senza un gruppo in mezzo, e le catene della stessa priorità sono
// associate a sinistra. Per questo la resa non aggiunge parentesi.

export type Operator = '+' | '-' | '×' | ':'

export type Expression =
  | { readonly kind: 'number'; readonly value: Rational }
  | {
      readonly kind: 'binary'
      readonly op: Operator
      readonly left: Expression
      readonly right: Expression
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

export function isMulDiv(op: Operator): boolean {
  return op === '×' || op === ':'
}

const textSymbol: Record<Operator, string> = {
  '+': '+',
  '-': '−',
  '×': '×',
  ':': ':',
}
const katexSymbol: Record<Operator, string> = {
  '+': '+',
  '-': '-',
  '×': '\\times',
  ':': '\\mathbin{:}',
}

function render(e: Expression, symbol: Record<Operator, string>): string {
  if (e.kind === 'number') return rationalToText(e.value)
  return `${render(e.left, symbol)} ${symbol[e.op]} ${render(e.right, symbol)}`
}

export function toText(e: Expression): string {
  return render(e, textSymbol)
}

export function toKatex(e: Expression): string {
  return render(e, katexSymbol)
}

// Lettura di un'espressione scritta a mano, per i test e per le lezioni.
const tokenPattern = /\s*(?:(\d+)|([+\-−×·*:÷]))/y
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
  const sum = () => chain(product, (op) => !isMulDiv(op))

  const tree = sum()
  if (i < tokens.length) throw fail()
  return tree
}
