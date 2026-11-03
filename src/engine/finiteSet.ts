// L'insieme del capitolo 5: un insieme finito di naturali. Vedi SPEC.md,
// "Insiemi", "Il dato". Gli elementi si tengono in ordine crescente e senza
// ripetizioni, così due insiemi uguali hanno la stessa forma; l'ordine in cui
// lo studente li scrive è un'altra cosa e non conta.

export interface FiniteSet {
  /** Gli elementi, in ordine crescente e una volta sola. */
  readonly elements: readonly bigint[]
}

export function finiteSet(elements: Iterable<bigint>): FiniteSet {
  const sorted = [...new Set(elements)].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  )
  return { elements: sorted }
}

/** I naturali da `from` a `to`, estremi compresi. */
export function range(from: bigint, to: bigint): FiniteSet {
  const elements: bigint[] = []
  for (let n = from; n <= to; n++) elements.push(n)
  return { elements }
}

export function has(set: FiniteSet, n: bigint): boolean {
  return set.elements.includes(n)
}

export function setEquals(a: FiniteSet, b: FiniteSet): boolean {
  return (
    a.elements.length === b.elements.length &&
    a.elements.every((n, i) => n === b.elements[i])
  )
}

export function card(set: FiniteSet): bigint {
  return BigInt(set.elements.length)
}

export function isSubset(a: FiniteSet, b: FiniteSet): boolean {
  return a.elements.every((n) => has(b, n))
}

export function union(a: FiniteSet, b: FiniteSet): FiniteSet {
  return finiteSet([...a.elements, ...b.elements])
}

export function intersection(a: FiniteSet, b: FiniteSet): FiniteSet {
  return { elements: a.elements.filter((n) => has(b, n)) }
}

export function difference(a: FiniteSet, b: FiniteSet): FiniteSet {
  return { elements: a.elements.filter((n) => !has(b, n)) }
}

/** Il complementare di `a` rispetto all'universo `u`: U − A. */
export function complement(a: FiniteSet, u: FiniteSet): FiniteSet {
  return difference(u, a)
}

export function setToText(set: FiniteSet): string {
  return set.elements.length === 0 ? '∅' : `{${set.elements.join(', ')}}`
}

export function setToKatex(set: FiniteSet): string {
  return set.elements.length === 0
    ? '\\varnothing'
    : `\\{${set.elements.join(', ')}\\}`
}
