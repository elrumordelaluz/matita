import { useId, useState, type FormEvent } from 'react'
import {
  rationalToText,
  solve,
  toText,
  verify,
  type Exercise,
  type Outcome,
} from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import { ExpressionFormula } from './Formula.tsx'

// Una domanda di controllo dentro una lezione: si può riprovare finché si
// vuole, e un errore tipico mostra la sua spiegazione.

function message(outcome: Outcome, exercise: Exercise): string {
  switch (outcome.kind) {
    case 'correct':
      return 'Esatto!'
    case 'misconception':
      return `Non è corretto. ${outcome.explanation}`
    case 'wrong':
      return `Non è corretto: il risultato è ${rationalToText(solve(exercise.expression).result)}.`
    case 'invalid':
      return outcome.message
  }
}

export function CheckQuestion({ exercise }: { exercise: Exercise }) {
  const [answer, setAnswer] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const id = useId()

  function submit(event: FormEvent) {
    event.preventDefault()
    setOutcome(verify(answer, exercise))
  }

  return (
    <form
      role="group"
      aria-label={`Domanda: ${toText(exercise.expression)}`}
      onSubmit={submit}
      className="space-y-3 rounded border border-hair p-4"
    >
      <p className="text-sm text-dim">Prova tu: quanto vale?</p>
      <ExpressionFormula expression={exercise.expression} className="text-xl" />
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor={id} className="flex flex-col gap-1 text-sm">
          Risposta
          <input
            id={id}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            className="w-32 rounded border border-hair bg-white px-3 py-2 text-lg"
          />
        </label>
        <button type="submit" className="rounded bg-ink px-4 py-2 text-paper">
          Controlla
        </button>
      </div>
      {outcome && (
        <p
          role="status"
          className={cn(
            outcome.kind === 'correct' && 'text-ok',
            (outcome.kind === 'wrong' || outcome.kind === 'misconception') &&
              'text-err',
            outcome.kind === 'invalid' && 'text-warn',
          )}
        >
          {message(outcome, exercise)}
        </p>
      )}
    </form>
  )
}
