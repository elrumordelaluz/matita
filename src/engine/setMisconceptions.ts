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
  | 'union-intersection-swapped'
  | 'difference-reversed'
  | 'element-as-subset'
  | 'subset-as-element'
  | 'proper-subset-of-equal'
  | 'parts-as-double'
  | 'product-as-sum'
  | 'intersection-counted-twice'
  | 'outside-forgotten'
  | 'only-as-at-least'
  | 'centre-not-added-back'

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
  {
    id: 'union-intersection-swapped',
    explanation:
      'Hai scambiato l’unione con l’intersezione. A ∪ B ha gli elementi che stanno in A o in B, almeno in uno dei due; A ∩ B solo quelli che stanno in tutti e due.',
  },
  {
    id: 'difference-reversed',
    explanation:
      'Hai calcolato B − A al posto di A − B. La differenza non è commutativa: A − B ha gli elementi di A che non stanno in B.',
  },
  {
    id: 'element-as-subset',
    explanation:
      'Hai usato l’inclusione per un numero. Un numero è un elemento: appartiene o non appartiene, 2 ∈ A. L’inclusione ⊂ vale fra due insiemi: {2} ⊂ A.',
  },
  {
    id: 'subset-as-element',
    explanation:
      'Hai usato l’appartenenza per un insieme. {2} è un insieme, non un elemento di A: si dice che è incluso, {2} ⊂ A. L’appartenenza vale per i numeri: 2 ∈ A.',
  },
  {
    id: 'proper-subset-of-equal',
    explanation:
      'I due insiemi hanno gli stessi elementi: sono uguali. ⊂ vuol dire sottoinsieme proprio, che ha meno elementi; fra due insiemi uguali si scrive =.',
  },
  {
    id: 'parts-as-double',
    explanation:
      'Hai moltiplicato 2 per il numero di elementi. Ogni elemento può stare in un sottoinsieme o restarne fuori: le scelte si moltiplicano, e con n elementi i sottoinsiemi sono 2ⁿ. Con 3 elementi sono 2³ = 8, non 2 × 3.',
  },
  {
    id: 'product-as-sum',
    explanation:
      'Hai sommato le cardinalità. Ogni elemento di A fa coppia con ogni elemento di B: le coppie sono card(A) × card(B).',
  },
  {
    id: 'intersection-counted-twice',
    explanation:
      'Hai contato due volte chi sta in tutti e due gli insiemi. In card(A) + card(B) l’intersezione c’è due volte: card(A ∪ B) = card(A) + card(B) − card(A ∩ B).',
  },
  {
    id: 'outside-forgotten',
    explanation:
      'Hai dato chi sta in almeno un insieme, ma la domanda chiede chi resta fuori: la regione esterna del diagramma. Si trova togliendo dal totale chi sta in almeno un insieme.',
  },
  {
    id: 'only-as-at-least',
    explanation:
      'Hai letto “solo” come “almeno”. Chi fa almeno una cosa può fare anche le altre: per avere chi fa solo quella si tolgono le parti in comune.',
  },
  {
    id: 'centre-not-added-back',
    explanation:
      'Il centro del diagramma, chi sta in tutti e tre, è stato tolto con ciascuna coppia e non è stato riaggiunto. Riempi il diagramma dal centro verso l’esterno, una regione alla volta.',
  },
]

export function setExplanation(id: SetMisconceptionId): string {
  const found = setMisconceptions.find((m) => m.id === id)
  if (!found) throw new RangeError(`Errore tipico sconosciuto: ${id}`)
  return found.explanation
}
