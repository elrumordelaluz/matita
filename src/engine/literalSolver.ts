import {
  binary,
  group,
  isAddSub,
  isMulDiv,
  literal,
  monomial,
  nodeAt,
  isNegatedPower,
  isPower,
  power,
  type Bracket,
  type LiteralExpression,
  type MonomialNode,
  type Operator,
  type Path,
} from './expression.ts'
import {
  addPolynomials,
  asMonomial,
  divideMonomials,
  equalPolynomials,
  letterPart,
  monomialExpression,
  multiplyMonomials,
  multiplyPolynomials,
  negatePolynomial,
  polynomialOf,
  polynomialValue,
  zeroPolynomial,
  type Monomial,
  type Polynomial,
} from './polynomial.ts'
import { rational } from './rational.ts'
import type { Formula, Line, Rule, Step, TermOperation } from './solver.ts'

// Il risolutore del calcolo letterale. L'ordine è quello dei capitoli dei
// numeri, esteso: dentro un ambito prima le potenze (e la forma normale dei
// monomi scritti), poi × e : da sinistra a destra, poi la riduzione dei
// termini simili. Un'operazione fra monomi è un passaggio solo, come un
// conto fra frazioni in Q. Il risultato è un polinomio in forma normale.
// Vedi SPEC.md, "Calcolo letterale", "Risolutore".

/** Un passaggio del calcolo letterale: operandi e risultato sono polinomi. */
export type LiteralStep = Step<Polynomial>

export interface LiteralSolution {
  readonly lines: readonly Line<LiteralStep>[]
  readonly result: Polynomial
}

// Prima di tutto la riga della formula dei prodotti notevoli, che non fa
// conti e ha una riga sua. Fra × e : e la riduzione dei simili c'è il giro
// in cui cadono le parentesi intorno ai polinomi: dopo il più cadono e
// basta, dopo il meno cambiando il segno di ogni termine.
type Level = 'formula' | 'power' | 'mul-div' | 'groups' | 'add-sub'

const levelOf = (op: Operator): Level => {
  if (isPower(op)) return 'power'
  return isMulDiv(op) ? 'mul-div' : 'add-sub'
}

interface Reduction {
  readonly expression: LiteralExpression
  readonly step: Omit<LiteralStep, 'expression'>
  /**
   * Dove sta il pezzo svolto, dentro l'ambito, quando il passaggio cambia
   * la forma della somma intorno.
   */
  readonly at?: Path
  /**
   * L'espressione è una somma di più termini, come il risultato della
   * distributiva: dentro una somma, dopo il più, i suoi termini entrano
   * nella somma; altrove va fra queste parentesi.
   */
  readonly sum?: Bracket
}

/** Un valore già scritto: un numero o un monomio. */
const isLeaf = (e: LiteralExpression) =>
  e.kind === 'number' || e.kind === 'monomial'

// Il polinomio come lo scrive il quaderno: un monomio in forma normale, con
// le lettere in ordine alfabetico, o un numero.
function written(p: Polynomial): LiteralExpression {
  const m = asMonomial(p)
  if (!m) throw new RangeError('Il risultato non è un monomio')
  return monomialExpression(m)
}

function reduced(
  rule: Rule,
  operation: LiteralExpression,
  operands: readonly Polynomial[],
  result: Polynomial,
): Reduction {
  const outcome = written(result)
  return {
    expression: outcome,
    step: { rule, operands, result, operation, outcome },
  }
}

// Un monomio scritto con una lettera ripetuta non è in forma normale. Le
// lettere in un altro ordine sì: la forma normale non è l'ordine.
function inNormalForm(m: MonomialNode): boolean {
  const letters = m.letters.map((l) => l.letter)
  return new Set(letters).size === letters.length
}

