import { Check, Lock } from 'lucide-react'
import { chapters, type ChapterId } from '../content/chapters.ts'
import { cn } from '../lib/cn.ts'
import type { ChapterStatus } from './home/chapterProgress.ts'

// La fila dei capitoli in testa alla lezione e alla mappa: un bottone per
// capitolo, con il numero sul tassello e il segno dello stato accanto.

export function ChapterPicker({
  label,
  value,
  onChange,
  status,
}: {
  /** Il nome della fila per lo screen reader. */
  label: string
  value: ChapterId
  onChange: (chapter: ChapterId) => void
  /** Lo stato di ogni capitolo, quando i progressi sono già letti. */
  status?: Partial<Record<ChapterId, ChapterStatus>> | undefined
}) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {chapters.map((chapter) => {
          const selected = chapter.id === value
          const state = status?.[chapter.id]
          return (
            <li key={chapter.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(chapter.id)}
                className={cn(
                  'group flex items-center gap-2 rounded-2xl border py-1.5 pr-3 pl-1.5 text-sm font-semibold transition',
                  'focus-visible:ring-2 focus-visible:ring-pencil focus-visible:ring-offset-2 focus-visible:ring-offset-panel focus-visible:outline-none',
                  selected
                    ? 'border-pencil bg-pencil-soft text-pencil-ink'
                    : 'border-hair bg-panel hover:bg-paper',
                  !selected && state === 'locked' && 'text-dim',
                )}
              >
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-lg font-display font-bold',
                    selected
                      ? '-rotate-6 bg-pencil text-on-pencil shadow-key'
                      : 'bg-paper text-dim',
                  )}
                >
                  <span className="sr-only">Capitolo </span>
                  {chapter.number}
                </span>
                {chapter.title}
                {state === 'mastered' && (
                  <Check
                    aria-hidden="true"
                    className="size-4 text-ok"
                    strokeWidth={3}
                  />
                )}
                {state === 'locked' && (
                  <Lock aria-hidden="true" className="size-3.5 text-dim" />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
