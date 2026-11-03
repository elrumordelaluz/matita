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
//
// Nel calcolo letterale si aggiunge il monomio scritto: un coefficiente e le
// lettere con i loro esponenti, nell'ordine in cui sono scritte, ripetizioni
// comprese (`2ab² · 3b³a²`). È una foglia: lega più di × e :, come sul libro
// (`4a²b³ : 2b²`). Il coefficiente 1 o −1 non si scrive, e il meno davanti
// al monomio è il segno del coefficiente: `−a²` vale −(a²). Vedi SPEC.md,
// "Calcolo letterale".

export type Operator = '+' | '-' | '×' | ':' | '^'

/** Il tipo di parentesi di un gruppo: tonda, quadra o graffa. */
export type Bracket = 'round' | 'square' | 'curly'

/** Una lettera con il suo esponente dentro un monomio scritto: `b²`. */
export interface LetterPower {
  readonly letter: string
  /** Un naturale positivo; 1 non si scrive. */
  readonly exponent: bigint
}

interface NumberNode {
  readonly kind: 'number'
  readonly value: Rational
  /** Un positivo scritto con il suo segno, come numero relativo: (+4). */
  readonly plus?: true
  /**
   * La lettera di cui il numero ha preso il posto, nella riga della
   * sostituzione: a = −2 in `2a²` dà `2 × (−2)²`.
   */
  readonly letter?: string
}

/** Il monomio scritto, la foglia del calcolo letterale. */
export interface MonomialNode {
  readonly kind: 'monomial'
  /** Mai zero. 1 e −1 non si scrivono. */
  readonly coefficient: Rational
  /** Le lettere nell'ordine scritto, almeno una. */
  readonly letters: readonly LetterPower[]
}

interface BinaryNode<Leaf> {
  readonly kind: 'binary'
  readonly op: Operator
  readonly left: Tree<Leaf>
  readonly right: Tree<Leaf>
}

interface GroupNode<Leaf> {
  readonly kind: 'group'
  readonly bracket: Bracket
  readonly inner: Tree<Leaf>
  /** Il gruppo è preceduto dal meno: −(3 − 7). */
  readonly negated?: true
}

type Tree<Leaf> = NumberNode | Leaf | BinaryNode<Leaf> | GroupNode<Leaf>

/** Un'espressione di numeri, l'albero dei capitoli 1-4. */
export type Expression = Tree<never>

/**
 * Un'espressione letterale: gli stessi nodi, più il monomio scritto. Ogni
 * espressione di numeri è anche un'espressione letterale.
 */
export type LiteralExpression = Tree<MonomialNode>

/**
 * La posizione di un nodo nell'albero: il percorso dalla radice, un passo per
 * livello. Distingue le copie uguali di uno stesso conto.
 */
export type Path = readonly ('left' | 'right' | 'inner')[]

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

/**
 * Un monomio scritto: il coefficiente e le lettere con gli esponenti, come
 * coppie `[lettera, esponente]` nell'ordine scritto.
 */
export function monomial(
  coefficient: Rational,
  letters: readonly (readonly [string, bigint])[],
): MonomialNode {
  if (coefficient.num === 0n) throw new RangeError('Monomio nullo')
  if (letters.length === 0) throw new RangeError('Monomio senza lettere')
  return {
    kind: 'monomial',
    coefficient,
    letters: letters.map(([letter, exponent]) => {
      if (exponent < 1n) throw new RangeError('Esponente non positivo')
      return { letter, exponent }
    }),
  }
}

/** Vero se nell'albero c'è almeno una lettera. */
export function hasLetters(e: LiteralExpression): boolean {
  if (e.kind === 'monomial') return true
  if (e.kind === 'number') return false
  if (e.kind === 'group') return hasLetters(e.inner)
  return hasLetters(e.left) || hasLetters(e.right)
}