// Il passaggio che svolge proprio questo nodo nel giro `level`, se c'è.
function reduceHere(e: LiteralExpression, level: Level): Reduction | null {
  if (e.kind === 'monomial') {
    if (level !== 'power' || inNormalForm(e)) return null
    const value = polynomialValue(e)
    return reduced('normal-form', e, [value], value)
  }
  // Il meno davanti alla potenza resta fuori e si applica nello stesso
  // passaggio, come in −3² = −9: −(−3a³)³ = 27a⁹.
  if (isNegatedPower(e) && e.kind === 'group') {
    const p = e.inner
    if (level !== 'power' || p.kind !== 'binary' || !isLeaf(p.left)) return null
    const base = p.left
    const rule: Rule = base.kind === 'number' ? 'minus-power' : 'monomial-power'
    const value = polynomialValue(e)
    return reduced(rule, e, [polynomialValue(base)], value)
  }
  // La regola dei segni, nel giro di × e : come con i numeri: il meno
  // davanti a un monomio fra parentesi cambia il suo segno, −(−2a) = 2a, e
  // in una somma − (−27/8 a¹²x⁶) diventa + 27/8 a¹²x⁶.
  if (level === 'formula')
    return (
      squareOfBinomial(e) ??
      squareOfTrinomial(e) ??
      cubeOfBinomial(e) ??
      sumTimesDifference(e)
    )
  if (level === 'mul-div') {
    const signChange = changeSign(e)
    if (signChange) return signChange
    const distributed = distribute(e)
    if (distributed) return distributed
  }
  if (e.kind !== 'binary' || levelOf(e.op) !== level) return null
  if (!isLeaf(e.left) || !isLeaf(e.right)) return null
  const numbers = e.left.kind === 'number' && e.right.kind === 'number'
  const left = polynomialValue(e.left)
  const right = polynomialValue(e.right)
  switch (e.op) {
    case '^':
      // Un'operazione fra monomi è un passaggio solo: (−3a²)³ = −27a⁶, senza
      // la riga della potenza di potenza.
      return reduced(
        e.left.kind === 'number' ? 'power' : 'monomial-power',
        e,
        [left],
        polynomialValue(e),
      )
    case '×':
      return reduced(
        numbers ? 'mul-div-left-to-right' : 'monomial-product',
        e,
        [left, right],
        multiplyPolynomials(left, right),
      )
    case ':':
      // polynomialValue rifiuta il quoziente che non è un monomio.
      return reduced(
        numbers ? 'mul-div-left-to-right' : 'monomial-quotient',
        e,
        [left, right],
        polynomialValue(e),
      )
    default:
      return null
  }
}

const isNegativeLeaf = (e: LiteralExpression) =>
  (e.kind === 'number' && e.value.num < 0n) ||
  (e.kind === 'monomial' && e.coefficient.num < 0n)

// Il monomio o il numero con il segno cambiato.
function opposite(leaf: LiteralExpression): LiteralExpression {
  return written(negatePolynomial(polynomialValue(leaf)))
}

function changeSign(e: LiteralExpression): Reduction | null {
  if (e.kind === 'group' && e.negated && isLeaf(e.inner)) {
    const value = polynomialValue(e.inner)
    return reduced('change-sign', e, [value], negatePolynomial(value))
  }
  if (e.kind !== 'binary' || e.op !== '-' || !isNegativeLeaf(e.right))
    return null
  const value = polynomialValue(e.right)
  const operation = group('round', e.right, { negated: true })
  const outcome = opposite(e.right)
  return {
    expression: binary('+', e.left, outcome),
    step: {
      rule: 'change-sign',
      operands: [value],
      result: negatePolynomial(value),
      operation,
      outcome,
    },
  }
}

/**
 * In una somma i termini sono monomi positivi fra + e −, come sul libro:
 * un risultato negativo dopo il più si scrive con il meno, 3a − 2b e mai
 * 3a + (−2b). È la scrittura del termine, non un passaggio.
 */
function positiveTerms(e: LiteralExpression): LiteralExpression {
  if (e.kind === 'group')
    return group(e.bracket, positiveTerms(e.inner), {
      negated: e.negated === true,
    })
  if (e.kind !== 'binary') return e
  const left = positiveTerms(e.left)
  const right = positiveTerms(e.right)
  if (e.op === '+' && isNegativeLeaf(right))
    return binary('-', left, opposite(right))
  return left === e.left && right === e.right ? e : binary(e.op, left, right)
}

