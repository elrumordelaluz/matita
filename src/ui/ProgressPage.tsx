import {
  Check,
  Download,
  HardDrive,
  Lock,
  PencilLine,
  Upload,
} from 'lucide-react'
import { useId, useMemo, useState, type ChangeEvent } from 'react'
import { chapterById, chapters, type ChapterId } from '../content/chapters.ts'
import type { Flashcard } from '../content/flashcards.ts'
import type { Skill } from '../content/skills.ts'
import type { GeneratedSkill } from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import type { AttemptOutcome } from '../progress/attempt.ts'
import { exportBackup, importBackup, importNotice } from '../progress/backup.ts'
import {
  flashcardCards,
  flashcardState,
  type FlashcardState,
} from '../progress/flashcards.ts'
import { latestAttempts, type AttemptEntry } from '../progress/history.ts'
import { reviewCards } from '../progress/review.ts'
import { skillStates, type SkillState } from '../progress/skillState.ts'
import type { ProgressStore } from '../progress/store.ts'
import { ChapterPicker } from './ChapterPicker.tsx'
import { canPractise } from './exercises.ts'
import { ExercisePrompt } from './exerciseView.tsx'
import { CardText } from './FlashcardView.tsx'
import {
  missingPrerequisitesText,
  chapterStatus,
  summarize,
  workingChapter,
} from './home/chapterProgress.ts'
import {
  attemptStats,
  currentStreaks,
  masteryStreak,
  stateLabel,
  stateTag,
} from './home/skillProgress.ts'
import { Button, Eyebrow, Note, Panel, Ring, Sheet } from './kit.tsx'
import { useProgress } from './useProgress.ts'

// "I miei progressi": la mappa delle abilità di un capitolo alla volta, con
// la fila dei capitoli sopra, qualche conto sui tentativi e il backup.

// L'esito di un tentativo, con i nomi del glossario.
const outcomeLabel: Record<AttemptOutcome, string> = {
  correct: 'corretto',
  misconception: 'errore tipico',
  wrong: 'sbagliato',
  invalid: 'non valido',
}

const stateCard: Record<SkillState, string> = {
  locked: 'border-dashed border-dim/30 bg-panel/70 shadow-none',
  learning: 'border-pencil ring-4 ring-pencil-soft',
  mastered: 'border-ok/30',
}

// Il tratto che entra in un nodo: pieno se il nodo è aperto, tratteggiato se
// è ancora bloccato.
const strokeOpen = 'before:border-lead/50 after:border-lead/50'
const strokeLocked =
  'before:border-dashed before:border-dim/40 after:border-dashed after:border-dim/40'

const columns: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
}

// Dove cade la U che raccoglie una riga di nodi: dal centro della prima
// colonna al centro dell'ultima.
const mergeInset: Record<number, string> = {
  2: 'before:inset-x-1/4',
  3: 'before:inset-x-1/6',
}

const riseDelay = [
  '',
  '[animation-delay:80ms]',
  '[animation-delay:160ms]',
  '[animation-delay:240ms]',
  '[animation-delay:320ms]',
]

const day = 86_400_000

type Notice =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly text: string }

// Il livello di ogni abilità nel grafo del capitolo: zero senza prerequisiti
// nel capitolo, poi uno in più del prerequisito più profondo. I prerequisiti
// di altri capitoli non contano qui: la mappa li nomina sotto la scheda
// ("Prima: …") e non disegna tratti fra capitoli. Le abilità dello stesso
// livello stanno sulla stessa riga della mappa.
function levels(skills: readonly Skill[]): Skill[][] {
  const depth = new Map<string, number>()
  const of = (skill: Skill): number => {
    const known = depth.get(skill.id)
    if (known !== undefined) return known
    const prereqs = skills.filter((s) => skill.prerequisites.includes(s.id))
    const d = prereqs.length ? 1 + Math.max(...prereqs.map(of)) : 0
    depth.set(skill.id, d)
    return d
  }
  const rows: Skill[][] = []
  for (const skill of skills) (rows[of(skill)] ??= []).push(skill)
  return rows.filter(Boolean)
}

function datePhrase(at: number): string {
  return new Date(at).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  })
}

