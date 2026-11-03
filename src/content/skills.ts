// Le abilità del percorso e i loro prerequisiti. Vedi SPEC.md, "Abilità del
// primo capitolo" e seguenti. Gli id sono stabili: finiscono nei tentativi
// salvati.

export interface Skill {
  readonly id: string
  readonly title: string
  readonly prerequisites: readonly string[]
}

export const skills: readonly Skill[] = [
  {
    id: 'n.add-sub',
    title: 'Addizioni e sottrazioni',
    prerequisites: [],
  },
  {
    id: 'n.mul-div',
    title: 'Moltiplicazioni e divisioni',
    prerequisites: [],
  },
  {
    id: 'n.order',
    title: 'Le quattro operazioni insieme',
    prerequisites: ['n.add-sub', 'n.mul-div'],
  },
  {
    id: 'n.parens',
    title: 'Parentesi tonde',
    prerequisites: ['n.order'],
  },
  {
    id: 'n.brackets',
    title: 'Tonde, quadre e graffe',
    prerequisites: ['n.parens'],
  },
  {
    id: 'z.add-sub',
    title: 'Somma algebrica',
    prerequisites: ['n.add-sub'],
  },
  {
    id: 'z.mul-div',
    title: 'La regola dei segni',
    prerequisites: ['n.mul-div'],
  },
  {
    id: 'z.order',
    title: 'Le quattro operazioni con i relativi',
    prerequisites: ['z.add-sub', 'z.mul-div', 'n.order'],
  },
  {
    id: 'z.minus-group',
    title: 'Il meno davanti alla parentesi',
    prerequisites: ['z.order', 'n.parens'],
  },
  {
    id: 'z.brackets',
    title: 'Tonde, quadre e graffe in Z',
    prerequisites: ['z.minus-group', 'n.brackets'],
  },
  {
    id: 'q.add-sub',
    title: 'Somma di frazioni',
    prerequisites: ['z.add-sub'],
  },
  {
    id: 'q.mul-div',
    title: 'Prodotto e quoziente di frazioni',
    prerequisites: ['z.mul-div'],
  },
  {
    id: 'q.order',
    title: 'Le quattro operazioni con le frazioni',
    prerequisites: ['q.add-sub', 'q.mul-div', 'z.order'],
  },
  {
    id: 'q.brackets',
    title: 'Tonde, quadre e graffe in Q',
    prerequisites: ['q.order', 'z.brackets'],
  },
  {
    id: 'pow.basics',
    title: 'La potenza',
    prerequisites: ['z.mul-div'],
  },
  {
    id: 'pow.properties',
    title: 'Le proprietà delle potenze',
    prerequisites: ['pow.basics'],
  },
  {
    id: 'pow.zero-negative',
    title: 'Esponente zero e negativo',
    prerequisites: ['pow.properties', 'q.mul-div'],
  },
  {
    id: 'pow.expressions',
    title: 'Espressioni con le potenze',
    prerequisites: ['pow.zero-negative', 'q.brackets'],
  },
  {
    id: 'set.roster',
    title: 'Dalla proprietà all’elencazione',
    prerequisites: ['n.mul-div'],
  },
  {
    id: 'set.relations',
    title: 'Appartenenza e inclusione',
    prerequisites: ['set.roster'],
  },
  {
    id: 'set.operations',
    title: 'Le operazioni fra insiemi',
    prerequisites: ['set.roster'],
  },
  {
    id: 'set.parts-product',
    title: 'Insieme delle parti e prodotto cartesiano',
    prerequisites: ['set.operations', 'pow.basics'],
  },
  {
    id: 'set.venn2',
    title: 'Problemi con due insiemi',
    prerequisites: ['set.operations', 'n.parens'],
  },
  {
    id: 'set.venn3',
    title: 'Problemi con tre insiemi',
    prerequisites: ['set.venn2'],
  },
  {
    id: 'mono.value',
    title: 'Il valore numerico',
    prerequisites: ['pow.basics', 'q.order'],
  },
  {
    id: 'mono.normal-form',
    title: 'La forma normale di un monomio',
    prerequisites: ['pow.properties', 'q.mul-div'],
  },
  {
    id: 'mono.add-sub',
    title: 'Somma algebrica di monomi',
    prerequisites: ['mono.normal-form', 'q.add-sub', 'z.minus-group'],
  },
  {
    id: 'mono.mul-div',
    title: 'Prodotto e quoziente di monomi',
    prerequisites: ['mono.normal-form'],
  },
  {
    id: 'mono.power',
    title: 'La potenza di un monomio',
    prerequisites: ['mono.mul-div'],
  },
  {
    id: 'mono.expressions',
    title: 'Espressioni con i monomi',
    prerequisites: ['mono.add-sub', 'mono.power', 'q.brackets'],
  },
  {
    id: 'poly.add-sub',
    title: 'Somma algebrica di polinomi',
    prerequisites: ['mono.add-sub'],
  },
  {
    id: 'poly.mono-times',
    title: 'Monomio per polinomio, polinomio diviso monomio',
    prerequisites: ['poly.add-sub', 'mono.mul-div'],
  },
  {
    id: 'poly.times',
    title: 'Polinomio per polinomio',
    prerequisites: ['poly.mono-times'],
  },
  {
    id: 'poly.square',
    title: 'Il quadrato di un binomio',
    prerequisites: ['poly.times', 'mono.power'],
  },
  {
    id: 'poly.sum-diff',
    title: 'Somma per differenza',
    prerequisites: ['poly.times', 'mono.power'],
  },
  {
    id: 'poly.more-notable',
    title: 'Quadrato di un trinomio, cubo di un binomio',
    prerequisites: ['poly.square'],
  },
]