// La distributiva, nel giro di × e :. Un passaggio solo, dritto al
// risultato, con i prodotti dei termini a due a due e senza ridurre i
// simili, che hanno la loro riga: (x + 3y)(2x − 4y) = 2x² − 4xy + 6xy − 12y².
// Un polinomio si divide per un monomio termine per termine, se è esatto.

// Un fattore: un numero, un monomio o un polinomio fra parentesi.
const isFactor = (e: LiteralExpression) => isLeaf(e) || isPolynomialGroup(e)

// I monomi di un fattore, nell'ordine scritto.
const monomialsOf = (e: LiteralExpression): Monomial[] => [
  ...polynomialValue(e).values(),
]

function distribute(e: LiteralExpression): Reduction | null {
  if (e.kind !== 'binary' || !isMulDiv(e.op)) return null
  const { op, left, right } = e
  if (!isFactor(left) || !isFactor(right)) return null
  if (!isPolynomialGroup(left) && !isPolynomialGroup(right)) return null
  // Si divide solo per un monomio.
  if (op === ':' && !isLeaf(right)) return null
  const products = monomialsOf(left).flatMap((a) =>
    monomialsOf(right).map((b): TermOperation<Polynomial> => {
      const result =
        op === '×' ? multiplyMonomials(a, b) : divideMonomials(a, b)
      if (!result) throw new RangeError('Il quoziente non è un polinomio')
      return {
        operands: [polynomialOf([a]), polynomialOf([b])],
        result: polynomialOf([result]),
        operation: binary(op, monomialExpression(a), monomialExpression(b)),
        outcome: monomialExpression(result),
      }
    }),
  )
  const outcome = sumOf(products.flatMap((p) => termOf(p.result) ?? []))
  return {
    expression: outcome,
    sum: 'round',
    step: {
      rule: op === '×' ? 'distributive' : 'polynomial-quotient',
      operands: [polynomialValue(left), polynomialValue(right)],
      result: polynomialValue(e),
      operation: e,
      outcome,
      products,
    },
  }
}

// I prodotti notevoli: la riga della formula, senza conto, con i termini
// del polinomio al posto di A e B, (2x² + 3y)² = (2x²)² + 2 · 2x² · 3y +
// (3y)². La riga dopo calcola, un giro per riga come sempre: prima le
// potenze, poi i prodotti. Vedi SPEC.md, "Calcolo letterale", "Risolutore".

// Il termine con il suo segno, come lo prende la formula: −x è il monomio
// negativo.
const signedNode = (t: SignedTerm) => (t.minus ? opposite(t.node) : t.node)

// Una lettera da sola, x: la sua potenza si scrive subito, x², come sul
// libro, senza (x)².
function raised(e: LiteralExpression, exponent: bigint): LiteralExpression {
  const [only, ...rest] = e.kind === 'monomial' ? e.letters : []
  const bare =
    e.kind === 'monomial' &&
    e.coefficient.num === 1n &&
    e.coefficient.den === 1n &&
    only?.exponent === 1n &&
    rest.length === 0
  return bare
    ? monomial(rational(1n), [[only.letter, exponent]])
    : power(e, exponent)
}

const times = (first: LiteralExpression, ...rest: LiteralExpression[]) =>
  rest.reduce((product, f) => binary('×', product, f), first)

// L'esponente di una potenza, se è il numero `n`.
const hasExponent = (e: LiteralExpression, n: bigint) =>
  e.kind === 'binary' &&
  e.op === '^' &&
  e.right.kind === 'number' &&
  e.right.value.den === 1n &&
  e.right.value.num === n

function formulaRiga(
  rule: Rule,
  e: LiteralExpression,
  operands: readonly Polynomial[],
  formula: Formula,
  terms: readonly SignedTerm[],
): Reduction {
  const outcome = sumOf(terms)
  return {
    expression: outcome,
    // Le potenze della formula hanno già le tonde.
    sum: 'square',
    step: {
      rule,
      operands,
      result: polynomialValue(e),
      operation: e,
      outcome,
      formula,
    },
  }
}