const flashcardLabel: Record<FlashcardState, string> = {
  unseen: 'non ancora vista',
  new: 'nuova',
  learning: 'in apprendimento',
  review: 'in ripasso',
}

function reviewText(due: Date, now: Date): string {
  const days = Math.ceil((due.getTime() - now.getTime()) / day)
  if (days <= 0) return 'da ripassare'
  if (days === 1) return 'ripasso domani'
  return `ripasso fra ${days} giorni`
}

export function ProgressPage({
  store,
  skills,
  flashcards,
  chapter: initialChapter,
  onPractise,
}: {
  store: ProgressStore
  skills: readonly Skill[]
  flashcards: readonly Flashcard[]
  /** Il capitolo da mostrare; senza, quello su cui si lavora. */
  chapter?: ChapterId | undefined
  onPractise?: (skill: GeneratedSkill) => void
}) {
  const { progress: stored, reload } = useProgress(store)
  const [chosen, setChosen] = useState<ChapterId | null>(initialChapter ?? null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const id = useId()

  async function download() {
    const text = await exportBackup(store)
    const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `matita-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const result = await importBackup(store, await file.text())
    if (!result.ok) {
      setNotice({ ok: false, text: importNotice(result) })
      return
    }
    await reload()
    setNotice({ ok: true, text: importNotice(result) })
  }

  const progress = useMemo(
    () =>
      stored && {
        states: skillStates(skills, stored.attempts, stored.known),
        streaks: currentStreaks(stored.attempts),
        cards: reviewCards(stored.attempts, stored.known),
        flashcardCards: flashcardCards(
          flashcards,
          stored.introduced,
          stored.flashcardReviews,
        ),
        stats: attemptStats(stored.attempts),
        history: new Map<string, AttemptEntry[]>(
          skills.map((s) => [s.id, latestAttempts(stored.attempts, s.id)]),
        ),
      },
    [stored, skills, flashcards],
  )
  const chapter = chosen
    ? chapterById(chosen)
    : progress
      ? workingChapter(progress.states)
      : undefined
  const chapterCards = flashcards.filter((f) => f.chapter === chapter?.id)
  const rows = useMemo(() => levels(chapter?.skills ?? []), [chapter])
  const width = Math.min(3, Math.max(1, ...rows.map((r) => r.length)))
  const mastered = progress
    ? skills.filter((s) => progress.states[s.id] === 'mastered').length
    : 0
  const summary =
    chapter && progress && stored
      ? summarize(chapter, progress.states, stored.known)
      : undefined
  const now = new Date()

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id={`${id}-title`}
            className="font-display text-3xl font-bold tracking-tight"
          >
            I miei progressi
          </h2>
          {progress && (
            <p className="mt-1 text-dim">
              {mastered === skills.length
                ? 'Percorso completo: ora lo tiene vivo il ripasso.'
                : `${mastered} abilità su ${skills.length} acquisite.`}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
        {progress && chapter && summary && (
          <div className="space-y-4 lg:col-span-8">
            <ChapterPicker
              label="Capitoli"
              value={chapter.id}
              onChange={setChosen}
              status={Object.fromEntries(
                chapters.map((c) => [c.id, chapterStatus(c, progress.states)]),
              )}
            />
            <Sheet key={chapter.id} className="animate-rise p-4 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Eyebrow>Capitolo {chapter.number}</Eyebrow>
                  <p className="mt-1 font-display text-2xl leading-tight font-bold">
                    {chapter.title}
                  </p>
                </div>
                <Ring
                  value={summary.total ? summary.mastered / summary.total : 0}
                  className="size-14"
                >
                  {summary.mastered}/{summary.total}
                </Ring>
              </div>
              <Note className="mt-2 inline-block -rotate-1">
                {summary.knownSince === null
                  ? `${masteryStreak} corretti di fila senza aiuti, ed è acquisita`
                  : `segnato come già saputo il ${datePhrase(summary.knownSince)}`}
              </Note>

              <ul
                className={cn(
                  'mx-auto mt-8 grid max-w-2xl gap-y-12',
                  columns[width],
                )}
              >
                {rows.flatMap((row, level) =>
                  row.map((skill) => {
                    const state = progress.states[skill.id] ?? 'locked'
                    const streak = Math.min(
                      masteryStreak,
                      progress.streaks.get(skill.id) ?? 0,
                    )
                    const history = progress.history.get(skill.id) ?? []
                    const card = progress.cards.get(skill.id)
                    const alone = row.length === 1
                    const merge =
                      level > 0 && alone && (rows[level - 1]?.length ?? 0) > 1
                    const titleId = `${id}-${skill.id}`
                    return (
                      <li
                        key={skill.id}
                        aria-labelledby={titleId}
                        className={cn(
                          'relative animate-rise px-1.5 sm:px-4',
                          riseDelay[Math.min(level, riseDelay.length - 1)],
                          alone && 'col-span-full',
                          level > 0 &&
                            'before:absolute before:-ml-px after:absolute after:-ml-px',
                          level > 0 &&
                            !merge &&
                            'before:-top-12 before:left-1/2 before:h-12 before:border-l-2',
                          merge &&
                            'before:-top-12 before:h-6 before:rounded-b-2xl before:border-2 before:border-t-0 after:-top-6 after:left-1/2 after:h-6 after:border-l-2',
                          merge && mergeInset[rows[level - 1]?.length ?? 2],
                          level > 0 &&
                            (state === 'locked' ? strokeLocked : strokeOpen),
                        )}
                      >
                        <div
                          className={cn(
                            'mx-auto flex h-full max-w-xs flex-col items-center gap-2 rounded-2xl border bg-panel p-3 text-center shadow-panel sm:p-4',
                            stateCard[state],
                          )}
                        >
                          {state === 'mastered' && (
                            <span className="grid size-12 animate-pop place-items-center rounded-full bg-ok text-panel">
                              <Check
                                aria-hidden="true"
                                className="size-6"
                                strokeWidth={3}
                              />
                            </span>
                          )}
                          {state === 'learning' && (
                            <Ring
                              value={streak / masteryStreak}
                              className="size-12"
                            >
                              <PencilLine
                                aria-hidden="true"
                                className="size-4 text-pencil-ink"
                                strokeWidth={2.4}
                              />
                            </Ring>
                          )}
                          {state === 'locked' && (
                            <span className="grid size-12 place-items-center rounded-full border border-dashed border-dim/40 bg-paper text-dim">
                              <Lock aria-hidden="true" className="size-5" />
                            </span>
                          )}
                          <span
                            id={titleId}
                            className={cn(
                              'font-display leading-tight font-bold sm:text-lg',
                              state === 'locked' && 'text-ink/60',
                            )}
                          >
                            {skill.title}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              stateTag[state],
                            )}
                          >
                            {stateLabel[state]}
                          </span>
                          <span
                            className={cn(
                              'text-xs text-dim',
                              card &&
                                card.due.getTime() <= now.getTime() &&
                                'font-semibold text-lead',
                            )}
                          >
                            {state === 'mastered' &&
                              card &&
                              reviewText(card.due, now)}
                            {state === 'learning' &&
                              `${streak}/${masteryStreak} corretti di fila`}
                            {state === 'locked' &&
                              missingPrerequisitesText(skill, progress.states)}
                          </span>
                          {history.length > 0 && (
                            <div className="w-full space-y-1.5 border-t border-hair/60 pt-2">
                              <Eyebrow>Ultimi tentativi</Eyebrow>
                              <ul className="space-y-1">
                                {history.map(
                                  ({ attempt, exercise, explanation }) => (
                                    <li
                                      key={attempt.id}
                                      className="text-xs leading-relaxed text-dim"
                                    >
                                      {exercise !== null && (
                                        <>
                                          <ExercisePrompt
                                            exercise={exercise}
                                            className="text-sm"
                                          />
                                          {' · '}
                                        </>
                                      )}
                                      <span className="font-semibold text-ink">
                                        {attempt.answer}
                                      </span>
                                      {' · '}
                                      <span
                                        className={cn(
                                          'font-semibold',
                                          attempt.outcome === 'correct'
                                            ? 'text-ok'
                                            : 'text-err',
                                        )}
                                      >
                                        {outcomeLabel[attempt.outcome]}
                                      </span>
                                      {' · '}
                                      <span>
                                        {datePhrase(attempt.answeredAt)}
                                      </span>
                                      {explanation !== null && (
                                        <span className="block">
                                          {explanation}
                                        </span>
                                      )}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                          {state !== 'mastered' &&
                            onPractise &&
                            canPractise(skill.id) && (
                              <Button
                                variant={
                                  state === 'learning' ? 'pencil' : 'ghost'
                                }
                                onClick={() =>
                                  onPractise(skill.id as GeneratedSkill)
                                }
                                aria-describedby={titleId}
                                className="mt-auto px-3 py-1.5 text-sm"
                              >
                                {state === 'learning'
                                  ? 'Allena'
                                  : 'Allena lo stesso'}
                              </Button>
                            )}
                        </div>
                      </li>
                    )
                  }),
                )}
              </ul>

              {chapterCards.length > 0 && stored && (
                <div className="mx-auto mt-10 max-w-2xl">
                  <Eyebrow id={`${id}-cards`}>Flashcard</Eyebrow>
                  <ul
                    aria-labelledby={`${id}-cards`}
                    className="mt-3 space-y-2"
                  >
                    {chapterCards.map((f) => {
                      const state = flashcardState(
                        f.id,
                        stored.introduced,
                        stored.flashcardReviews,
                      )
                      const due = progress.flashcardCards.get(f.id)?.due
                      return (
                        <li
                          key={f.id}
                          aria-label={f.front}
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-panel/80 px-3 py-2"
                        >
                          <span className="min-w-0 flex-1">
                            <CardText text={f.front} />
                          </span>
                          <span className="text-sm font-semibold">
                            {flashcardLabel[state]}
                          </span>
                          {due &&
                            (state === 'learning' || state === 'review') && (
                              <span className="text-sm text-dim">
                                {reviewText(due, now)}
                              </span>
                            )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </Sheet>
          </div>
        )}

        <div className="space-y-5 lg:col-span-4">
          {progress && (
            <dl className="grid animate-rise grid-cols-3 gap-3 [animation-delay:90ms] lg:grid-cols-1">
              <Stat label="esercizi svolti" value={progress.stats.total} />
              <Stat
                label="corretti al primo colpo"
                value={progress.stats.clean}
                note={
                  progress.stats.total > 0
                    ? `${Math.round((100 * progress.stats.clean) / progress.stats.total)}%`
                    : undefined
                }
              />
              <Stat label="giorni di pratica" value={progress.stats.days} />
            </dl>
          )}

          <Panel
            aria-labelledby={`${id}-backup`}
            className="animate-rise space-y-3 [animation-delay:160ms]"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-paper text-lead">
                <HardDrive aria-hidden="true" className="size-5" />
              </span>
              <h3
                id={`${id}-backup`}
                className="font-display text-lg font-bold"
              >
                Backup
              </h3>
            </div>
            <p className="text-sm text-dim">
              I progressi vivono solo in questo browser. Scarica un backup ogni
              tanto: se il browser viene ripulito, lo reimporti e non perdi
              nulla.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => void download()}
                icon={<Download aria-hidden="true" className="size-4" />}
                className="text-sm"
              >
                Scarica un backup
              </Button>
              <label
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-hair bg-panel px-4 py-2.5 text-sm font-semibold transition hover:bg-paper',
                  'focus-within:ring-2 focus-within:ring-pencil focus-within:ring-offset-2 focus-within:ring-offset-panel',
                )}
              >
                <Upload aria-hidden="true" className="size-4" />
                Importa un backup
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => void upload(e)}
                  className="sr-only"
                />
              </label>
            </div>
            {notice && (
              <p
                role={notice.ok ? 'status' : 'alert'}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm font-medium',
                  notice.ok ? 'bg-ok-soft text-ok' : 'bg-err-soft text-err',
                )}
              >
                {notice.text}
              </p>
            )}
          </Panel>
        </div>
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  note,
}: {
  label: string
  value: number
  note?: string | undefined
}) {
  return (
    <div className="rounded-3xl border border-hair/70 bg-panel p-4 shadow-panel">
      <dt className="text-xs leading-tight text-dim sm:text-sm">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums">
          {value}
        </span>
        {note && <Note>{note}</Note>}
      </dd>
    </div>
  )
}
