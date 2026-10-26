import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import type { Outcome } from '../../engine/index.ts'
import { cn } from '../../lib/cn.ts'

// L'esito di una risposta nel pannello "Prova tu": una scheda colorata e,
// in testa al pannello, una spia con lo stato dell'esercizio.

type Tone = 'ok' | 'err' | 'warn'

function toneOf(outcome: Outcome): Tone {
  if (outcome.kind === 'correct') return 'ok'
  if (outcome.kind === 'invalid') return 'warn'
  return 'err'
}

const cards: Record<Tone, string> = {
  ok: 'border-ok/25 bg-ok-soft text-ok',
  err: 'border-err/25 bg-err-soft text-err',
  warn: 'border-warn/25 bg-warn-soft text-warn',
}

const icons = { ok: CircleCheck, err: CircleX, warn: TriangleAlert }

export function OutcomeCard({
  outcome,
  result,
  hints,
}: {
  outcome: Outcome
  /** Il risultato giusto, in testo. */
  result: string
  hints: number
}) {
  const tone = toneOf(outcome)
  const Icon = icons[tone]
  return (
    <div
      role="status"
      className={cn(
        'flex animate-pop gap-3 rounded-2xl border px-4 py-3',
        cards[tone],
      )}
    >
      <Icon aria-hidden="true" strokeWidth={2.4} className="size-6 shrink-0" />
      <div className="space-y-0.5">
        <p className="font-display text-lg leading-snug font-bold text-pretty">
          {outcome.kind === 'correct'
            ? 'Corretto!'
            : outcome.kind === 'invalid'
              ? outcome.message
              : `Non è corretto: il risultato è ${result}.`}
        </p>
        <Detail outcome={outcome} hints={hints} />
      </div>
    </div>
  )
}

function Detail({ outcome, hints }: { outcome: Outcome; hints: number }) {
  let text: string | null = null
  if (outcome.kind === 'correct' && hints > 0)
    text = `Con ${hints} ${hints === 1 ? 'suggerimento' : 'suggerimenti'}.`
  if (outcome.kind === 'misconception')
    text = 'È un errore tipico: leggi la nota sul quaderno.'
  if (outcome.kind === 'wrong')
    text = 'Rileggi la soluzione sul quaderno, riga per riga.'
  return text && <p className="text-sm text-ink/80">{text}</p>
}

const states: Record<Tone | 'idle', { label: string; dot: string }> = {
  idle: { label: 'Da svolgere', dot: 'bg-pencil' },
  ok: { label: 'Fatto', dot: 'bg-ok' },
  err: { label: 'Da rivedere', dot: 'bg-err' },
  warn: { label: 'Riprova', dot: 'bg-warn' },
}

// La spia ripete l'esito in breve: per chi legge con lo screen reader
// basta la scheda, e la spia resta nascosta.
export function RunState({ outcome }: { outcome: Outcome | null }) {
  const { label, dot } = states[outcome ? toneOf(outcome) : 'idle']
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center gap-2 rounded-full border border-hair bg-paper px-3 py-1 text-xs font-semibold text-dim"
    >
      <span className={cn('size-2 rounded-full', dot)} />
      {label}
    </span>
  )
}
