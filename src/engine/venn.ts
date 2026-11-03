import { binary, group, num, type Expression } from './expression.ts'
import { seededRandom, type Random } from './random.ts'
import type { SetMisconceptionId } from './setMisconceptions.ts'
import { solve, type Solution } from './solver.ts'
import { settingOf, twoSetSettings, type Role } from './vennSettings.ts'

// I problemi con i diagrammi di Eulero-Venn. Vedi SPEC.md, "Insiemi",
// "Problemi". Nel motore un problema è il vettore delle regioni del
// diagramma, 4 con due insiemi e 8 con tre, più i dati che il testo scrive e
// la quantità che chiede.
//
// La regione r ha un bit per insieme: il bit i dice se la regione sta
// dentro l'insieme i. Con due insiemi 0 è nessuno, 1 solo A, 2 solo B, 3
// entrambi; con tre 7 è il centro. Una quantità è un insieme di regioni,
// scritto come maschera: il bit r dice se la regione r ne fa parte. Il suo
// valore è la somma delle regioni.

/** Un insieme di regioni, come maschera di bit. */
export type Quantity = number

export interface VennProblem {
  /** L'ambientazione, con i suoi modelli di frase (vennSettings.ts). */
  readonly setting: string
  /** Gli elementi di ogni regione, 4 o 8. */
  readonly regions: readonly bigint[]
  /** Le quantità che il testo dà, nell'ordine in cui le scrive. */
  readonly data: readonly Quantity[]
  /** La quantità che il testo chiede. */
  readonly asked: Quantity
}

/** Un esercizio che è un problema: un testo, e un numero come risposta. */
export interface ProblemExercise {
  readonly kind: 'problem'
  readonly skill: 'set.venn2'
  readonly seed: number
  readonly generatorVersion: number
  readonly problem: VennProblem
}

export function setCount(problem: VennProblem): 2 | 3 {
  return problem.regions.length === 8 ? 3 : 2
}

const popcount = (n: number) => {
  let c = 0
  for (let m = n; m > 0; m >>= 1) c += m & 1
  return c
}

const regionsWhere = (k: number, keep: (r: number) => boolean): Quantity => {
  let mask = 0
  for (let r = 0; r < 1 << k; r++) if (keep(r)) mask |= 1 << r
  return mask
}

/** Le quantità di un diagramma con `k` insiemi, per nome. */
export function quantities(k: 2 | 3) {
  const all = regionsWhere(k, () => true)
  return {
    region: (r: number): Quantity => 1 << r,
    total: all,
    union: all & ~1,
    exactlyOne: regionsWhere(k, (r) => popcount(r) === 1),
    /** "Almeno A": le regioni dentro l'insieme i. */
    atLeast: (i: number): Quantity =>
      regionsWhere(k, (r) => ((r >> i) & 1) === 1),
    /** "Almeno A", "almeno B", … per ogni insieme, in ordine. */
    eachAtLeast: Array.from({ length: k }, (_, i) =>
      regionsWhere(k, (r) => ((r >> i) & 1) === 1),
    ),
    /** "Almeno A e B": le regioni dentro i e j, il centro compreso. */
    atLeastBoth: (i: number, j: number) =>
      regionsWhere(k, (r) => ((r >> i) & 1) === 1 && ((r >> j) & 1) === 1),
    /** "A o B ma non C". */
    eitherButNot: (i: number, j: number, not: number) =>
      regionsWhere(
        k,
        (r) =>
          (((r >> i) & 1) === 1 || ((r >> j) & 1) === 1) &&
          ((r >> not) & 1) === 0,
      ),
  }
}

/** Le regioni di una quantità, in ordine. */
export function regionsOf(q: Quantity): number[] {
  const out: number[] = []
  for (let r = 0; q >> r > 0; r++) if ((q >> r) & 1) out.push(r)
  return out
}

export function valueOf(problem: VennProblem, q: Quantity): bigint {
  return regionsOf(q).reduce((sum, r) => sum + (problem.regions[r] ?? 0n), 0n)
}

const bitsOf = (r: number, k: number) =>
  Array.from({ length: k }, (_, i) => i).filter((i) => (r >> i) & 1)

/**
 * Il nome di una quantità, nella forma del libro, con le parole
 * dell'ambientazione al posto delle lettere: "solo inglese", "entrambi",
 * "nessuno", "almeno uno", "Salsa o Break ma non Hip Hop".
 */
