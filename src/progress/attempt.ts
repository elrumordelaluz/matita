// Il tentativo come lo descrive SPEC.md, "Ripasso e tracking". È l'unica
// cosa che si salva: lo stato delle abilità e le carte FSRS si ricalcolano
// dai tentativi, così l'esportazione basta come backup.

// Gli esiti con cui un esercizio si chiude, come stringhe stabili: finiscono
// nel file di backup e non devono cambiare se cambia il tipo del motore.
// `rewrite` non compare: una riscrittura non chiude l'esercizio e si conta in
// `rewrites`.
export const attemptOutcomes = [
  'correct',
  'misconception',
  'wrong',
  'invalid',
] as const

export type AttemptOutcome = (typeof attemptOutcomes)[number]

export interface Attempt {
  readonly id: string
  readonly skill: string
  readonly seed: number
  readonly generatorVersion: number
  readonly answer: string
  readonly outcome: AttemptOutcome
  /** Id dell'errore tipico riconosciuto, solo con esito `misconception`. */
  readonly misconception: string | null
  readonly hints: number
  readonly rewrites: number
  readonly durationMs: number
  /** Millisecondi dall'epoca Unix. */
  readonly answeredAt: number
}

export function isAssisted(attempt: Attempt): boolean {
  return attempt.hints > 0 || attempt.rewrites > 0
}

export function chronological(attempts: readonly Attempt[]): Attempt[] {
  return [...attempts].sort((a, b) => a.answeredAt - b.answeredAt)
}
