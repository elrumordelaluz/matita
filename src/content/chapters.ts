import { skills, type Skill } from './skills.ts'

// I capitoli del percorso, nell'ordine di SPEC.md, "Percorso". Ogni capitolo
// raccoglie le sue abilità per prefisso dell'id.

export type ChapterId = 'n' | 'z' | 'q' | 'pow'

export interface Chapter {
  readonly id: ChapterId
  readonly number: number
  readonly title: string
  readonly blurb: string
  readonly skills: readonly Skill[]
}

const skillsOf = (id: ChapterId) =>
  skills.filter((s) => s.id.startsWith(`${id}.`))

export const chapters: readonly Chapter[] = [
  {
    id: 'n',
    number: 1,
    title: 'Espressioni in N',
    blurb: 'Le quattro operazioni, l’ordine, le parentesi.',
    skills: skillsOf('n'),
  },
  {
    id: 'z',
    number: 2,
    title: 'Espressioni in Z',
    blurb: 'Somma algebrica, regola dei segni, il meno davanti alla parentesi.',
    skills: skillsOf('z'),
  },
  {
    id: 'q',
    number: 3,
    title: 'Espressioni in Q',
    blurb: 'Minimi termini, minimo comune multiplo, il reciproco.',
    skills: skillsOf('q'),
  },
  {
    id: 'pow',
    number: 4,
    title: 'Potenze',
    blurb: 'Le proprietà, l’esponente zero e negativo, −3² e (−3)².',
    skills: skillsOf('pow'),
  },
]

export function chapterById(id: ChapterId): Chapter {
  const chapter = chapters.find((c) => c.id === id)
  if (!chapter) throw new RangeError(`Capitolo sconosciuto: ${id}`)
  return chapter
}

export function chapterOf(skill: string): Chapter | undefined {
  return chapters.find((c) => c.skills.some((s) => s.id === skill))
}
