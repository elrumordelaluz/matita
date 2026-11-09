// Generatore pseudocasuale seminato (mulberry32): stesso seme, stessa
// sequenza. Restituisce bigint perché i valori del motore sono bigint.

export interface Random {
  /** Intero uniforme fra min e max, estremi inclusi. */
  int(min: bigint, max: bigint): bigint
  pick<T>(items: readonly T[]): T
}

export function seededRandom(seed: number): Random {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    int(min, max) {
      if (max < min) throw new RangeError('Intervallo vuoto')
      const span = Number(max - min + 1n)
      return min + BigInt(Math.floor(next() * span))
    },
    pick(items) {
      const item = items[Math.floor(next() * items.length)]
      if (item === undefined) throw new RangeError('Nessun elemento')
      return item
    },
  }
}
