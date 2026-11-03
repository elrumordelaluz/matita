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
    id: 'mono.value',
    title: 'Il valore numerico',
    prerequisites: ['pow.basics', 'q.order'],
  },
]
