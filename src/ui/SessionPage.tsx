import {
  BookOpen,
  Check,
  House,
  PencilLine,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { chapterOf, type ChapterId } from '../content/chapters.ts'
import { lessons } from '../content/lessons/index.ts'
import type { Skill } from '../content/skills.ts'
import type { Exercise } from '../engine/index.ts'
import type { SessionItem } from '../progress/session.ts'
import { exerciseFor, randomSeed } from './exercises.ts'
import { Button, Eyebrow, Panel } from './kit.tsx'
import { PracticePage, type PracticeAttempt } from './PracticePage.tsx'
import {
  SessionRecap,
  SessionTrack,
  type Mark,
} from './practice/SessionTrack.tsx'
import { firstNewBySkill } from './practice/newSkills.ts'

// Una sessione: gli esercizi in fila, uno per voce del piano. Finita la fila,
// "Esercizio successivo" continua con l'ultima abilità, fuori sessione.

const reasons: Record<
  SessionItem['reason'],
  { label: string; icon: LucideIcon }
> = {
  review: { label: 'Ripasso', icon: RotateCcw },
  learning: { label: 'In apprendimento', icon: PencilLine },
  new: { label: 'Abilità nuova', icon: Sparkles },
}

interface Progress {
  /** La voce del piano mostrata adesso. */
  readonly index: number
  /** Se l'esercizio mostrato si è già chiuso. */
  readonly closed: boolean
}

function markOf({ outcome, hints, rewrites }: PracticeAttempt): Mark {
  if (outcome.kind !== 'correct') return 'missed'
  return hints > 0 || rewrites > 0 ? 'helped' : 'clean'
}

export function SessionPage({
  items,
  skills,
  onAttempt,
  onDone,
  onOpenLesson,
}: {
  items: readonly SessionItem[]
  skills: readonly Skill[]
  onAttempt: (attempt: PracticeAttempt) => void
  onDone: () => void
  /** Apre la lezione del capitolo senza chiudere la sessione. */
  onOpenLesson: (chapter: ChapterId) => void
}) {
  const [progress, setProgress] = useState<Progress>({
    index: 0,
    closed: false,
  })
  // Com'è andato ogni esercizio della sessione, nell'ordine.
  const [results, setResults] = useState<Mark[]>([])
  // La voce a cui l'abilità nuova è già stata introdotta dalla lezione.
  const [started, setStarted] = useState<number | null>(null)
  // createExercise legge la posizione da un ref: PracticePage lo chiama sia
  // nel primo render sia dal pulsante, e solo il pulsante deve farla avanzare.
  const current = useRef(progress)
  function update(next: Progress) {
    current.current = next
    setProgress(next)
  }

  const last = items.length - 1
  const item = items[Math.min(progress.index, last)]
  const title = skills.find((s) => s.id === item?.skill)?.title

  function createExercise(): Exercise {
    let { index } = current.current
    if (current.current.closed) {
      index++
      update({ index, closed: false })
    }
    const next = items[Math.min(index, last)]
    const exercise = next && exerciseFor(next.skill, randomSeed())
    if (!exercise) throw new Error(`No generator for ${next?.skill}`)
    return exercise
  }

  function record(attempt: PracticeAttempt) {
    onAttempt(attempt)
    if (current.current.index <= last)
      setResults((r) => [...r, markOf(attempt)])
    update({ ...current.current, closed: true })
  }

  const inSession = progress.index <= last
  const finished =
    progress.index > last || (progress.index === last && progress.closed)

  // Finita la sessione, il prossimo passo è tornare all'inizio. L'effetto
  // gira dopo quello di PracticePage, quindi vince sul suo.
  const home = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (finished) home.current?.focus()
  }, [finished])

  const reason = item && reasons[item.reason]

  // All'inizio di un'abilità nuova, prima la lezione del suo capitolo:
  // solo se il capitolo ne ha una.
  const firstNew = firstNewBySkill(items)
  const chapter = item && chapterOf(item.skill)
  const showLessonPanel =
    item !== undefined &&
    chapter !== undefined &&
    lessons[chapter.id] !== undefined &&
    firstNew.get(item.skill) === progress.index &&
    started !== progress.index

  return (
    <section className="space-y-5">
      {finished ? (
        <Completed
          results={results}
          total={items.length}
          home={home}
          onDone={onDone}
        />
      ) : (
        inSession &&
        reason && (
          <Panel className="space-y-3 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-lg font-bold">{`Esercizio ${progress.index + 1} di ${items.length}`}</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pencil-soft px-3 py-1 text-xs font-semibold text-pencil-ink">
                <reason.icon aria-hidden="true" className="size-3.5" />
                {reason.label}
              </span>
            </div>
            <SessionTrack
              total={items.length}
              index={progress.index}
              closed={progress.closed}
            />
          </Panel>
        )
      )}
      {showLessonPanel && title !== undefined && chapter ? (
        <Panel className="space-y-3 px-5 py-4">
          <Eyebrow>Capitolo {chapter.number}</Eyebrow>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <p className="max-w-prose text-dim">
            {title} è un’abilità nuova: la sua lezione la spiega in pochi
            passaggi.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              icon={<BookOpen aria-hidden="true" className="size-4" />}
              onClick={() => onOpenLesson(chapter.id)}
            >
              Leggi la lezione
            </Button>
            <Button variant="ghost" onClick={() => setStarted(progress.index)}>
              Inizia l’esercizio
            </Button>
          </div>
        </Panel>
      ) : (
        <PracticePage
          createExercise={createExercise}
          onAttempt={record}
          {...(title === undefined ? {} : { title })}
        />
      )}
    </section>
  )
}

function Completed({
  results,
  total,
  home,
  onDone,
}: {
  results: readonly Mark[]
  total: number
  home: RefObject<HTMLButtonElement | null>
  onDone: () => void
}) {
  const correct = results.filter((m) => m !== 'missed').length
  const clean = results.filter((m) => m === 'clean').length
  return (
    <Panel className="flex animate-rise flex-col gap-5 sm:flex-row sm:items-center">
      <span className="grid size-16 shrink-0 animate-pop place-items-center rounded-full bg-ok-soft text-ok">
        <Check aria-hidden="true" strokeWidth={3} className="size-8" />
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <h2 className="font-display text-2xl font-bold">
            Sessione completata.
          </h2>
          <p className="text-dim">{summary(correct, clean, total)}</p>
        </div>
        <SessionRecap results={results} />
        <p className="text-sm text-dim">
          Le abilità torneranno nel ripasso quando stanno per sfumare.
        </p>
      </div>
      <Button
        ref={home}
        onClick={onDone}
        icon={<House aria-hidden="true" className="size-4" />}
        className="shrink-0"
      >
        Torna all’inizio
      </Button>
    </Panel>
  )
}

function summary(correct: number, clean: number, total: number): string {
  if (clean === total) return 'Tutti corretti, senza suggerimenti.'
  const right = `${correct} ${correct === 1 ? 'corretto' : 'corretti'} su ${total}`
  return clean > 0 ? `${right}, ${clean} senza suggerimenti.` : `${right}.`
}
