import {
  binary,
  group,
  isAddSub,
  isMulDiv,
  isNegatedPower,
  isPower,
  negatedPower,
  power,
  type Expression,
  type Operator,
} from './expression.ts'
import {
  addExponentsOfPowerOfPower,
  distributeExponentOverSum,
  multiplyExponentsOfSameBase,
  numericPower,
  takeMinusIntoPower,
} from './power.ts'
import {
  equals,
  isInteger,
  mul,
  rational,
  sub,
  type Rational,
} from './rational.ts'
import { apply, solve } from './solver.ts'

// Gli errori tipici. Ognuno è una variante sbagliata di una regola del
// risolutore: il motore valuta l'esercizio con la regola sbagliata e
// confronta il risultato con la risposta. Vedi SPEC.md, "Errori tipici".

export type MisconceptionId =
  | 'add-before-mul'
  | 'add-sub-right-to-left'
  | 'mul-div-right-to-left'
  | 'minus-group-signs-kept'
  | 'ignored-group'
  | 'minus-sign-dropped'
  | 'negatives-multiply-to-negative'
  | 'sign-rule-in-sum'
  | 'added-numerators-denominators'
  | 'divided-without-reciprocal'
  | 'power-as-product'
  | 'power-of-power-adds-exponents'
  | 'same-base-multiplies-exponents'
  | 'power-of-sum'
  | 'minus-taken-into-power'
  | 'negative-base-sign-kept'
  | 'zero-exponent-is-zero'
  | 'negative-exponent-is-negative'
  | 'negative-substituted-without-brackets'
  | 'coefficient-not-raised'
  | 'like-terms-exponents-added'
  | 'unlike-terms-conjoined'
  | 'implicit-coefficient-zero'
  | 'distributive-first-term-only'
  | 'square-of-difference-sign'
  | 'sum-times-difference-plus'

export interface Misconception {
  readonly id: MisconceptionId
  /** Il testo per lo studente, in italiano. */
  readonly explanation: string
  /** I valori che dà l'esercizio svolto con la regola sbagliata. */
  wrongResults(e: Expression): Rational[]
}

// Le regole con cui si svolge un'espressione: quella giusta è prima le
// potenze, poi × e :, tutte e due le priorità da sinistra a destra, ogni
// gruppo prima di ciò che lo circonda. Le potenze vengono sempre per prime:
// gli errori sull'ordine riguardano × e : contro + e −.
interface Rules {
  readonly first: 'mul-div' | 'add-sub'
  readonly mulDiv: 'left-to-right' | 'right-to-left'
  readonly addSub: 'left-to-right' | 'right-to-left'
  /** Un gruppo letto come se le sue parentesi non ci fossero. */
  readonly ignored?: Expression
  /** Un pezzo fra parentesi letto senza il meno che lo precede. */
  readonly dropped?: Expression
  /** Il conto di una singola operazione, se lo si fa in modo sbagliato. */
  readonly apply?: (op: Operator, left: Rational, right: Rational) => Rational
}

const correctRules: Rules = {
  first: 'mul-div',
  mulDiv: 'left-to-right',
  addSub: 'left-to-right',
}

// L'espressione letta come la scrive lo studente: numeri e operatori in fila,
// con ogni gruppo già ridotto al suo valore.
interface Chain {
  readonly operands: Rational[]
  readonly ops: Operator[]
}

const negative = (r: Rational) => r.num < 0n
const opposite = (r: Rational) => sub(rational(0n), r)

function flatten(e: Expression, rules: Rules, chain: Chain): void {
  if (e.kind === 'number') {
    chain.operands.push(e.value)
    return
  }
  if (e.kind === 'group') {
    const start = chain.operands.length
    if (e === rules.ignored) flatten(e.inner, rules, chain)
    else chain.operands.push(evaluate(e.inner, rules))
    // Il meno davanti al gruppo tocca il primo numero che il gruppo scrive:
    // tutto il gruppo se è ridotto, solo il primo termine se è ignorato.
    const first = chain.operands[start]
    if (e.negated && e !== rules.dropped && first !== undefined)
      chain.operands[start] = opposite(first)
    return
  }
  flatten(e.left, rules, chain)
  chain.ops.push(e.op === '-' && e.right === rules.dropped ? '+' : e.op)
  flatten(e.right, rules, chain)
}

