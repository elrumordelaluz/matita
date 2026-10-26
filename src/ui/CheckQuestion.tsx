import {
  CircleAlert,
  CircleCheck,
  CircleX,
  PencilLine,
  type LucideIcon,
} from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import {
  literal,
  solve,
  toText,
  verify,
  type Exercise,
  type Outcome,
} from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import { ExpressionFormula } from './Formula.tsx'
import { Button, Eyebrow, Panel, Sheet } from './kit.tsx'

// Una domanda di controllo dentro una lezione: si può riprovare finché si
// vuole, e un errore tipico mostra la sua spiegazione.

type Tone = 'ok' | 'err' | 'warn'

function feedback(
  outcome: Outcome,
  exercise: Exercise,
): { tone: Tone; title: string; detail?: string } {
  switch (outcome.kind) {
    case 'correct':
      return { tone: 'ok', title: 'Esatto!' }
    case 'misconception':
      return {
        tone: 'err',
        title: 'Non è corretto.',
        detail: outcome.explanation,
      }
    case 'wrong':
      return {
        tone: 'err',
        title: 'Non è corretto.',
        detail: `Il risultato è ${toText(literal(solve(exercise.expression).result))}.`,
      }
    case 'rewrite':
      return {
        tone: 'warn',
        title: outcome.message,
        detail: 'Il valore è giusto: riscrivilo e controlla di nuovo.',
      }
    case 'invalid':
      return { tone: 'warn', title: outcome.message }
  }
}

const tones: Record<Tone, { card: string; input: string; icon: LucideIcon }> = {
  ok: {
    card: 'animate-pop bg-ok-soft text-ok',
    input: 'border-ok bg-ok-soft text-ok',
    icon: CircleCheck,
  },
  err: {
    card: 'animate-shake bg-err-soft text-err',
    input: 'border-err bg-err-soft text-err',
    icon: CircleX,
  },
  warn: {
    card: 'animate-rise bg-warn-soft text-warn',
    input: 'border-warn',
    icon: CircleAlert,
  },
}

export function CheckQuestion({
  exercise,
  onSolved,
}: {
  exercise: Exercise
  onSolved?: () => void
}) {
  const [answer, setAnswer] = useState('')
  // `count` cambia a ogni controllo, così l'esito si rianima anche quando è
  // lo stesso di prima.
  const [checked, setChecked] = useState<{
    answer: string
    outcome: Outcome
    count: number
  } | null>(null)
  const [solved, setSolved] = useState(false)
  const id = useId()

  function submit(event: FormEvent) {
    event.preventDefault()
    const outcome = verify(answer, exercise)
    setChecked((c) => ({ answer, outcome, count: (c?.count ?? 0) + 1 }))
    if (outcome.kind === 'correct') {
      setSolved(true)
      onSolved?.()
    }
  }

  const shown = checked && feedback(checked.outcome, exercise)
  // Il campo prende il colore dell'esito finché la risposta resta quella.
  const fresh = shown && checked.answer === answer ? tones[shown.tone] : null
  const Badge = solved ? CircleCheck : PencilLine

  return (
    <Panel className={cn('transition-colors', solved && 'border-ok/50')}>
      <form
        role="group"
        aria-label={`Domanda: ${toText(exercise.expression)}`}
        onSubmit={submit}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                'grid size-10 -rotate-3 place-items-center rounded-2xl transition-colors',
                solved
                  ? 'bg-ok-soft text-ok'
                  : 'bg-pencil-soft text-pencil-ink',
              )}
            >
              <Badge className="size-5" strokeWidth={2.2} />
            </span>
            <div>
              <Eyebrow>Prova tu</Eyebrow>
              <p className="font-display text-lg leading-tight font-bold">
                Quanto vale?
              </p>
            </div>
          </div>

          <Sheet className="overflow-x-auto rounded-2xl px-4 py-5 text-center shadow-none">
            <ExpressionFormula
              expression={exercise.expression}
              className="text-xl"
            />
          </Sheet>

          <div className="flex items-center gap-2">
            <label htmlFor={id} className="sr-only">
              Risposta
            </label>
            <span
              aria-hidden="true"
              className="font-display text-2xl font-bold text-dim"
            >
              =
            </span>
            <input
              id={id}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              inputMode="text"
              autoComplete="off"
              placeholder="?"
              className={cn(
                'w-full min-w-0 flex-1 rounded-2xl border-2 border-hair bg-paper px-3 py-2 text-center font-display text-2xl font-bold tabular-nums transition-colors outline-none',
                'placeholder:text-hair focus:border-pencil',
                fresh?.input,
              )}
            />
            <Button type="submit" variant="pencil" className="shrink-0">
              Controlla
            </Button>
          </div>
        </div>

        <div role="status">
          {shown && (
            <Feedback key={checked.count} tone={shown.tone}>
              <p className="font-semibold">{shown.title}</p>
              {shown.detail && (
                <p className="mt-1 text-sm leading-relaxed text-ink/80">
                  {shown.detail}
                </p>
              )}
            </Feedback>
          )}
        </div>
      </form>
    </Panel>
  )
}

function Feedback({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Icon = tones[tone].icon
  return (
    <div className={cn('mt-4 flex gap-3 rounded-2xl p-3.5', tones[tone].card)}>
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