// (A + B)² = A² + 2AB + B², e con il meno (A − B)² = A² − 2AB + B².
function squareOfBinomial(e: LiteralExpression): Reduction | null {
  if (e.kind !== 'binary' || !hasExponent(e, 2n)) return null
  if (!isPolynomialGroup(e.left)) return null
  const [a, b, ...rest] = innerTerms(e.left)
  if (!a || !b || rest.length > 0) return null
  const A = signedNode(a)
  const B = b.node
  const sign = b.minus ? '−' : '+'
  return formulaRiga(
    'square-of-binomial',
    e,
    [polynomialValue(e.left)],
    {
      text: `(A ${sign} B)² = A² ${sign} 2AB + B²`,
      terms: [
        { name: 'A', term: A },
        { name: 'B', term: B },
      ],
    },
    [
      { minus: false, node: raised(A, 2n) },
      { minus: b.minus, node: times(literal(rational(2n)), A, B) },
      { minus: false, node: raised(B, 2n) },
    ],
  )
}

const number = (n: bigint) => literal(rational(n))

// (A + B + C)² = A² + B² + C² + 2AB + 2AC + 2BC, ogni termine con il suo
// segno: in (2x − y + 5)² B è −y. Il risultato esce nell'ordine della
// formula, come lo stampa il libro.
function squareOfTrinomial(e: LiteralExpression): Reduction | null {
  if (e.kind !== 'binary' || !hasExponent(e, 2n)) return null
  if (!isPolynomialGroup(e.left)) return null
  const [a, b, c, ...rest] = innerTerms(e.left)
  if (!a || !b || !c || rest.length > 0) return null
  const [A, B, C] = [signedNode(a), signedNode(b), signedNode(c)]
  const plus = (node: LiteralExpression) => ({ minus: false, node })
  return formulaRiga(
    'square-of-trinomial',
    e,
    [polynomialValue(e.left)],
    {
      text: '(A + B + C)² = A² + B² + C² + 2AB + 2AC + 2BC',
      terms: [
        { name: 'A', term: A },
        { name: 'B', term: B },
        { name: 'C', term: C },
      ],
    },
    [
      plus(raised(A, 2n)),
      plus(raised(B, 2n)),
      plus(raised(C, 2n)),
      plus(times(number(2n), A, B)),
      plus(times(number(2n), A, C)),
      plus(times(number(2n), B, C)),
    ],
  )
}

// (A + B)³ = A³ + 3A²B + 3AB² + B³, e con il meno
// (A − B)³ = A³ − 3A²B + 3AB² − B³.
function cubeOfBinomial(e: LiteralExpression): Reduction | null {
  if (e.kind !== 'binary' || !hasExponent(e, 3n)) return null
  if (!isPolynomialGroup(e.left)) return null
  const [a, b, ...rest] = innerTerms(e.left)
  if (!a || !b || rest.length > 0) return null
  const A = signedNode(a)
  const B = b.node
  const sign = b.minus ? '−' : '+'
  return formulaRiga(
    'cube-of-binomial',
    e,
    [polynomialValue(e.left)],
    {
      text: `(A ${sign} B)³ = A³ ${sign} 3A²B + 3AB² ${sign} B³`,
      terms: [
        { name: 'A', term: A },
        { name: 'B', term: B },
      ],
    },
    [
      { minus: false, node: raised(A, 3n) },
      { minus: b.minus, node: times(number(3n), raised(A, 2n), B) },
      { minus: false, node: times(number(3n), A, raised(B, 2n)) },
      { minus: b.minus, node: raised(B, 3n) },
    ],
  )
}

