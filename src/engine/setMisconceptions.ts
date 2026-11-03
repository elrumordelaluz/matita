// Gli errori tipici del capitolo 5, con la spiegazione per lo studente. Come
// nei capitoli dei numeri ognuno è una regola sbagliata: il motore la applica
// all'esercizio e confronta il risultato con la risposta. Le regole stanno
// accanto a quelle giuste (setRoster.ts e seguenti), qui il catalogo. Vedi
// SPEC.md, "Insiemi", "Errori tipici".

export type SetMisconceptionId =
  | 'empty-set-has-elements'
  | 'bound-inclusion-swapped'
  | 'natural-without-zero'
  | 'zero-not-even'

export interface SetMisconception {
  readonly id: SetMisconceptionId
  /** Il testo per lo studente, in italiano. */
  readonly explanation: string
}

export const setMisconceptions: readonly SetMisconception[] = [
  {
    id: 'empty-set-has-elements',
    explanation:
      'L’insieme vuoto non ha elementi, nemmeno lo zero o il vuoto: si scrive ∅ oppure {}. {0} ha un elemento, lo zero, e {∅} ne ha uno, il vuoto.',
  },
  {
    id: 'bound-inclusion-swapped',
    explanation:
      'Hai scambiato < e ≤. x < 7 non comprende il 7, x ≤ 7 sì: l’estremo appartiene all’insieme solo con ≤.',
  },
  {
    id: 'natural-without-zero',
    explanation:
      'Hai lasciato fuori lo zero. N = {0, 1, 2, 3, …}: lo zero è un numero naturale.',
  },
  {
    id: 'zero-not-even',
    explanation:
      'Hai lasciato fuori lo zero. Lo zero è pari, e multiplo di ogni numero: 0 = 2 × 0.',
  },
]

export function setExplanation(id: SetMisconceptionId): string {
  const found = setMisconceptions.find((m) => m.id === id)
  if (!found) throw new RangeError(`Errore tipico sconosciuto: ${id}`)
  return found.explanation
}
