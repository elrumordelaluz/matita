import { useId, useState, type FormEvent } from 'react'
import {
  rationalToText,
  solve,
  stepExpression,
  toText,
  verify,
  type Exercise,
  type Outcome,
} from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import { ExpressionFormula } from './Formula.tsx'

// La pagina di pratica: espressione, risposta, esito, soluzione per righe.
// Gli esercizi vivono in memoria; il salvataggio dei tentativi arriva dopo.

export function PracticePage({
  createExercise,
}: {
  createExercise: () => Exercise
}) {
  const [exercise, setExercise] = useState(createExercise)
  const [answer, setAnswer] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [hints, setHints] = useState(0)
  const answerId = useId()

  const solution = solve(exercise.expression)
  const done = outcome !== null && outcome.kind !== 'invalid'
  const wrong = outcome?.kind === 'wrong' || outcome?.kind === 'misconception'
  const shownLines = done ? solution.lines : solution.lines.slice(0, hints)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!done) setOutcome(verify(answer, exercise))
  }

  function next() {
    setExercise(createExercise())
    setAnswer('')
    setOutcome(null)
    setHints(0)
  }

  return (
    <section aria-labelledby={`${answerId}-title`} className="space-y-6">
      <h2 id={`${answerId}-title`} className="text-sm text-dim">
        Calcola il valore dell’espressione
      </h2>
      <ExpressionFormula
        expression={exercise.expression}
        className="text-2xl"
      />

      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <label htmlFor={answerId} className="flex flex-col gap-1 text-sm">
          Risultato
          <input
            id={answerId}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            readOnly={done}
            inputMode="numeric"
            autoComplete="off"
            className="w-32 rounded border border-hair bg-white px-3 py-2 text-lg"
          />
        </label>
        <button
          type="submit"
          disabled={done}
          className="rounded bg-ink px-4 py-2 text-paper disabled:opacity-40"
        >
          Verifica
        </button>
        <button
          type="button"
          onClick={() => setHints((h) => h + 1)}
          disabled={done || hints >= solution.lines.length}
          className="rounded border border-hair px-4 py-2 disabled:opacity-40"
        >
          Suggerimento
        </button>
      </form>

      {outcome && (
        <p
          role="status"
          className={cn(
            outcome.kind === 'correct' && 'text-ok',
            wrong && 'text-err',
            outcome.kind === 'invalid' && 'text-warn',
          )}
        >
          {outcome.kind === 'correct' && 'Corretto!'}
          {wrong &&
            `Non è corretto: il risultato è ${rationalToText(solution.result)}.`}
          {outcome.kind === 'invalid' && outcome.message}
        </p>
      )}

      {outcome?.kind === 'misconception' && (
        <p className="rounded border border-hair p-3">{outcome.explanation}</p>
      )}

      {shownLines.length > 0 && (
        <section
          aria-labelledby={`${answerId}-solution`}
          className="space-y-3 border-t border-hair pt-4"
        >
          <h3 id={`${answerId}-solution`} className="text-sm text-dim">
            Soluzione
          </h3>
          <ol className="space-y-3">
            {shownLines.map((line, i) => (
              <li key={i}>
                <span className="mr-2 text-dim">=</span>
                <ExpressionFormula
                  expression={line.expression}
                  className="text-lg"
                />
                <ul className="mt-1 text-sm text-dim">
                  {line.steps.map((step, j) => (
                    <li key={j}>
                      {`${toText(stepExpression(step))} = ${rationalToText(step.result)}`}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}

      {done && (
        <button
          type="button"
          onClick={next}
          className="rounded bg-ink px-4 py-2 text-paper"
        >
          Esercizio successivo
        </button>
      )}
    </section>
  )
}