export function quantityName(
  q: Quantity,
  k: 2 | 3,
  words: readonly string[],
): string {
  const w = (i: number) => words[i] ?? ''
  const named = quantities(k)
  if (popcount(q) === 1) {
    const [r = 0] = regionsOf(q)
    const inside = bitsOf(r, k)
    if (inside.length === 0) return 'nessuno'
    if (inside.length === k) return k === 2 ? 'entrambi' : 'tutti e tre'
    return `solo ${inside.map(w).join(' e ')}`
  }
  if (q === named.total) return 'totale'
  if (q === named.union) return 'almeno uno'
  if (q === named.exactlyOne) return 'uno solo'
  const single = named.eachAtLeast.indexOf(q)
  if (single >= 0) return w(single)
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) {
      if (q === named.atLeastBoth(i, j)) return `${w(i)} e ${w(j)}`
      const not = 3 - i - j
      if (k === 3 && q === named.eitherButNot(i, j, not))
        return `${w(i)} o ${w(j)} ma non ${w(not)}`
    }
  return regionsOf(q)
    .map((r) => quantityName(1 << r, k, words))
    .join(' + ')
}

// Come si trova una quantità con una sola incognita, dalle quantità note:
// per differenza da una che la contiene, come somma delle sue regioni, o con
// la formula dell'unione, card(A ∪ B) = card(A) + card(B) − card(A ∩ B),
// letta per l'unione o per l'intersezione.
type Derivation =
  | {
      readonly kind: 'difference'
      readonly from: Quantity
      readonly parts: readonly Quantity[]
    }
  | { readonly kind: 'sum'; readonly parts: readonly Quantity[] }
  | {
      readonly kind: 'union'
      readonly y: Quantity
      readonly z: Quantity
      readonly w: Quantity
    }
  | {
      readonly kind: 'intersection'
      readonly y: Quantity
      readonly z: Quantity
      readonly u: Quantity
    }

/** Una riga della soluzione: il nome della quantità e un'espressione in N. */
export interface VennRow {
  /** La quantità che la riga trova. */
  readonly found: Quantity
  readonly name: string
  /** L'espressione in N, con i numeri delle quantità già note. */
  readonly expression: Expression
  /** Le righe del risolutore del capitolo 1, con i loro passaggi. */
  readonly solution: Solution
  readonly value: bigint
  /** Le quantità note che la riga usa. */
  readonly uses: readonly Quantity[]
  /**
   * La riga trova una regione all'indietro, da un dato come "Salsa o Break
   * ma non Hip Hop", e lo dice: il nome del dato.
   */
  readonly backwards: string | null
}

// La copertura più corta di `target` con quantità note e disgiunte, la prima
// nell'ordine delle note. Null se non c'è.
function cover(
  target: Quantity,
  known: readonly Quantity[],
): Quantity[] | null {
  if (target === 0) return []
  const lowest = target & -target
  let best: Quantity[] | null = null
  for (const m of known) {
    if (!(m & lowest) || m & ~target) continue
    const rest = cover(target & ~m, known)
    if (rest && (!best || rest.length + 1 < best.length)) best = [m, ...rest]
  }
  return best
}

function size(d: Derivation): number {
  switch (d.kind) {
    case 'difference':
      return 1 + d.parts.length
    case 'sum':
      return d.parts.length
    default:
      return 3
  }
}

/**
 * Come trovare `target` dalle note, o null se ha più di un'incognita. Fra le
 * strade possibili vince quella con meno numeri; a pari numeri la
 * differenza, poi la somma, poi la formula. `onlySum` vale per la domanda
 * che somma più regioni: la sua riga è la somma.
 */
function derive(
  target: Quantity,
  known: readonly Quantity[],
  found: readonly Quantity[],
  onlySum: boolean,
  union: Quantity,
): Derivation | null {
  const options: Derivation[] = []
  // Le parti sono regioni, quantità trovate o l'unione, mai gli altri dati
  // aggregati: 40 − (9 + 14 + 6), non 40 − (15 + 14); ma 28 − 24 con
  // l'unione, come sul libro.
  const pieces = known.filter(
    (q) => found.includes(q) || popcount(q) === 1 || q === union,
  )
  const regions = known.filter((q) => popcount(q) === 1)
  const parts = cover(target, regions)
  if (parts && parts.length >= 2) options.push({ kind: 'sum', parts })
  if (!onlySum) {
    for (const from of known) {
      if ((from & target) !== target || from === target) continue
      const rest = cover(from & ~target, pieces)
      if (rest) options.push({ kind: 'difference', from, parts: rest })
    }
    for (const y of known)
      for (const z of known) {
        if (y >= z || (y & z) === 0 || (y & z) === y || (y & z) === z) continue
        if ((y | z) === target && known.includes(y & z))
          options.push({ kind: 'union', y, z, w: y & z })
        if ((y & z) === target && known.includes(y | z))
          options.push({ kind: 'intersection', y, z, u: y | z })
      }
  }
  const order = ['difference', 'sum', 'union', 'intersection']
  return (
    options.sort(
      (a, b) =>
        size(a) - size(b) || order.indexOf(a.kind) - order.indexOf(b.kind),
    )[0] ?? null
  )
}

