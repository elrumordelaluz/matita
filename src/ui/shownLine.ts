import { toKatex, toText, type Line } from '../engine/index.ts'

// La riga della soluzione come la mostra il quaderno, fuori da
// `exerciseView.tsx`: le viste di ogni tipo la usano, e `exerciseView` usa
// loro.

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