// (A + B)(A − B) = A² − B², anche con la differenza per prima.
function sumTimesDifference(e: LiteralExpression): Reduction | null {
  if (e.kind !== 'binary' || e.op !== '×') return null
  if (!isPolynomialGroup(e.left) || !isPolynomialGroup(e.right)) return null
  const [a, b, ...rest] = innerTerms(e.left)
  const [c, d, ...others] = innerTerms(e.right)
  if (!a || !b || !c || !d || rest.length > 0 || others.length > 0) return null
  if (!equalPolynomials(signedValue(a), signedValue(c))) return null
  if (!equalPolynomials(signedValue(b), negatePolynomial(signedValue(d))))
    return null
  const A = signedNode(a)
  const B = b.node
  return formulaRiga(
    'sum-times-difference',
    e,
    [polynomialValue(e.left), polynomialValue(e.right)],
    {
      text: '(A + B)(A − B) = A² − B²',
      terms: [
        { name: 'A', term: A },
        { name: 'B', term: B },
      ],
    },
    [
      { minus: false, node: raised(A, 2n) },
      { minus: true, node: raised(B, 2n) },
    ],
  )
}

// Una somma di più termini al suo posto. Dopo il più, o in testa a una
// somma, i termini entrano nella somma: 5a² + 2a(3a + b) = 5a² + 6a² + 2ab.
// Dopo il meno, o dentro un prodotto, la somma va fra tonde, come un
// monomio negativo: 5a − 2a(3a + b) = 5a − (6a² + 2ab).
function placed(
  e: Extract<LiteralExpression, { kind: 'binary' }>,
  side: 'left' | 'right',
  r: Reduction,
): Reduction {
  const other = side === 'left' ? e.right : e.left
  const rebuilt = (node: LiteralExpression) =>
    side === 'left' ? binary(e.op, node, other) : binary(e.op, other, node)
  const { sum: bracket, ...rest } = r
  if (!bracket) return { ...r, expression: rebuilt(r.expression) }
  if (side === 'left' && isAddSub(e.op))
    return { ...rest, expression: rebuilt(r.expression) }
  if (side === 'right' && e.op === '+')
    return {
      ...rest,
      expression: sumTerms(r.expression).reduce<LiteralExpression>(
        (sum, t) => binary(t.minus ? '-' : '+', sum, t.node),
        e.left,
      ),
    }
  return { ...rest, expression: rebuilt(group(bracket, r.expression)) }
}

// Dove si è lavorato, per la somma che cambia forma.
const located = (r: Reduction | null, path: Path): Reduction | null =>
  r && r.sum ? { ...r, at: path } : r

// Svolge il primo passaggio del giro, da sinistra, senza entrare nei gruppi.
function reduceFirst(
  e: LiteralExpression,
  level: Level,
  path: Path = [],
): Reduction | null {
  if (e.kind !== 'binary') return located(reduceHere(e, level), path)
  const left = reduceFirst(e.left, level, [...path, 'left'])
  if (left) return placed(e, 'left', left)
  const here = located(reduceHere(e, level), path)
  if (here) return here
  const right = reduceFirst(e.right, level, [...path, 'right'])
  if (right) return placed(e, 'right', right)
  return null
}

// La riduzione dei termini simili. Non è "+ e − da sinistra a destra":
// mette insieme termini lontani. Un passaggio per ogni gruppo di simili, con
// tanti operandi quanti sono i simili, e il risultato al posto del primo
// termine del gruppo; i gruppi vanno nell'ordine di prima comparsa.

/** Un termine di una somma con il segno che lo precede. */
export interface SignedTerm {
  readonly minus: boolean
  readonly node: LiteralExpression
}

/** I termini di una somma algebrica, nell'ordine scritto. */
export function sumTerms(e: LiteralExpression): SignedTerm[] {
  if (e.kind === 'binary' && (e.op === '+' || e.op === '-'))
    return [...sumTerms(e.left), { minus: e.op === '-', node: e.right }]
  return [{ minus: false, node: e }]
}

// Il valore di un termine con il suo segno.
const signedValue = ({ minus, node }: SignedTerm): Polynomial => {
  const value = polynomialValue(node)
  return minus ? negatePolynomial(value) : value
}