function reducePriority(
  { operands, ops }: Chain,
  accepts: (op: Operator) => boolean,
  direction: Rules['addSub'],
  operate: NonNullable<Rules['apply']>,
): void {
  const next = () => {
    if (direction === 'left-to-right') return ops.findIndex(accepts)
    return ops.findLastIndex(accepts)
  }
  for (let i = next(); i >= 0; i = next()) {
    const [op] = ops.splice(i, 1)
    const [left, right] = operands.splice(i, 2)
    if (op === undefined || left === undefined || right === undefined)
      throw new Error('Catena malformata')
    operands.splice(i, 0, operate(op, left, right))
  }
}

function evaluate(e: Expression, rules: Rules): Rational {
  const chain: Chain = { operands: [], ops: [] }
  flatten(e, rules, chain)
  const operate = rules.apply ?? apply
  // Una potenza non si concatena: la direzione non conta.
  reducePriority(chain, isPower, 'left-to-right', operate)
  const levels = [
    () => reducePriority(chain, isMulDiv, rules.mulDiv, operate),
    () => reducePriority(chain, isAddSub, rules.addSub, operate),
  ]
  if (rules.first === 'add-sub') levels.reverse()
  for (const level of levels) level()
  const [result] = chain.operands
  if (result === undefined) throw new Error('Catena vuota')
  return result
}

// Una regola sbagliata può portare a dividere per zero: lì non c'è un
// valore da confrontare.
function attempt(e: Expression, rules: Rules): Rational[] {
  try {
    return [evaluate(e, rules)]
  } catch (error) {
    if (error instanceof RangeError) return []
    throw error
  }
}

// I gruppi scritti con le parentesi: il meno davanti a una potenza, −3², non
// ne ha.
function groups(e: Expression): Expression[] {
  if (e.kind === 'number') return []
  if (e.kind === 'group' && isNegatedPower(e)) return groups(e.inner)
  if (e.kind === 'group') return [e, ...groups(e.inner)]
  return [...groups(e.left), ...groups(e.right)]
}

// I pezzi fra parentesi preceduti dal meno: il gruppo in 5 − (3 − 7) o in
// −(3 − 7), il numero relativo in 5 − (−4) o in 5 − (+4).
function afterMinus(e: Expression): Expression[] {
  if (e.kind === 'number') return []
  if (e.kind === 'group')
    return [
      ...(e.negated && !isNegatedPower(e) ? [e] : []),
      ...afterMinus(e.inner),
    ]
  const right = e.right
  const enclosed =
    right.kind === 'group' ||
    (right.kind === 'number' && (negative(right.value) || right.plus === true))
  return [
    ...(e.op === '-' && enclosed ? [right] : []),
    ...afterMinus(e.left),
    ...afterMinus(right),
  ]
}

// La regola dei segni presa al contrario: meno per meno dà meno.
function negativesToNegative(
  op: Operator,
  left: Rational,
  right: Rational,
): Rational {
  const result = apply(op, left, right)
  return isMulDiv(op) && negative(left) && negative(right)
    ? opposite(result)
    : result
}

// La regola dei segni usata in una somma: −3 − 4 come se fosse +7.
function signRuleInSum(
  op: Operator,
  left: Rational,
  right: Rational,
): Rational {
  const result = apply(op, left, right)
  const term = op === '-' ? opposite(right) : right
  return isAddSub(op) && negative(left) && negative(term)
    ? opposite(result)
    : result
}

// a/b + c/d come (a + c)/(b + d), solo fra due frazioni.
function numeratorsAndDenominators(
  op: Operator,
  left: Rational,
  right: Rational,
): Rational {
  if (!isAddSub(op) || isInteger(left) || isInteger(right))
    return apply(op, left, right)
  const sign = op === '+' ? 1n : -1n
  return rational(left.num + sign * right.num, left.den + sign * right.den)
}

