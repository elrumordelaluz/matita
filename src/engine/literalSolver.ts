import {
  binary,
  group,
  isMulDiv,
  literal,
  nodeAt,
  isNegatedPower,
  isPower,
  type LiteralExpression,
  type MonomialNode,
  type Operator,
  type Path,
} from './expression.ts'
import {
  addPolynomials,
  asMonomial,
  letterPart,
  monomialExpression,
  multiplyPolynomials,
  negatePolynomial,
  polynomialValue,
  zeroPolynomial,
  type Polynomial,
} from './polynomial.ts'
import { rational } from './rational.ts'
import type { Line, Rule, Step } from './solver.ts'

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

// Fra × e : e la riduzione dei simili c'è il giro in cui cadono le
// parentesi intorno ai polinomi: dopo il più cadono e basta, dopo il meno
// cambiando il segno di ogni termine.
type Level = 'power' | 'mul-div' | 'groups' | 'add-sub'

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
  if (level === 'mul-div') {
    const signChange = changeSign(e)
    if (signChange) return signChange
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

// Svolge il primo passaggio del giro, da sinistra, senza entrare nei gruppi.
function reduceFirst(e: LiteralExpression, level: Level): Reduction | null {
  if (e.kind !== 'binary') return reduceHere(e, level)
  const left = reduceFirst(e.left, level)
  if (left)
    return { ...left, expression: binary(e.op, left.expression, e.right) }
  const here = reduceHere(e, level)
  if (here) return here
  const right = reduceFirst(e.right, level)
  if (right)
    return { ...right, expression: binary(e.op, e.left, right.expression) }
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
      operation: group('round', inner, { negated: true }),
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

const levels: readonly Level[] = ['power', 'mul-div', 'groups', 'add-sub']

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