// Un monomio o un numero con il suo segno, come termine: −2a diventa il
// meno davanti a 2a, perché fra i termini ci sono solo monomi positivi.
function termOf(value: Polynomial): SignedTerm | null {
  const m = asMonomial(value)
  if (!m) return null
  const minus = m.coefficient.num < 0n
  const coefficient = minus
    ? rational(-m.coefficient.num, m.coefficient.den)
    : m.coefficient
  return { minus, node: monomialExpression({ ...m, coefficient }) }
}

/**
 * La somma scritta come sul libro: + e − fra i termini, e il primo con il
 * suo segno. Senza termini è lo zero.
 */
export function sumOf(terms: readonly SignedTerm[]): LiteralExpression {
  const [first, ...rest] = terms
  if (!first) return literal(rational(0n))
  const leading = first.minus ? negated(first.node) : first.node
  return rest.reduce<LiteralExpression>(
    (sum, t) => binary(t.minus ? '-' : '+', sum, t.node),
    leading,
  )
}

// Il primo termine con il meno davanti: un monomio o un numero cambia segno,
// un gruppo ricorda il meno.
function negated(node: LiteralExpression): LiteralExpression {
  if (node.kind === 'number')
    return literal(rational(-node.value.num, node.value.den))
  if (node.kind === 'monomial')
    return {
      ...node,
      coefficient: rational(-node.coefficient.num, node.coefficient.den),
    }
  return group('round', node, { negated: true })
}

function likeKey(t: SignedTerm): string | null {
  if (!isLeaf(t.node)) return null
  const m = asMonomial(polynomialValue(t.node))
  return m ? letterPart(m) : null
}

// Il primo gruppo di simili, ridotto a un termine solo.
function reduceLikeTerms(e: LiteralExpression): Reduction | null {
  const terms = sumTerms(e)
  const keys = terms.map(likeKey)
  const first = keys.findIndex(
    (k, i) => k !== null && keys.indexOf(k, i + 1) !== -1,
  )
  if (first === -1) return null
  const members = keys.flatMap((k, i) => (k === keys[first] ? [i] : []))
  const like = members.flatMap((i) => terms[i] ?? [])
  const operands = like.map(signedValue)
  const result = operands.reduce(addPolynomials, zeroPolynomial)
  const reducedTerm = termOf(result)
  const rest = terms.flatMap((t, i) => {
    if (i === first) return reducedTerm ? [reducedTerm] : []
    return members.includes(i) ? [] : [t]
  })
  const outcome = reducedTerm ? sumOf([reducedTerm]) : literal(rational(0n))
  return {
    expression: sumOf(rest),
    step: {
      rule: 'like-terms',
      operands,
      result,
      operation: sumOf(like),
      outcome,
    },
  }
}

// Le parentesi intorno a un polinomio. Un gruppo che non si riduce a un
// numero o a un monomio resta fra parentesi finché il suo interno non è in
// forma normale; poi le parentesi cadono nel giro di + e − dell'ambito
// intorno. Vedi SPEC.md, "Calcolo letterale", "Risolutore".

/**
 * Una somma di almeno due termini in forma normale: numeri e monomi con
 * lettere diverse, nessun simile.
 */
function isNormalSum(e: LiteralExpression): boolean {
  const terms = sumTerms(e)
  if (terms.length < 2) return false
  const keys = terms.map((t) =>
    t.node.kind === 'monomial' && !inNormalForm(t.node) ? null : likeKey(t),
  )
  return keys.every((k) => k !== null) && new Set(keys).size === keys.length
}

/** Un polinomio in forma normale fra parentesi: non c'è più niente da svolgere dentro. */
function isPolynomialGroup(
  e: LiteralExpression,
): e is Extract<LiteralExpression, { kind: 'group' }> {
  return e.kind === 'group' && !isNegatedPower(e) && isNormalSum(e.inner)
}

// Il gruppo preceduto dal meno, nella somma o con il meno suo: −(a − b).
const afterMinus = (t: SignedTerm) =>
  isPolynomialGroup(t.node) && t.minus !== (t.node.negated === true)