function sumOf(values: readonly bigint[]): Expression {
  const [first = 0n, ...rest] = values
  return rest.reduce<Expression>((e, v) => binary('+', e, num(v)), num(first))
}

function expressionOf(problem: VennProblem, d: Derivation): Expression {
  const v = (q: Quantity) => valueOf(problem, q)
  switch (d.kind) {
    case 'sum':
      return sumOf(d.parts.map(v))
    case 'difference': {
      const parts = d.parts.map(v)
      const subtrahend =
        parts.length === 1 ? num(parts[0] ?? 0n) : group('round', sumOf(parts))
      return binary('-', num(v(d.from)), subtrahend)
    }
    case 'union':
      return binary('-', binary('+', num(v(d.y)), num(v(d.z))), num(v(d.w)))
    case 'intersection':
      return binary('-', binary('+', num(v(d.y)), num(v(d.z))), num(v(d.u)))
  }
}

function usesOf(d: Derivation): Quantity[] {
  switch (d.kind) {
    case 'sum':
      return [...d.parts]
    case 'difference':
      return [d.from, ...d.parts]
    case 'union':
      return [d.y, d.z, d.w]
    case 'intersection':
      return [d.y, d.z, d.u]
  }
}

/**
 * Le quantità che una riga può trovare, nell'ordine del quaderno: con tre
 * insiemi il centro, le regioni di "solo due", quelle di "solo uno",
 * l'esterno; con due l'intersezione, solo A, solo B, l'esterno. Poi
 * l'unione, che una riga può trovare quando serve.
 */
function candidates(problem: VennProblem): Quantity[] {
  const k = setCount(problem)
  const order = k === 2 ? [3, 1, 2, 0] : [7, 3, 5, 6, 1, 2, 4, 0]
  const list = [...order.map((r) => 1 << r), quantities(k).union]
  return list.includes(problem.asked) ? list : [...list, problem.asked]
}

// Le righe più corte fino alla quantità chiesta, con una sola incognita
// ciascuna: una visita in ampiezza degli stati di conoscenza, che prova le
// quantità nell'ordine del quaderno, così a pari lunghezza vince l'ordine.
function shortestPath(problem: VennProblem): Quantity[] | null {
  const k = setCount(problem)
  const named = quantities(k)
  const list = candidates(problem)
  const isAggregate = (q: Quantity) => popcount(q) > 1 && q !== named.union
  const knownOf = (path: readonly Quantity[]) => [
    ...problem.data,
    ...list.filter((q) => path.includes(q) && !problem.data.includes(q)),
  ]
  if (problem.data.includes(problem.asked)) return null
  let frontier: Quantity[][] = [[]]
  const seen = new Set<string>([''])
  while (frontier.length > 0) {
    const next: Quantity[][] = []
    for (const path of frontier) {
      const known = knownOf(path)
      for (const q of list) {
        if (known.includes(q)) continue
        const onlySum = q === problem.asked && isAggregate(q)
        if (!derive(q, known, path, onlySum, named.union)) continue
        const extended = [...path, q]
        if (q === problem.asked) return extended
        const key = list.filter((c) => extended.includes(c)).join()
        if (seen.has(key)) continue
        seen.add(key)
        next.push(extended)
      }
    }
    frontier = next
  }
  return null
}

/**
 * La soluzione: una quantità per riga, ciascuna con una sola incognita, fino
 * a quella chiesta. `words` sono le parole dell'ambientazione, per i nomi.
 */
