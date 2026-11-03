import {
  answerForm,
  literal,
  readSetAnswer,
  setToText,
  solve,
  solveSet,
  toKatex,
  toText,
  unknownKind,
  type AnswerForm,
  type Exercise,
  type Expression,
  type Line,
} from '../engine/index.ts'
import { ExpressionFormula } from './Formula.tsx'
import {
  SetConsegna,
  setConsegnaText,
  setLines,
  setWording,
} from './setView.tsx'
import { setSymbolKeys, symbolKeys, type SymbolKey } from './symbolRow.ts'

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
    case 'set':
      return setWording(exercise)
    default:
      return unknownKind(exercise)
  }
}

/**
 * Una riga della soluzione come la scrive il quaderno, qualunque sia il
 * tipo: la formula, e a margine i passaggi.
 */
export interface ShownLine {
  readonly tex: string
  readonly text: string
  /** La riga continua quella sopra, e a margine porta il segno =. */
  readonly continues: boolean
  /** I passaggi, uno per conto, scritti a margine. */
  readonly notes: readonly string[]
}

/** Una riga del risolutore dei numeri: l'espressione e i suoi conti. */
export function numberLine(line: Line): ShownLine {
  return {
    tex: toKatex(line.expression),
    text: toText(line.expression),
    continues: true,
    notes: line.steps.map(
      (step) => `${toText(step.operation)} = ${toText(step.outcome)}`,
    ),
  }
}

export function solutionOf(exercise: Exercise): readonly ShownLine[] {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return solve(exercise.expression).lines.map(numberLine)
    case 'set':
      return setLines(exercise)
    default:
      return unknownKind(exercise)
  }
}

/** Il risultato come lo scrive la soluzione, in testo semplice. */
export function resultText(exercise: Exercise): string {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return toText(literal(solve(exercise.expression).result))
    case 'set':
      return setToText(solveSet(exercise).result)
    default:
      return unknownKind(exercise)
  }
}

/** La consegna in testo semplice, per i nomi accessibili. */
export function consegnaText(exercise: Exercise): string {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return toText(exercise.expression)
    case 'set':
      return setConsegnaText(exercise)
    default:
      return unknownKind(exercise)
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
    case 'set':
      return null
    default:
      return unknownKind(exercise)
  }
}

/** La risposta come scritta, per l'anteprima, o nulla se non si legge. */
export function answerPreview(
  exercise: Exercise,
  answer: string,
): AnswerForm | null {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return answerForm(answer)
    case 'set': {
      const reading = readSetAnswer(answer)
      return reading.ok ? reading.form : null
    }
    default:
      return unknownKind(exercise)
  }
}

/** I tasti della riga simboli sul telefono, quelli che servono al tipo. */
export function keysOf(exercise: Exercise): readonly SymbolKey[] {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return symbolKeys
    case 'set':
      return setSymbolKeys
    default:
      return unknownKind(exercise)
  }
}

export function Consegna({
  exercise,
  className,
}: {
  exercise: Exercise
  className?: string
}) {
  const size = className === undefined ? {} : { className }
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return <ExpressionFormula expression={exercise.expression} {...size} />
    case 'set':
      return <SetConsegna exercise={exercise} {...size} />
    default:
      return unknownKind(exercise)
  }
}
