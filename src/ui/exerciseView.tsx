import {
  literal,
  solve,
  toText,
  unknownKind,
  type Exercise,
  type Expression,
  type Solution,
} from '../engine/index.ts'
import { ExpressionFormula } from './Formula.tsx'

// Ciò che le pagine mostrano di un esercizio, secondo il suo tipo di risposta
// (SPEC.md, "Tipi di risposta"): la consegna, le parole che la presentano, la
// soluzione per righe e il risultato. Un tipo nuovo si tratta qui; il
// compilatore indica ogni `switch` che lo aspetta.

/** Le parole della consegna: il compito sul quaderno, la domanda in lezione. */
export function wordingOf(exercise: Exercise): {
  readonly task: string
  readonly question: string
} {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return {
        task: 'Calcola il valore dell’espressione',
        question: 'Quanto vale?',
      }
    default:
      return unknownKind(exercise.kind)
  }
}

export function solutionOf(exercise: Exercise): Solution {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return solve(exercise.expression)
    default:
      return unknownKind(exercise.kind)
  }
}

/** Il risultato come lo scrive la soluzione, in testo semplice. */
export function resultText(exercise: Exercise): string {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return toText(literal(solve(exercise.expression).result))
    default:
      return unknownKind(exercise.kind)
  }
}

/** La consegna in testo semplice, per i nomi accessibili. */
export function consegnaText(exercise: Exercise): string {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return toText(exercise.expression)
    default:
      return unknownKind(exercise.kind)
  }
}

/**
 * L'espressione da svolgere passo passo, se l'esercizio la ha. Il passo
 * passo c'è solo per le abilità del capitolo 1, quelle dei numeri naturali.
 */
export function stepExpression(exercise: Exercise): Expression | null {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return exercise.skill.startsWith('n.') ? exercise.expression : null
    default:
      return unknownKind(exercise.kind)
  }
}

export function Consegna({
  exercise,
  className,
}: {
  exercise: Exercise
  className?: string
}) {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return (
        <ExpressionFormula
          expression={exercise.expression}
          {...(className === undefined ? {} : { className })}
        />
      )
    default:
      return unknownKind(exercise.kind)
  }
}