export function solveVenn(problem: VennProblem): VennRow[] {
  const k = setCount(problem)
  const { words } = settingOf(problem.setting)
  const named = quantities(k)
  const path = shortestPath(problem)
  if (!path) throw new RangeError('Il problema chiede un sistema')
  const eitherButNot =
    k === 3
      ? [
          [0, 1, 2],
          [0, 2, 1],
          [1, 2, 0],
        ].map(([i = 0, j = 0, not = 0]) => named.eitherButNot(i, j, not))
      : []
  const rows: VennRow[] = []
  const found: Quantity[] = []
  for (const q of path) {
    const known = [
      ...problem.data,
      ...found.filter((f) => !problem.data.includes(f)),
    ]
    const onlySum = q === problem.asked && popcount(q) > 1 && q !== named.union
    const d = derive(q, known, found, onlySum, named.union)
    if (!d) throw new Error('Riga impossibile')
    const expression = expressionOf(problem, d)
    const from = d.kind === 'difference' ? d.from : null
    rows.push({
      found: q,
      name: quantityName(q, k, words),
      expression,
      solution: solve(expression),
      value: valueOf(problem, q),
      uses: usesOf(d),
      backwards:
        from !== null && eitherButNot.includes(from)
          ? quantityName(from, k, words)
          : null,
    })
    found.push(q)
  }
  return rows
}

export function vennAnswer(problem: VennProblem): bigint {
  return valueOf(problem, problem.asked)
}

/**
 * Le regioni note dopo `shown` righe, nell'ordine in cui si riempiono:
 * prima quelle che il testo dà, poi quelle trovate dalle righe.
 */
export function regionsKnownAfter(
  problem: VennProblem,
  shown: number,
): number[] {
  const given = problem.data.filter((q) => popcount(q) === 1)
  const rows = solveVenn(problem).slice(0, shown)
  const filled = [...given, ...rows.map((r) => r.found)].filter(
    (q) => popcount(q) === 1,
  )
  return [...new Set(filled)].flatMap(regionsOf)
}

/**
 * I valori che danno le regole sbagliate sul problema, con l'errore che li
 * spiega, dal più preciso. Ognuno è una regola di riempimento sbagliata
 * applicata alle regioni vere.
 */
export function vennWrongResults(
  problem: VennProblem,
): { readonly id: SetMisconceptionId; readonly value: bigint }[] {
  const k = setCount(problem)
  const named = quantities(k)
  const v = (q: Quantity) => valueOf(problem, q)
  const { asked } = problem
  const pairs: [number, number][] =
    k === 2
      ? [[0, 1]]
      : [
          [0, 1],
          [0, 2],
          [1, 2],
        ]
  const atLeastSum = named.eachAtLeast.reduce((s, q) => s + v(q), 0n)
  const pairSum = pairs.reduce(
    (s, [i, j]) => s + v(named.atLeastBoth(i, j)),
    0n,
  )
  const out: { id: SetMisconceptionId; value: bigint }[] = []

  if (k === 3) {
    // Il centro tolto con le coppie e non riaggiunto.
    const unionWithout = atLeastSum - pairSum
    if (asked === named.union)
      out.push({ id: 'centre-not-added-back', value: unionWithout })
    if (asked === 1)
      out.push({
        id: 'centre-not-added-back',
        value: v(named.total) - unionWithout,
      })
    named.eachAtLeast.forEach((q, i) => {
      if (asked !== 1 << (1 << i)) return
      const others = pairs.filter((p) => p.includes(i))
      const value = others.reduce(
        (s, [a, b]) => s - v(named.atLeastBoth(a, b)),
        v(q),
      )
      out.push({ id: 'centre-not-added-back', value })
    })
  } else {
    // card(A ∪ B) = card(A) + card(B), senza togliere l'intersezione.
    const twice = atLeastSum
    if (asked === named.union)
      out.push({ id: 'intersection-counted-twice', value: twice })
    if (asked === 1)
      out.push({
        id: 'intersection-counted-twice',
        value: v(named.total) - twice,
      })
  }
  // La risposta a "nessuno" è quella di "almeno uno".
  if (asked === 1) out.push({ id: 'outside-forgotten', value: v(named.union) })
  // "Solo A" letto come "almeno A", anche "solo A e B" come "A e B".
  named.eachAtLeast.forEach((q, i) => {
    if (asked === 1 << (1 << i))
      out.push({ id: 'only-as-at-least', value: v(q) })
  })
  if (k === 3)
    for (const [i, j] of pairs)
      if (asked === 1 << ((1 << i) | (1 << j)))
        out.push({ id: 'only-as-at-least', value: v(named.atLeastBoth(i, j)) })

  const correct = vennAnswer(problem)
  return out.filter((w) => w.value !== correct)
}