// La potenza come prodotto di base ed esponente: 2³ come 2 × 3.
function powerAsProduct(
  op: Operator,
  left: Rational,
  right: Rational,
): Rational {
  return isPower(op) ? mul(left, right) : apply(op, left, right)
}

// (−2)⁴ come −2⁴: il segno della base resta, qualunque sia l'esponente.
function negativeBaseSignKept(
  op: Operator,
  left: Rational,
  right: Rational,
): Rational {
  if (!isPower(op) || !negative(left)) return apply(op, left, right)
  return opposite(apply(op, opposite(left), right))
}

// a⁰ come 0.
function zeroExponentIsZero(
  op: Operator,
  left: Rational,
  right: Rational,
): Rational {
  return isPower(op) && right.num === 0n ? rational(0n) : apply(op, left, right)
}

// a⁻ⁿ come −aⁿ.
function negativeExponentIsNegative(
  op: Operator,
  left: Rational,
  right: Rational,
): Rational {
  if (!isPower(op) || !negative(right)) return apply(op, left, right)
  return opposite(apply(op, left, opposite(right)))
}

// Le potenze di un'espressione, dentro i gruppi e i meno.
function powers(e: Expression): Expression[] {
  if (e.kind === 'number') return []
  if (e.kind === 'group') return powers(e.inner)
  return [...(isPower(e.op) ? [e] : []), ...powers(e.left), ...powers(e.right)]
}

// La prima riga, a partire dall'esercizio, in cui compare una potenza con
// l'esponente che il test cerca: un esponente zero può nascere da una
// proprietà, 5³ : 5³ = 5⁰, e l'errore si fa lì.
function firstWithExponent(
  e: Expression,
  test: (exponent: bigint) => boolean,
): Expression | null {
  const written = (x: Expression) =>
    powers(x).some((p) => {
      const n = numericPower(p)
      return n !== null && test(n.exponent)
    })
  if (written(e)) return e
  try {
    return (
      solve(e)
        .lines.map((l) => l.expression)
        .find(written) ?? null
    )
  } catch (error) {
    if (error instanceof RangeError) return null
    throw error
  }
}

function attemptOnLine(
  e: Expression,
  test: (exponent: bigint) => boolean,
  rules: Rules,
): Rational[] {
  const line = firstWithExponent(e, test)
  return line ? attempt(line, rules) : []
}

// Nella riga della sostituzione, il valore negativo di una lettera scritto
// senza tonde alla base di una potenza: a² per a = −2 letto come −2², cioè
// −4. Nulla se nessuna lettera negativa è alla base di una potenza.
function substitutedWithoutBrackets(e: Expression): Expression | null {
  let found = false
  const visit = (node: Expression): Expression => {
    if (node.kind === 'number') return node
    if (node.kind === 'group')
      return group(node.bracket, visit(node.inner), {
        negated: node.negated === true,
      })
    const base = node.left
    if (
      isPower(node.op) &&
      base.kind === 'number' &&
      base.letter !== undefined &&
      negative(base.value) &&
      node.right.kind === 'number'
    ) {
      found = true
      const exponent = node.right.value.num
      return negatedPower(power(literalOf(opposite(base.value)), exponent))
    }
    return binary(node.op, visit(node.left), visit(node.right))
  }
  const read = visit(e)
  return found ? read : null
}

const literalOf = (value: Rational): Expression => ({ kind: 'number', value })

// a/b : c/d come a/b × c/d, quando c'è una frazione.
function withoutReciprocal(
  op: Operator,
  left: Rational,
  right: Rational,
): Rational {
  return op === ':' && !(isInteger(left) && isInteger(right))
    ? mul(left, right)
    : apply(op, left, right)
}