export function binary(
  op: Operator,
  left: Expression,
  right: Expression,
): Expression
export function binary(
  op: Operator,
  left: LiteralExpression,
  right: LiteralExpression,
): LiteralExpression
export function binary(
  op: Operator,
  left: LiteralExpression,
  right: LiteralExpression,
): LiteralExpression {
  return { kind: 'binary', op, left, right }
}

interface GroupOptions {
  negated?: boolean
}

export function group(
  bracket: Bracket,
  inner: Expression,
  options?: GroupOptions,
): Expression
export function group(
  bracket: Bracket,
  inner: LiteralExpression,
  options?: GroupOptions,
): LiteralExpression
export function group(
  bracket: Bracket,
  inner: LiteralExpression,
  { negated = false }: GroupOptions = {},
): LiteralExpression {
  return negated
    ? { kind: 'group', bracket, inner, negated: true }
    : { kind: 'group', bracket, inner }
}

/** La potenza `base^exponent`. L'esponente può essere negativo. */
export function power(base: Expression, exponent: bigint): Expression
export function power(
  base: LiteralExpression,
  exponent: bigint,
): LiteralExpression
export function power(
  base: LiteralExpression,
  exponent: bigint,
): LiteralExpression {
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
function exponentOf(e: LiteralExpression): bigint {
  if (e.kind !== 'number' || e.value.den !== 1n)
    throw new RangeError('Esponente non intero')
  return e.value.num
}

/** Il nodo in posizione `path`. */
export function nodeAt<E extends LiteralExpression>(e: E, path: Path): E {
  let node: LiteralExpression = e
  for (const step of path) {
    if (step === 'inner' && node.kind === 'group') node = node.inner
    else if (step !== 'inner' && node.kind === 'binary') node = node[step]
    else throw new Error('Percorso non valido')
  }
  // I figli di un albero sono dello stesso albero.
  return node as E
}

/** Un'operazione da svolgere: un nodo binario che non è una potenza. */
export function isOperation<E extends LiteralExpression>(
  e: E,
): e is Extract<E, { kind: 'binary' }> {
  return e.kind === 'binary' && !isPower(e.op)
}

// L'operatore in `path` e le posizioni del numero o del gruppo scritto subito
// alla sua sinistra e subito alla sua destra.
function visibleSides(
  e: LiteralExpression,
  path: Path,
): { readonly op: Operator; readonly left: Path; readonly right: Path } {
  const node = nodeAt(e, path)
  if (!isOperation(node)) throw new Error('Non è un operatore')
  const left: Path[number][] = [...path, 'left']
  while (isOperation(nodeAt(e, left))) left.push('right')
  const right: Path[number][] = [...path, 'right']
  while (isOperation(nodeAt(e, right))) right.push('left')
  return { op: node.op, left, right }
}

/**
 * L'operazione come si vede intorno all'operatore in `path`: l'operatore con
 * il numero o il gruppo scritto a ciascun lato. In 2 + 3 × 4 il + mostra
 * 2 + 3, non i suoi operandi nell'albero.
 */
export function visibleOperation(e: Expression, path: Path): Expression
export function visibleOperation(
  e: LiteralExpression,
  path: Path,
): LiteralExpression
export function visibleOperation(
  e: LiteralExpression,
  path: Path,
): LiteralExpression {
  const { op, left, right } = visibleSides(e, path)
  return binary(op, nodeAt(e, left), nodeAt(e, right))
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
export function negatedPower(p: Expression): Expression
export function negatedPower(p: LiteralExpression): LiteralExpression
export function negatedPower(p: LiteralExpression): LiteralExpression {
  return group('round', p, { negated: true })
}

/**
 * Un meno davanti a una potenza, −3²: il gruppo con `negated` intorno a una
 * potenza. Si scrive senza parentesi e non è un gruppo da svolgere: il meno
 * resta fuori mentre si calcola la potenza.
 */
export function isNegatedPower(e: LiteralExpression): boolean {
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
export function isSignChange(e: LiteralExpression): boolean {
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
  /** Il coefficiente di un monomio, senza segno: nel testo `1/2 ` con lo spazio. */
  readonly coefficient: (r: Rational) => string
  /** Una lettera con il suo esponente, 1 non scritto. */
  readonly letter: (letter: string, exponent: bigint) => string
  /**
   * Un'espressione con le lettere: il prodotto è un punto, e un gruppo o una
   * potenza fra tonde si attaccano al fattore prima, come sul libro.
   */
  readonly literal: boolean
}

const open = { round: '(', square: '[', curly: '{' }
const close = { round: ')', square: ']', curly: '}' }

const textSymbols: Symbols = {
  op: { '+': '+', '-': '−', '×': '×', ':': ':', '^': '^' },
  minus: '−',
  magnitude: (r) => (isInteger(r) ? `${r.num}` : `${r.num}/${r.den}`),
  enclose: (bracket, inner) => `${open[bracket]}${inner}${close[bracket]}`,
  power: (base, exponent) => `${base}${superscript(exponent)}`,
  coefficient: (r) => (isInteger(r) ? `${r.num}` : `${r.num}/${r.den} `),
  letter: (letter, exponent) =>
    exponent === 1n ? letter : `${letter}${superscript(exponent)}`,
  literal: false,
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
  coefficient: (r) =>
    isInteger(r) ? `${r.num}` : `\\frac{${r.num}}{${r.den}}`,
  letter: (letter, exponent) =>
    exponent === 1n ? letter : `${letter}^{${exponent}}`,
  literal: false,
}

// Nelle espressioni letterali il prodotto è il punto del libro.
const literalSymbols = (symbols: Symbols, dot: string): Symbols => ({
  ...symbols,
  op: { ...symbols.op, '×': dot },
  literal: true,
})

function abs(r: Rational): Rational {
  return r.num < 0n ? { num: -r.num, den: r.den } : r
}

function hasFraction(e: LiteralExpression): boolean {
  if (e.kind === 'number') return !isInteger(e.value)
  if (e.kind === 'monomial') return !isInteger(e.coefficient)
  if (e.kind === 'group') return hasFraction(e.inner)
  return hasFraction(e.left) || hasFraction(e.right)
}

// `sign`: il segno si scrive anche per un positivo, come in −(+3).
function renderNumber(
  e: NumberNode,
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

// Un monomio scritto: il coefficiente 1 non si scrive. Negativo e lontano
// dall'inizio va fra tonde, come un numero relativo: 2a² · (−4a⁵b³).
function renderMonomial(
  e: MonomialNode,
  symbols: Symbols,
  leading: boolean,
): string {
  const magnitude = abs(e.coefficient)
  const negative = e.coefficient.num < 0n
  const coefficient =
    magnitude.num === 1n && magnitude.den === 1n
      ? ''
      : symbols.coefficient(magnitude)
  const letters = e.letters
    .map(({ letter, exponent }) => symbols.letter(letter, exponent))
    .join('')
  const text = `${negative ? symbols.minus : ''}${coefficient}${letters}`
  return negative && !leading
    ? symbols.enclose('round', text, !isInteger(e.coefficient))
    : text
}

// Il fattore a destra di un prodotto letterale che si attacca a quello
// prima: un gruppo, 2xy(3y + 5x²), o una potenza fra tonde, 2a(3b)².
function attaches(right: LiteralExpression): boolean {
  if (right.kind === 'group') return !right.negated
  return (
    right.kind === 'binary' &&
    isPower(right.op) &&
    (right.left.kind === 'group' || right.left.kind === 'monomial')
  )
}

// I segni della riga che lo studente tocca, solo nella resa KaTeX: le
// posizioni degli operatori e l'operazione evidenziata, come chiavi.
interface Marks {
  readonly operatorPaths: boolean
  readonly highlight:
    | {
        readonly left: string
        readonly right: string
        readonly className: string
      }
    | undefined
}

const noMarks: Marks = { operatorPaths: false, highlight: undefined }

const pathKey = (path: Path) => path.join('.')

/** La posizione scritta da `toKatex` in `data-path`; nulla se non lo è. */
export function readPath(key: string): Path | null {
  if (key === '') return []
  const steps = key.split('.')
  return steps.every((d) => d === 'left' || d === 'right' || d === 'inner')
    ? steps
    : null
}

// L'evidenziazione si apre prima del lato sinistro e si chiude dopo il
// destro: in mezzo c'è solo l'operatore, perché i lati sono numeri o gruppi.
function marked(text: string, at: Path, marks: Marks): string {
  const { highlight } = marks
  if (!highlight) return text
  const key = pathKey(at)
  const open =
    key === highlight.left
      ? `\\mathord{\\htmlClass{${highlight.className}}{`
      : ''
  const close = key === highlight.right ? '}}' : ''
  return `${open}${text}${close}`
}

// La base non sta mai all'inizio: un numero relativo va fra tonde, (−3)².
// Anche una frazione va fra tonde, (2/3)², perché l'esponente è di tutta la
// frazione.
function renderPower(
  base: LiteralExpression,
  exponent: LiteralExpression,
  symbols: Symbols,
  at: Path,
  marks: Marks,
): string {
  const text = render(base, symbols, false, [...at, 'left'], marks)
  const bareFraction =
    base.kind === 'number' &&
    !isInteger(base.value) &&
    base.value.num > 0n &&
    !base.plus
  // Un monomio alla base va sempre fra tonde: (2a)², (a²)³, (−2a)².
  const bareMonomial = base.kind === 'monomial' && base.coefficient.num > 0n
  return symbols.power(
    bareFraction || bareMonomial
      ? symbols.enclose('round', text, hasFraction(base))
      : text,
    exponentOf(exponent),
  )
}

function render(
  e: LiteralExpression,
  symbols: Symbols,
  leading: boolean,
  at: Path = [],
  marks: Marks = noMarks,
): string {
  switch (e.kind) {
    case 'number':
      return marked(renderNumber(e, symbols, leading), at, marks)
    case 'monomial':
      return marked(renderMonomial(e, symbols, leading), at, marks)
    case 'binary': {
      if (isPower(e.op))
        return marked(
          renderPower(e.left, e.right, symbols, at, marks),
          at,
          marks,
        )
      const op = marks.operatorPaths
        ? `\\mathbin{\\htmlData{path=${pathKey(at)}}{${symbols.op[e.op]}}}`
        : symbols.op[e.op]
      const left = render(e.left, symbols, leading, [...at, 'left'], marks)
      const right = render(e.right, symbols, false, [...at, 'right'], marks)
      if (symbols.literal && e.op === '×' && attaches(e.right))
        return `${left}${right}`
      return `${left} ${op} ${right}`
    }
    case 'group': {
      const tall = hasFraction(e.inner)
      const inside: Path = [...at, 'inner']
      if (isNegatedPower(e)) {
        const negated = `${symbols.minus}${render(e.inner, symbols, true, inside, marks)}`
        return marked(
          leading ? negated : symbols.enclose('round', negated, tall),
          at,
          marks,
        )
      }
      const inner =
        e.negated && e.inner.kind === 'number'
          ? renderNumber(e.inner, symbols, true, true)
          : render(e.inner, symbols, true, inside, marks)
      const text = symbols.enclose(e.bracket, inner, tall)
      if (!e.negated) return marked(text, at, marks)
      // Lontano dall'inizio anche il meno davanti al gruppo va fra tonde.
      const negated = `${symbols.minus}${text}`
      return marked(
        leading ? negated : symbols.enclose('round', negated, tall),
        at,
        marks,
      )
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

export interface KatexOptions extends RenderOptions {
  /**
   * Ogni operatore porta la sua posizione, con `\htmlData`: è la riga che lo
   * studente tocca. Si legge con `readPath`.
   */
  readonly operatorPaths?: boolean
  /**
   * L'operazione intorno all'operatore in `path`, come la vede lo studente
   * (vedi `visibleOperation`), dentro `\htmlClass{className}`.
   */
  readonly highlight?: { readonly path: Path; readonly className: string }
}

export function toText(
  e: LiteralExpression,
  { leading = true }: RenderOptions = {},
) {
  const symbols = hasLetters(e) ? literalSymbols(textSymbols, '·') : textSymbols
  return render(e, symbols, leading)
}

export function toKatex(
  e: LiteralExpression,
  { leading = true, operatorPaths = false, highlight }: KatexOptions = {},
) {
  const sides = highlight && visibleSides(e, highlight.path)
  const symbols = hasLetters(e)
    ? literalSymbols(katexSymbols, '\\cdot')
    : katexSymbols
  return render(e, symbols, leading, [], {
    operatorPaths,
    highlight: sides && {
      left: pathKey(sides.left),
      right: pathKey(sides.right),
      className: highlight.className,
    },
  })
}

// Lettura di un'espressione scritta a mano, per i test e per le lezioni.
// Legge quello che scrive `toText`: un segno davanti a un numero o a un
// gruppo solo all'inizio, altrove il numero relativo fra tonde; la barra è
// la linea di frazione. L'esponente si scrive ad apice (2³) o dopo `^` (2^3).
//
// Un'espressione letterale legge anche le lettere minuscole. Numero e
// lettere attaccati sono un monomio scritto, che lega più di × e :; un
// gruppo attaccato a quello che lo precede, 2(a + b), è un prodotto allo
// stesso livello di × e :.
const tokenPattern =
  /\s*(?:(\d+)|(⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)|([+\-−×·*:÷/()[\]{}^])|([a-z]))/y
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

const isLetter = (t: string | undefined): t is string =>
  t !== undefined && /^[a-z]$/.test(t)

export function parseExpression(source: string): Expression {
  // Senza lettere non c'è nessun monomio: l'albero è di soli numeri.
  return parse(source, false) as Expression
}

/** Legge un'espressione letterale: numeri, monomi scritti, gruppi. */
export function parseLiteralExpression(source: string): LiteralExpression {
  return parse(source, true)
}

function parse(source: string, letters: boolean): LiteralExpression {
  const fail = () => new SyntaxError(`Espressione non valida: ${source}`)
  const tokens: string[] = []
  tokenPattern.lastIndex = 0
  while (tokenPattern.lastIndex < source.trimEnd().length) {
    const match = tokenPattern.exec(source)
    if (!match || (match[4] !== undefined && !letters)) throw fail()
    tokens.push(match[1] ?? match[2] ?? match[3] ?? match[4] ?? '')
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
  // L'esponente di una lettera: ad apice o dopo `^`, un naturale positivo.
  const letterExponent = (): bigint => {
    const t = tokens[i] ?? ''
    let exponent = 1n
    if (superscriptToken.test(t)) {
      i++
      exponent = fromSuperscript(t)
    } else if (t === '^') {
      i++
      const digits = tokens[i++]
      if (!isDigits(digits)) throw fail()
      exponent = BigInt(digits)
    }
    if (exponent < 1n) throw fail()
    return exponent
  }
  // Le lettere di un monomio scritto, ciascuna con il suo esponente.
  const letterPowers = (): [string, bigint][] => {
    const powers: [string, bigint][] = []
    for (let t = tokens[i]; isLetter(t); t = tokens[i]) {
      i++
      powers.push([t, letterExponent()])
    }
    return powers
  }
  // Un coefficiente seguito dalle lettere è un monomio; senza, un numero.
  const withLetters = (coefficient: Rational): LiteralExpression =>
    isLetter(tokens[i])
      ? monomial(coefficient, letterPowers())
      : literal(coefficient)
  // Un gruppo. Le tonde intorno a un solo numero con il segno sono la
  // scrittura del numero relativo, (−3), non un gruppo; lo stesso per le
  // tonde intorno a un meno davanti a un gruppo e intorno a un monomio
  // negativo, (−4a⁵b³).
  const bracketed = (bracket: Bracket, negated: boolean): LiteralExpression => {
    i++
    let inner = sum()
    if (tokens[i++] !== close[bracket]) throw fail()
    if (negated && inner.kind === 'number') inner = literal(inner.value)
    if (bracket === 'round' && !negated) {
      if (inner.kind === 'number' && (inner.plus || inner.value.num < 0n))
        return inner
      if (inner.kind === 'monomial' && inner.coefficient.num < 0n) return inner
      if (inner.kind === 'group' && inner.negated) return inner
    }
    return group(bracket, inner, { negated })
  }
  const factor = (): LiteralExpression => {
    const bracket = openBracket[tokens[i] ?? '']
    if (bracket) return bracketed(bracket, false)
    if (isLetter(tokens[i])) return monomial(rational(1n), letterPowers())
    return withLetters(magnitude())
  }
  const hasExponent = () =>
    tokens[i] === '^' || superscriptToken.test(tokens[i] ?? '')
  // All'inizio di un'espressione o di un gruppo il primo fattore può avere
  // il segno: −3, +4, −(3 − 7). Davanti a una potenza il meno vale per
  // tutta la potenza, come sul libro: −3² è −(3²), non (−3)². Davanti a un
  // monomio è il segno del coefficiente: −a² ha coefficiente −1.
  const leadingFactor = (): LiteralExpression => {
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
        bracket === 'round' &&
        (inner.kind === 'number' || inner.kind === 'monomial')
          ? inner
          : group(bracket, inner)
      return negatedPower(raised(base))
    }
    const signed = (r: Rational) => (sign === '-' ? rational(-r.num, r.den) : r)
    if (isLetter(tokens[i]))
      return monomial(signed(rational(1n)), letterPowers())
    const value = magnitude()
    if (isLetter(tokens[i])) return monomial(signed(value), letterPowers())
    if (sign === '-' && hasExponent())
      return negatedPower(raised(literal(value)))
    return raised(
      sign === '-' ? literal(signed(value)) : literal(value, { plus: true }),
    )
  }
  // Una base con il suo esponente, se c'è. Dopo `^` l'esponente può avere
  // il segno meno. Le tonde intorno a una frazione o a un monomio sono la
  // sua scrittura come base, (2/3)², (2a)², non un gruppo.
  const raised = (written: LiteralExpression): LiteralExpression => {
    const base =
      written.kind === 'group' &&
      written.bracket === 'round' &&
      !written.negated &&
      ((written.inner.kind === 'number' && !isInteger(written.inner.value)) ||
        written.inner.kind === 'monomial') &&
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
  // Una catena di × e :. Nelle espressioni letterali un gruppo attaccato
  // al fattore prima è un prodotto.
  const product = (leading: boolean): LiteralExpression => {
    let tree = leading ? leadingFactor() : raised(factor())
    for (;;) {
      const t = tokens[i] ?? ''
      const op = operatorOf[t]
      if (op !== undefined && isMulDiv(op)) {
        i++
        tree = binary(op, tree, raised(factor()))
      } else if (letters && openBracket[t]) {
        tree = binary('×', tree, raised(factor()))
      } else return tree
    }
  }
  function sum(): LiteralExpression {
    let tree = product(true)
    for (;;) {
      const op = operatorOf[tokens[i] ?? '']
      if (op === undefined || !isAddSub(op)) return tree
      i++
      tree = binary(op, tree, product(false))
    }
  }

  const tree = sum()
  if (i < tokens.length) throw fail()
  return tree
}
