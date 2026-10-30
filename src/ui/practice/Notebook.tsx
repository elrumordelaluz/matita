import { Check } from 'lucide-react'
import { toText, type Expression, type Line } from '../../engine/index.ts'
import { cn } from '../../lib/cn.ts'
import { ExpressionFormula } from '../Formula.tsx'
import { Note } from '../kit.tsx'

// Quello che si scrive sul quaderno sotto l'espressione: la nota sull'errore
// tipico, le righe della soluzione con i conti a margine, la riga che manca.

// I ritardi della scrittura, una riga dopo l'altra. Classi fisse, perché
// Tailwind le trovi nel sorgente.
const delays = [
  '',
  '[animation-delay:450ms]',
  '[animation-delay:900ms]',
  '[animation-delay:1350ms]',
  '[animation-delay:1800ms]',
  '[animation-delay:2250ms]',
  '[animation-delay:2700ms]',
  '[animation-delay:3150ms]',
]

function delay(slot: number): string {
  return delays[Math.min(slot, delays.length - 1)] ?? ''
}

export function MisconceptionNote({ explanation }: { explanation: string }) {
  return (
    <div className="mb-6 max-w-xl animate-rise rounded-2xl border border-err/20 bg-err-soft px-4 py-3 shadow-panel">
      <Note className="text-2xl text-err">Errore tipico</Note>
      <p className="mt-1 leading-relaxed">{explanation}</p>
    </div>
  )
}

export function SolutionLines({
  lines,
  total,
  written,
  pause,
  checked,
  titleId,
}: {
  /** Le righe da mostrare. */
  lines: readonly Line[]
  /** Quante righe ha la soluzione intera. */
  total: number
  /** Le righe già scritte dai suggerimenti: non si riscrivono. */
  written: number
  /** Righe di attesa prima di scrivere le altre. */
  pause: number
  /** Il segno di spunta accanto al risultato. */
  checked: boolean
  titleId: string
}) {
  if (lines.length === 0) return null
  // Il ritardo di una riga dipende solo da dati che non cambiano più dopo
  // che è comparsa, così l'animazione non riparte.
  const slot = (i: number) => (i < written ? 0 : i - written + pause)
  return (
    <section aria-labelledby={titleId}>
      <h3
        id={titleId}
        className="text-xs font-semibold tracking-[0.14em] text-dim uppercase"
      >
        Soluzione
      </h3>
      <ol className="mt-3 space-y-4">
        {lines.map((line, i) => {
          const result = i === total - 1
          return (
            <li
              key={i}
              className={cn(
                'grid animate-write grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-3',
                delay(slot(i)),
              )}
            >
              <Note aria-hidden="true" className="text-5xl text-pencil-ink">
                =
              </Note>
              <span className="flex min-w-0 items-center gap-3">
                <span className="max-w-full overflow-x-auto py-1">
                  <ExpressionFormula
                    expression={line.expression}
                    className={cn(
                      'text-2xl sm:text-3xl',
                      result && 'rounded-lg bg-pencil-soft px-2',
                    )}
                  />
                </span>
                {result && checked && (
                  <Check
                    aria-hidden="true"
                    strokeWidth={3}
                    className={cn(
                      'size-7 shrink-0 animate-pop text-ok',
                      delay(slot(i) + 2),
                    )}
                  />
                )}
              </span>
              <ul className="col-start-2 flex flex-wrap gap-x-5">
                {line.steps.map((step, j) => (
                  <li key={j}>
                    <Note className="text-2xl">
                      {`${toText(step.operation)} = ${toText(step.outcome)}`}
                    </Note>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// Le righe dello studente in "Passo passo", accettate una alla volta.
export function StudentLines({
  lines,
  titleId,
}: {
  lines: readonly Expression[]
  titleId: string
}) {
  if (lines.length === 0) return null
  return (
    <section aria-labelledby={titleId}>
      <h3
        id={titleId}
        className="text-xs font-semibold tracking-[0.14em] text-dim uppercase"
      >
        Le tue righe
      </h3>
      <ol className="mt-3 space-y-4">
        {lines.map((line, i) => (
          <li
            key={i}
            className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-3"
          >
            <Note aria-hidden="true" className="text-5xl text-pencil-ink">
              =
            </Note>
            <span className="max-w-full overflow-x-auto py-1">
              <ExpressionFormula
                expression={line}
                className="text-2xl sm:text-3xl"
              />
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

// La riga ancora da scrivere: un "= ?" a matita leggera.
export function NextLine() {
  return (
    <p
      aria-hidden="true"
      className="mt-4 grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-3"
    >
      <Note className="text-5xl text-dim/40">=</Note>
      <Note className="text-4xl text-dim/40">?</Note>
    </p>
  )
}
