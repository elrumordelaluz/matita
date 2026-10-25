import { rational, rationalToText, type Rational } from './rational.ts'

// L'albero di un'espressione. In questa slice ci sono solo numeri, + e −;
// le altre operazioni, il meno unario e i gruppi entrano con le slice che li
// usano (vedi SPEC.md, "Motore").

export type Operator = '+' | '-'

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

const textSymbol: Record<Operator, string> = { '+': '+', '-': '−' }
const katexSymbol: Record<Operator, string> = { '+': '+', '-': '-' }

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
const tokenPattern = /\s*(?:(\d+)|([+\-−]))/y

export function parseExpression(source: string): Expression {
  const tokens: string[] = []
  tokenPattern.lastIndex = 0
  while (tokenPattern.lastIndex < source.trimEnd().length) {
    const match = tokenPattern.exec(source)
    if (!match) throw new SyntaxError(`Espressione non valida: ${source}`)
    tokens.push(match[1] ?? (match[2] === '−' ? '-' : (match[2] ?? '')))
  }

  let i = 0
  const number = (): Expression => {
    const t = tokens[i++]
    if (t === undefined || !/^\d+$/.test(t))
      throw new SyntaxError(`Espressione non valida: ${source}`)
    return num(BigInt(t))
  }

  let tree = number()
  while (i < tokens.length) {
    const op = tokens[i++]
    if (op !== '+' && op !== '-')
      throw new SyntaxError(`Espressione non valida: ${source}`)
    tree = binary(op, tree, number())
  }
  return tree
}
