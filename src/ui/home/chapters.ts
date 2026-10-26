// I capitoli del percorso come li annuncia SPEC.md, "Percorso". Solo il primo
// ha già abilità e lezione; gli altri si vedono come anticipazione e passano
// in content/ quando si scrivono.

export interface ChapterTeaser {
  readonly number: number
  readonly title: string
  readonly blurb: string
}

export const firstChapter: ChapterTeaser = {
  number: 1,
  title: 'Espressioni in N',
  blurb: 'Le quattro operazioni, l’ordine, le parentesi.',
}

export const upcomingChapters: readonly ChapterTeaser[] = [
  {
    number: 2,
    title: 'Espressioni in Z',
    blurb: 'Somma algebrica, regola dei segni, il meno davanti alla parentesi.',
  },
  {
    number: 3,
    title: 'Espressioni in Q',
    blurb: 'Minimi termini, minimo comune multiplo, il reciproco.',
  },
  {
    number: 4,
    title: 'Potenze',
    blurb: 'Le proprietà, l’esponente zero e negativo, −3² e (−3)².',
  },
]
