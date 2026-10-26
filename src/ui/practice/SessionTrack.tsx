import { Check, Lightbulb, X } from 'lucide-react'
import { cn } from '../../lib/cn.ts'

// L'avanzamento di una sessione: una barra a segmenti, uno per esercizio, e
// alla fine una fila di quadretti con com'è andato ciascuno.

export function SessionTrack({
  total,
  index,
  closed,
}: {
  total: number
  /** L'esercizio mostrato adesso. */
  index: number
  /** Se l'esercizio mostrato si è già chiuso. */
  closed: boolean
}) {
  const done = Math.min(total, index + (closed ? 1 : 0))
  return (
    <div
      role="progressbar"
      aria-label="Esercizi della sessione"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className="flex gap-1.5"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-2 flex-1 rounded-full bg-hair transition-colors duration-500',
            i < done && 'bg-pencil',
            i === index && !closed && 'bg-ink',
          )}
        />
      ))}
    </div>
  )
}

/** Com'è andato un esercizio: giusto da solo, giusto con aiuto, sbagliato. */
export type Mark = 'clean' | 'helped' | 'missed'

const marks = {
  clean: { icon: Check, className: 'border-ok/25 bg-ok-soft text-ok' },
  helped: {
    icon: Lightbulb,
    className: 'border-pencil/40 bg-pencil-soft text-pencil-ink',
  },
  missed: { icon: X, className: 'border-err/25 bg-err-soft text-err' },
}

// La fila è solo decorazione: il riassunto a parole dice le stesse cose.
export function SessionRecap({ results }: { results: readonly Mark[] }) {
  return (
    <ol aria-hidden="true" className="flex flex-wrap gap-1.5">
      {results.map((mark, i) => {
        const { icon: Icon, className } = marks[mark]
        return (
          <li
            key={i}
            className={cn(
              'grid size-8 animate-pop place-items-center rounded-lg border',
              className,
            )}
          >
            <Icon strokeWidth={3} className="size-4" />
          </li>
        )
      })}
    </ol>
  )
}
