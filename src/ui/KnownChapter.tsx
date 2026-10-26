import { CheckCheck, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { cn } from '../lib/cn.ts'
import type { ChapterSummary } from './home/chapterProgress.ts'
import { Button } from './kit.tsx'

// "Lo so già": segna un capitolo come saputo, dopo una conferma in riga che
// dice in una frase cosa succede. Un capitolo segnato lo dice, con la data, e
// offre di annullare. Vedi SPEC.md, "Già saputo".

function markedText(since: number): string {
  const date = new Date(since).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  })
  return `Segnato come già saputo il ${date}.`
}

// Le abilità che il segno rende acquisite: quelle non ancora acquisite.
function confirmText(missing: number, total: number): string {
  if (missing === 1)
    return 'L’abilità che manca diventa acquisita senza esercizi e il ripasso la controlla fra qualche giorno.'
  const which = missing === total ? 'del capitolo' : 'che mancano'
  return `Le ${missing} abilità ${which} diventano acquisite senza esercizi e il ripasso le controlla fra qualche giorno.`
}

export function KnownChapter({
  summary,
  onMark,
  onUnmark,
  describedBy,
  className,
}: {
  summary: ChapterSummary
  onMark: () => void
  onUnmark: () => void
  /** L'id del titolo del capitolo, per dare un contesto ai bottoni. */
  describedBy?: string | undefined
  className?: string | undefined
}) {
  const [confirming, setConfirming] = useState(false)
  const ask = useRef<HTMLButtonElement>(null)
  const confirm = useRef<HTMLButtonElement>(null)
  const undo = useRef<HTMLButtonElement>(null)
  // Ogni passo toglie il bottone premuto: il fuoco va su quello del passo
  // dopo, appena compare. Il segno si salva in modo asincrono, quindi
  // "Annulla" può arrivare qualche render più tardi.
  const focusNext = useRef<RefObject<HTMLButtonElement | null> | null>(null)
  useEffect(() => {
    const target = focusNext.current?.current
    if (!target) return
    target.focus()
    focusNext.current = null
  })
  function step(next: RefObject<HTMLButtonElement | null>, then: () => void) {
    focusNext.current = next
    then()
  }

  const { knownSince, mastered, total, status } = summary

  if (knownSince !== null)
    return (
      <div
        className={cn(
          'flex w-full flex-wrap items-center gap-x-3 gap-y-2 text-sm',
          className,
        )}
      >
        <p className="inline-flex items-center gap-1.5 font-semibold text-ok">
          <CheckCheck aria-hidden="true" className="size-4" strokeWidth={2.6} />
          {markedText(knownSince)}
        </p>
        <Button
          ref={undo}
          variant="ghost"
          onClick={() => step(ask, onUnmark)}
          aria-describedby={describedBy}
          icon={<Undo2 aria-hidden="true" className="size-4" />}
          className="px-3 py-1.5 text-sm"
        >
          Annulla
        </Button>
      </div>
    )

  if (status === 'mastered') return null

  if (!confirming)
    return (
      <Button
        ref={ask}
        variant="ghost"
        onClick={() => step(confirm, () => setConfirming(true))}
        aria-describedby={describedBy}
        icon={<CheckCheck aria-hidden="true" className="size-4" />}
        className={cn('border-dashed px-3 py-2 text-sm', className)}
      >
        Lo so già
      </Button>
    )

  return (
    <div
      role="group"
      aria-label="Conferma"
      className={cn(
        'w-full animate-rise space-y-3 rounded-2xl border border-dashed border-pencil bg-paper p-3 text-sm',
        className,
      )}
    >
      <p>{confirmText(total - mastered, total)}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          ref={confirm}
          variant="pencil"
          onClick={() =>
            step(undo, () => {
              setConfirming(false)
              onMark()
            })
          }
          className="px-3 py-1.5 text-sm"
        >
          Sì, lo so già
        </Button>
        <Button
          variant="ghost"
          onClick={() => step(ask, () => setConfirming(false))}
          className="px-3 py-1.5 text-sm"
        >
          Non ora
        </Button>
      </div>
    </div>
  )
}
