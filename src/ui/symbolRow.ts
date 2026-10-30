// La riga di simboli sotto il campo risposta, sul telefono: il segno meno,
// la frazione, la potenza e le tonde che la tastiera di sistema nasconde.

export interface SymbolKey {
  readonly symbol: string
  /** Il nome accessibile del tasto, in italiano. */
  readonly label: string
}

export const symbolKeys: readonly SymbolKey[] = [
  { symbol: '−', label: 'meno' },
  { symbol: '/', label: 'linea di frazione' },
  { symbol: '^', label: 'elevato a' },
  { symbol: '(', label: 'apri tonda' },
  { symbol: ')', label: 'chiudi tonda' },
]

/** Scrive `symbol` al posto della selezione [start, end) e dice dove sta il
 * cursore: subito dopo. Senza selezione nota (`null`, campo sfocato) si
 * scrive in fondo. Il valore non viene mai giudicato: quello è compito di
 * `verify`. */
export function insertAtCursor(
  value: string,
  symbol: string,
  start: number | null,
  end: number | null,
): { value: string; caret: number } {
  const from = Math.min(Math.max(start ?? value.length, 0), value.length)
  const to = Math.min(Math.max(end ?? value.length, from), value.length)
  return {
    value: value.slice(0, from) + symbol + value.slice(to),
    caret: from + symbol.length,
  }
}