const afterPlus = (t: SignedTerm) =>
  isPolynomialGroup(t.node) && !t.minus && t.node.negated !== true

// Un termine scritto come sul libro: un monomio positivo con il segno
// davanti, −2a come il meno davanti a 2a.
function signedLeaf({ minus, node }: SignedTerm): SignedTerm {
  return isNegativeLeaf(node)
    ? { minus: !minus, node: opposite(node) }
    : { minus, node }
}

// I termini dentro un gruppo, ciascuno con il suo segno.
const innerTerms = (g: LiteralExpression): SignedTerm[] =>
  g.kind === 'group' ? sumTerms(g.inner).map(signedLeaf) : []

// La posizione del termine `i` in una somma di `n` termini, associata a
// sinistra: il primo è il più in fondo al ramo sinistro.
function termPath(n: number, i: number): Path {
  const lefts = (k: number): Path => Array.from({ length: k }, () => 'left')
  return i === 0 ? lefts(n - 1) : [...lefts(n - 1 - i), 'right']
}

// Il primo polinomio preceduto dal meno: le parentesi cadono e ogni termine
// cambia segno, 5a − (2a − b) = 5a − 2a + b.
function dropMinusGroup(e: LiteralExpression): Reduction | null {
  const terms = sumTerms(e)
  const i = terms.findIndex(afterMinus)
  const term = terms[i]
  if (!term || term.node.kind !== 'group') return null
  const { inner } = term.node
  const opposites = innerTerms(term.node).map((t) => ({
    ...t,
    minus: !t.minus,
  }))
  const value = polynomialValue(inner)
  return {
    expression: sumOf([
      ...terms.slice(0, i),
      ...opposites,
      ...terms.slice(i + 1),
    ]),
    step: {
      rule: 'minus-group',
      operands: [value],
      result: negatePolynomial(value),
      operation: group(term.node.bracket, inner, { negated: true }),
      outcome: sumOf(opposites),
    },
    at: termPath(terms.length, i),
  }
}

// Dopo il più le parentesi cadono e basta, senza un passaggio: alla fine
// della riga, così ogni passaggio della riga parte dall'espressione che lo
// precede.
function dropPlusGroups(e: LiteralExpression): LiteralExpression {
  const terms = sumTerms(e)
  if (!terms.some(afterPlus)) return e
  return sumOf(terms.flatMap((t) => (afterPlus(t) ? innerTerms(t.node) : [t])))
}

const hasPolynomialGroup = (e: LiteralExpression) =>
  sumTerms(e).some((t) => isPolynomialGroup(t.node))

const levels: readonly Level[] = [
  'formula',
  'power',
  'mul-div',
  'groups',
  'add-sub',
]

// Il primo passaggio del giro, da sinistra.
function reduceLevel(e: LiteralExpression, level: Level): Reduction | null {
  if (level === 'groups') return dropMinusGroup(e)
  return level === 'add-sub' ? reduceLikeTerms(e) : reduceFirst(e, level)
}

// Il giro che ha qualcosa da fare: nel giro dei gruppi anche solo parentesi
// che cadono dopo il più.
const hasWork = (e: LiteralExpression, level: Level) =>
  level === 'groups' ? hasPolynomialGroup(e) : reduceLevel(e, level) !== null

// Gli ambiti: si lavora dentro i gruppi più interni, o sull'intera
// espressione se non ce ne sono, come con i numeri.

function replace(
  e: LiteralExpression,
  [head, ...rest]: Path,
  node: LiteralExpression,
): LiteralExpression {
  if (head === undefined) return node
  if (head === 'inner' && e.kind === 'group')
    return group(e.bracket, replace(e.inner, rest, node), {
      negated: e.negated === true,
    })
  if (e.kind === 'binary') {
    if (head === 'left')
      return binary(e.op, replace(e.left, rest, node), e.right)
    if (head === 'right')
      return binary(e.op, e.left, replace(e.right, rest, node))
  }
  throw new Error('Percorso non valido')
}

