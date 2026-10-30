import {
  generate,
  misconceptions,
  type Expression,
  type GeneratedSkill,
} from '../engine/index.ts'
import { chronological, type Attempt } from './attempt.ts'

// Gli ultimi tentativi di un’abilità, per la pagina dei progressi. Il tentativo
// salva seme e versione del generatore (SPEC.md, “Ripasso e tracking”), così
// l’esercizio si ricostruisce; la spiegazione dell’errore tipico arriva dal
// catalogo del motore. Risposta, esito e data sono già nel tentativo.

export interface AttemptEntry {
  readonly attempt: Attempt
  /** L’esercizio ricostruito dal seme, se la ricostruzione è fedele. */
  readonly expression: Expression | null
  /** La spiegazione dell’errore tipico riconosciuto, se il catalogo lo conosce. */
  readonly explanation: string | null
}

/** Gli ultimi cinque tentativi di un’abilità, dal più recente. */
export function latestAttempts(
  attempts: readonly Attempt[],
  skill: string,
): AttemptEntry[] {
  return chronological(attempts)
    .filter((a) => a.skill === skill)
    .slice(-5)
    .reverse()
    .map((attempt) => ({
      attempt,
      expression: rebuild(attempt),
      explanation: explanationOf(attempt),
    }))
}

// Stesso seme, stesso esercizio, purché il generatore sia quello di allora:
// con un’altra versione l’esercizio ricostruito sarebbe un altro, e non si
// mostra mai uno sbagliato. Un’abilità senza generatore, arrivata da una
// versione passata del percorso, non si può ricostruire: non è un errore.
function rebuild(attempt: Attempt): Expression | null {
  try {
    const exercise = generate(attempt.skill as GeneratedSkill, attempt.seed)
    return exercise.generatorVersion === attempt.generatorVersion
      ? exercise.expression
      : null
  } catch {
    return null
  }
}

function explanationOf(attempt: Attempt): string | null {
  return (
    misconceptions.find((m) => m.id === attempt.misconception)?.explanation ??
    null
  )
}
