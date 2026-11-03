import {
  literal,
  solveWithValues,
  substitute,
  toKatex,
  toText,
  unknownKind,
  type Assignment,
  type Exercise,
  type Expression,
  type Line,
} from '../engine/index.ts'
import { ExpressionFormula, Formula } from './Formula.tsx'

// Ciò che le pagine mostrano di un esercizio, secondo il suo tipo di risposta
// (SPEC.md, "Tipi di risposta"): la consegna, le parole che la presentano, la
// soluzione per righe e il risultato. Un tipo nuovo si tratta qui; il
// compilatore indica ogni `switch` che lo aspetta.

/** La soluzione da mostrare: le righe del quaderno, qualunque sia il tipo. */
export interface ShownSolution {
  readonly lines: readonly Line[]
}

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

export function solutionOf(exercise: Exercise): ShownSolution {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return solveWithValues(exercise.expression, exercise.substitution ?? [])
    default:
      return unknownKind(exercise.kind)
  }
}

/** Il risultato come lo scrive la soluzione, in testo semplice. */
export function resultText(exercise: Exercise): string {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return toText(
        literal(
          solveWithValues(exercise.expression, exercise.substitution ?? [])
            .result,
        ),
      )
    default:
      return unknownKind(exercise.kind)
  }
}

// I valori delle lettere come li dà la consegna: per a = −2, b = 3.
function valuesText(substitution: readonly Assignment[]): string {
  return substitution
    .map(({ letter, value }) => `${letter} = ${toText(literal(value))}`)
    .join(', ')
}

function valuesKatex(substitution: readonly Assignment[]): string {
  return substitution
    .map(({ letter, value }) => `${letter} = ${toKatex(literal(value))}`)
    .join(',\\; ')
}

/** La consegna in testo semplice, per i nomi accessibili. */
export function consegnaText(exercise: Exercise): string {
  switch (exercise.kind) {
    case undefined:
    case 'number': {
      const text = toText(exercise.expression)
      const { substitution = [] } = exercise
      return substitution.length > 0
        ? `${text}, per ${valuesText(substitution)}`
        : text
    }
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
      return exercise.skill.startsWith('n.')
        ? substitute(exercise.expression, [])
        : null
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
  const classes = className === undefined ? {} : { className }
  switch (exercise.kind) {
    case undefined:
    case 'number': {
      const { substitution = [] } = exercise
      if (substitution.length === 0)
        return (
          <ExpressionFormula expression={exercise.expression} {...classes} />
        )
      return (
        <Formula
          tex={`${toKatex(exercise.expression)} \\quad \\text{per } ${valuesKatex(substitution)}`}
          text={consegnaText(exercise)}
          {...classes}
        />
      )
    }
    default:
      return unknownKind(exercise.kind)
  }
}