export const misconceptions: readonly Misconception[] = [
  {
    id: 'add-before-mul',
    explanation:
      'Hai svolto l’addizione o la sottrazione prima della moltiplicazione o della divisione. Senza parentesi si fanno prima × e :, poi + e −.',
    wrongResults: (e) => attempt(e, { ...correctRules, first: 'add-sub' }),
  },
  {
    id: 'add-sub-right-to-left',
    explanation:
      'Hai svolto addizioni e sottrazioni partendo da destra. + e − hanno la stessa priorità: si svolgono nell’ordine in cui compaiono, da sinistra a destra.',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, addSub: 'right-to-left' }),
  },
  {
    id: 'mul-div-right-to-left',
    explanation:
      'Hai svolto moltiplicazioni e divisioni partendo da destra. × e : hanno la stessa priorità: si svolgono nell’ordine in cui compaiono, da sinistra a destra.',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, mulDiv: 'right-to-left' }),
  },
  // Prima della parentesi ignorata, perché è un suo caso particolare con una
  // spiegazione più precisa.
  {
    id: 'minus-group-signs-kept',
    explanation:
      'Hai tolto una parentesi preceduta dal meno senza cambiare i segni dentro. Il meno vale per tutto il gruppo: calcola prima la parentesi, oppure, se la togli, cambia il segno di ogni termine.',
    wrongResults: (e) =>
      afterMinus(e)
        .filter((g) => g.kind === 'group')
        .flatMap((ignored) => attempt(e, { ...correctRules, ignored })),
  },
  {
    id: 'ignored-group',
    explanation:
      'Hai svolto i calcoli come se una parentesi non ci fosse. Le parentesi dicono che cosa calcolare per primo: si parte dal gruppo più interno.',
    // Un valore per ogni gruppo ignorato, uno alla volta.
    wrongResults: (e) =>
      groups(e).flatMap((ignored) => attempt(e, { ...correctRules, ignored })),
  },
  // Prima di base per esponente e del segno della base negativa: per
  // a = −2 anche loro danno a² = −4, ma qui l'errore è nella sostituzione.
  {
    id: 'negative-substituted-without-brackets',
    explanation:
      'Hai sostituito un numero negativo senza le parentesi. Al posto della lettera va tutto il numero, con il suo segno, fra tonde: per a = −2, a² = (−2)² = 4, non −2² = −4.',
    wrongResults: (e) => {
      const read = substitutedWithoutBrackets(e)
      return read ? attempt(read, correctRules) : []
    },
  },
  // Prima di base per esponente: con l'esponente zero danno lo stesso
  // valore, 5 × 0 = 0, e la spiegazione dell'esponente zero è più precisa.
  {
    id: 'zero-exponent-is-zero',
    explanation:
      'Una potenza con esponente zero vale 1, non 0: 5⁰ = 1, perché 5³ : 5³ = 5⁰ e un numero diviso per sé stesso fa 1.',
    wrongResults: (e) =>
      attemptOnLine(e, (n) => n === 0n, {
        ...correctRules,
        apply: zeroExponentIsZero,
      }),
  },
  {
    id: 'negative-exponent-is-negative',
    explanation:
      'L’esponente negativo non rende negativa la potenza: vuol dire reciproco. 2⁻³ = 1/2³ = 1/8, non −8.',
    wrongResults: (e) =>
      attemptOnLine(e, (n) => n < 0n, {
        ...correctRules,
        apply: negativeExponentIsNegative,
      }),
  },
  {
    id: 'power-as-product',
    explanation:
      'Hai moltiplicato la base per l’esponente. La potenza è un prodotto di fattori uguali: 2³ = 2 × 2 × 2 = 8, non 2 × 3.',
    wrongResults: (e) => attempt(e, { ...correctRules, apply: powerAsProduct }),
  },
  {
    id: 'minus-sign-dropped',
    explanation:
      'Hai perso il meno davanti a una parentesi. Il meno cambia il segno di quello che c’è dentro: − (−4) diventa + 4, − (+4) diventa − 4.',
    wrongResults: (e) =>
      afterMinus(e).flatMap((dropped) =>
        attempt(e, { ...correctRules, dropped }),
      ),
  },
  {
    id: 'negatives-multiply-to-negative',
    explanation:
      'Hai dato il segno meno al prodotto o al quoziente di due numeri negativi. Regola dei segni: segni uguali danno più, segni diversi danno meno. (−3) × (−4) = +12.',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, apply: negativesToNegative }),
  },
  {
    id: 'sign-rule-in-sum',
    explanation:
      'Hai usato la regola dei segni in una somma. Due termini negativi si sommano e il risultato resta negativo: −3 − 4 = −7. La regola dei segni vale per × e :.',
    wrongResults: (e) => attempt(e, { ...correctRules, apply: signRuleInSum }),
  },
  {
    id: 'added-numerators-denominators',
    explanation:
      'Hai sommato numeratori con numeratori e denominatori con denominatori. Per sommare due frazioni si portano allo stesso denominatore, il minimo comune multiplo, e poi si sommano i numeratori.',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, apply: numeratorsAndDenominators }),
  },
  {
    id: 'divided-without-reciprocal',
    explanation:
      'Hai moltiplicato invece di dividere. Dividere per una frazione vuol dire moltiplicare per il suo reciproco: si scambiano numeratore e denominatore del divisore.',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, apply: withoutReciprocal }),
  },
  {
    id: 'minus-taken-into-power',
    explanation:
      'Hai elevato anche il meno. In −3² l’esponente è solo del 3: −3² = −(3 × 3) = −9. Per elevare il numero negativo serve la parentesi: (−3)² = 9.',
    wrongResults: (e) => attempt(takeMinusIntoPower(e), correctRules),
  },
  {
    id: 'negative-base-sign-kept',
    explanation:
      'Hai lasciato il meno alla potenza di un numero negativo. Il segno segue la regola dei segni: con esponente pari il risultato è positivo, (−2)⁴ = 16; con esponente dispari è negativo, (−2)³ = −8.',
    wrongResults: (e) =>
      attempt(e, { ...correctRules, apply: negativeBaseSignKept }),
  },
  {
    id: 'power-of-power-adds-exponents',
    explanation:
      'Nella potenza di una potenza hai sommato gli esponenti. Gli esponenti si moltiplicano: (3²)³ = 3² × 3² × 3² = 3⁶.',
    wrongResults: (e) => attempt(addExponentsOfPowerOfPower(e), correctRules),
  },
  {
    id: 'same-base-multiplies-exponents',
    explanation:
      'Fra potenze con la stessa base hai moltiplicato (o diviso) gli esponenti. Nel prodotto gli esponenti si sommano, nel quoziente si sottraggono: 2⁵ × 2³ = 2⁸.',
    wrongResults: (e) => attempt(multiplyExponentsOfSameBase(e), correctRules),
  },
  {
    id: 'power-of-sum',
    explanation:
      'Hai elevato ogni termine della parentesi invece della parentesi intera. La potenza non si distribuisce su + e −: prima si calcola la parentesi, (2 + 3)² = 5² = 25, non 2² + 3².',
    wrongResults: (e) => attempt(distributeExponentOverSum(e), correctRules),
  },
]

/** L'errore tipico che spiega una risposta sbagliata, se ce n'è uno. */
export function recognise(
  answer: Rational,
  e: Expression,
  correct: Rational,
): Misconception | undefined {
  if (equals(answer, correct)) return undefined
  return misconceptions.find((m) =>
    m.wrongResults(e).some((wrong) => equals(wrong, answer)),
  )
}

/**
 * Vero se nell'esercizio l'errore si vede: la regola sbagliata dà sempre un
 * valore diverso da quello giusto.
 */
export function isVisible(
  id: MisconceptionId,
  e: Expression,
  correct: Rational,
): boolean {
  const misconception = misconceptions.find((m) => m.id === id)
  const wrong = misconception?.wrongResults(e) ?? []
  return wrong.length > 0 && wrong.every((w) => !equals(w, correct))
}