// Un gruppo da svolgere: non il meno davanti a una potenza, −3a², non il
// meno davanti a un monomio, −(−2a), che è un cambio di segno, e non un
// polinomio in forma normale, che aspetta l'ambito intorno.
function isOpenGroup(e: LiteralExpression): boolean {
  return (
    e.kind === 'group' &&
    !isNegatedPower(e) &&
    !(e.negated === true && isLeaf(e.inner)) &&
    !isPolynomialGroup(e)
  )
}

function hasGroup(e: LiteralExpression): boolean {
  if (e.kind === 'group')
    return isOpenGroup(e) || (isNegatedPower(e) && hasGroup(e.inner))
  return e.kind === 'binary' && (hasGroup(e.left) || hasGroup(e.right))
}

// I gruppi che non contengono altri gruppi, da sinistra a destra.
function innermostGroups(e: LiteralExpression, path: Path = []): Path[] {
  if (e.kind === 'number' || e.kind === 'monomial') return []
  if (e.kind === 'group') {
    if (!isOpenGroup(e))
      return isNegatedPower(e)
        ? innermostGroups(e.inner, [...path, 'inner'])
        : []
    return hasGroup(e.inner)
      ? innermostGroups(e.inner, [...path, 'inner'])
      : [path]
  }
  return [
    ...innermostGroups(e.left, [...path, 'left']),
    ...innermostGroups(e.right, [...path, 'right']),
  ]
}

// Un gruppo ridotto a un monomio o a un numero perde le parentesi; se è
// negativo resta fra tonde, perché è la sua scrittura: 5a − (−2a). Davanti
// a un gruppo preceduto dal meno le parentesi restano: −(−2a).
function settle(e: LiteralExpression, target: Path): LiteralExpression {
  const node = nodeAt(e, target)
  return node.kind === 'group' && !node.negated && isLeaf(node.inner)
    ? positiveTerms(replace(e, target, node.inner))
    : e
}

// Svolge un giro dentro un ambito: le potenze, poi × e :, poi i simili.
// `plusGroups` raccoglie gli ambiti in cui, a fine riga, cadono le
// parentesi dopo il più.
function solveScope(
  e: LiteralExpression,
  target: Path,
  steps: LiteralStep[],
  plusGroups: Path[],
): LiteralExpression {
  const inGroup = isOpenGroup(nodeAt(e, target))
  const scope: Path = inGroup ? [...target, 'inner'] : target
  const level = levels.find((l) => hasWork(nodeAt(e, scope), l))
  if (level === 'groups') plusGroups.push(scope)
  let current = settle(e, target)
  for (;;) {
    // Il gruppo è caduto: l'ambito non c'è più.
    if (inGroup && !isOpenGroup(nodeAt(current, target))) return current
    const reduction = level && reduceLevel(nodeAt(current, scope), level)
    if (!reduction) return current
    current = settle(
      positiveTerms(replace(current, scope, reduction.expression)),
      target,
    )
    const { at } = reduction
    steps.push({
      ...reduction.step,
      expression: current,
      ...(at && { path: [...scope, ...at] }),
    })
  }
}

// Una riga: in ogni ambito il primo giro che ha qualcosa da fare.
function solveLevel(e: LiteralExpression): Line<LiteralStep> {
  const steps: LiteralStep[] = []
  const plusGroups: Path[] = []
  const targets = hasGroup(e) ? innermostGroups(e) : [[]]
  let current = e
  for (const target of targets)
    current = solveScope(current, target, steps, plusGroups)
  for (const scope of plusGroups)
    current = positiveTerms(
      replace(current, scope, dropPlusGroups(nodeAt(current, scope))),
    )
  return { expression: current, steps }
}

/** La soluzione per righe di un'espressione letterale. */
export function solveLiteral(e: LiteralExpression): LiteralSolution {
  const lines: Line<LiteralStep>[] = []
  let current = e
  for (;;) {
    const line = solveLevel(current)
    if (line.expression === current) break
    // Una riga senza passaggi ha solo tolto parentesi.
    if (line.steps.length > 0) lines.push(line)
    current = line.expression
  }
  return { lines, result: polynomialValue(current) }
}
