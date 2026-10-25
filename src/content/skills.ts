// Le abilità del percorso e i loro prerequisiti. Vedi SPEC.md, "Abilità del
// primo capitolo". Gli id sono stabili: finiscono nei tentativi salvati.

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
]