// La costruzione di un problema con due insiemi: le regioni, poi la domanda,
// poi tre dati oltre al totale, che l'apertura del testo scrive sempre.
// Scarta il problema se la domanda chiede un sistema, se la soluzione ha una
// riga sola, o se un dato resta inutile: ogni dato serve a una riga.

export function buildVenn2(random: Random, setting: string): VennProblem {
  const named = quantities(2)
  const regions = [
    random.int(2n, 12n),
    random.int(2n, 20n),
    random.int(2n, 20n),
    random.int(2n, 15n),
  ]
  const asked = random.pick([
    named.region(0),
    named.region(1),
    named.region(2),
    named.region(3),
    named.union,
    named.exactlyOne,
  ])
  const pool = [
    named.atLeast(0),
    named.atLeast(1),
    named.region(1),
    named.region(2),
    named.region(3),
    named.region(0),
    named.union,
  ].filter((q) => q !== asked)
  const chosen: Quantity[] = []
  while (chosen.length < 3) {
    const q = random.pick(pool)
    if (!chosen.includes(q)) chosen.push(q)
  }
  // I dati nell'ordine in cui un testo li scrive: prima gli insiemi, poi le
  // regioni, l'esterno per ultimo.
  const data = [named.total, ...pool.filter((q) => chosen.includes(q))]
  return { setting, regions, data, asked }
}

export function acceptsVenn(problem: VennProblem): boolean {
  if (problemText(problem) === null) return false
  const total = problem.regions.reduce((a, b) => a + b, 0n)
  if (total > 60n || problem.regions.some((r) => r > 30n)) return false
  const path = shortestPath(problem)
  if (!path || path.length < 2) return false
  const named = quantities(setCount(problem))
  const used = new Set(solveVenn(problem).flatMap((r) => r.uses))
  return problem.data.every((q) => q === named.total || used.has(q))
}

/** Il ruolo di una quantità nel testo, per scegliere il suo modello di frase. */
export function roleOf(q: Quantity, k: 2 | 3): Role | null {
  const named = quantities(k)
  if (popcount(q) === 1) {
    const [r = 0] = regionsOf(q)
    return { kind: 'region', inside: bitsOf(r, k) }
  }
  if (q === named.total) return { kind: 'total' }
  if (q === named.union) return { kind: 'union' }
  if (q === named.exactlyOne) return { kind: 'exactly-one' }
  const single = named.eachAtLeast.indexOf(q)
  if (single >= 0) return { kind: 'at-least', sets: [single] }
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) {
      if (q === named.atLeastBoth(i, j))
        return { kind: 'at-least', sets: [i, j] }
      const not = 3 - i - j
      if (k === 3 && q === named.eitherButNot(i, j, not))
        return { kind: 'either-but-not', sets: [i, j], not }
    }
  return null
}

function listed(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} e ${items.at(-1) ?? ''}`
}

/**
 * Il testo del problema, dai modelli della sua ambientazione: l'apertura
 * con il totale, i dati nell'ordine, la domanda. Null se un modello manca.
 */
export function problemText(problem: VennProblem): string | null {
  const k = setCount(problem)
  const setting = settingOf(problem.setting)
  const named = quantities(k)
  const total = problem.data.includes(named.total)
  const sentences: string[] = []
  for (const q of problem.data) {
    if (q === named.total) continue
    const role = roleOf(q, k)
    const sentence = role && setting.sentence(role, valueOf(problem, q))
    if (!sentence) return null
    sentences.push(sentence)
  }
  const role = roleOf(problem.asked, k)
  const question = role && setting.question(role)
  if (!question) return null
  const opening = setting.opening(total ? valueOf(problem, named.total) : null)
  return `${opening} ${listed(sentences)}. ${question}`
}

export const vennVersions = { 'set.venn2': 1 } as const

/** Un problema dal seme: lo stesso seme scarta sempre gli stessi. */
export function generateVenn(
  skill: ProblemExercise['skill'],
  seed: number,
): ProblemExercise {
  const random = seededRandom(seed)
  for (let i = 0; i < 1000; i++) {
    const problem = buildVenn2(random, random.pick(twoSetSettings))
    if (acceptsVenn(problem))
      return {
        kind: 'problem',
        skill,
        seed,
        generatorVersion: vennVersions['set.venn2'],
        problem,
      }
  }
  throw new Error('Nessun problema valido')
}
