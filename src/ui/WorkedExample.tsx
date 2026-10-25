import { useId, useState } from 'react'
import {
  rationalToText,
  solve,
  stepExpression,
  toText,
  type Exercise,
  type Line,
} from '../engine/index.ts'
import { ExpressionFormula } from './Formula.tsx'

// Un esempio svolto: l'esercizio risolto dal motore, riga per riga. Ogni
// riga si vede intera e si apre un passaggio alla volta.

export function WorkedExample({ exercise }: { exercise: Exercise }) {
  const titleId = useId()
  const { lines } = solve(exercise.expression)
  return (
    <figure
      aria-labelledby={titleId}
      className="space-y-3 rounded border border-hair p-4"
    >
      <figcaption id={titleId} className="text-sm text-dim">
        Esempio: {toText(exercise.expression)}
      </figcaption>
      <ExpressionFormula expression={exercise.expression} className="text-xl" />
      <ol className="space-y-3">
        {lines.map((line, i) => (
          <ExampleLine key={i} line={line} index={i + 1} />
        ))}
      </ol>
    </figure>
  )
}

function ExampleLine({ line, index }: { line: Line; index: number }) {
  const [open, setOpen] = useState(0)
  return (
    <li aria-label={`Riga ${index}`}>
      <span className="mr-2 text-dim">=</span>
      <ExpressionFormula expression={line.expression} className="text-lg" />
      {open > 0 && (
        <ol className="mt-1 space-y-1 text-sm text-dim">
          {line.steps.slice(0, open).map((step, j) => (
            <li key={j} className="flex flex-wrap items-baseline gap-2">
              <span>{`${toText(stepExpression(step))} = ${rationalToText(step.result)}`}</span>
              <span aria-hidden="true">→</span>
              <ExpressionFormula expression={step.expression} />
            </li>
          ))}
        </ol>
      )}
      {open < line.steps.length && (
        <button
          type="button"
          onClick={() => setOpen((n) => n + 1)}
          className="mt-1 block text-sm text-dim underline"
        >
          Mostra un passaggio
        </button>
      )}
    </li>
  )
}
