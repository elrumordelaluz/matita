import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Lock,
  Map as MapIcon,
} from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { chapters, type Chapter, type ChapterId } from '../content/chapters.ts'
import { lessons } from '../content/lessons/index.ts'
import type { Skill } from '../content/skills.ts'
import type { GeneratedSkill } from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import type { Known } from '../progress/known.ts'
import { dueReviews } from '../progress/review.ts'
import { composeSession, type SessionItem } from '../progress/session.ts'
import { skillStates, type SkillState } from '../progress/skillState.ts'
import type { ProgressStore } from '../progress/store.ts'
import { canPractise } from './exercises.ts'
import {
  missingPrerequisitesText,
  markChapterKnown,
  summarize,
  unmarkChapterKnown,
  waitingChaptersText,
  workingChapter,
  type ChapterStatus,
} from './home/chapterProgress.ts'
import {
  groupSession,
  reasonLabel,
  stateLabel,
  stateTag,
  type Reason,
} from './home/skillProgress.ts'
import { KnownChapter } from './KnownChapter.tsx'
import { Button, Eyebrow, Note, Panel, Ring, Sheet } from './kit.tsx'
import { useProgress } from './useProgress.ts'

// La pagina iniziale: quanti ripassi aspettano, cosa c'è nella sessione di
// oggi e a che punto è il percorso, capitolo per capitolo. Ogni scheda porta
// a tutto il materiale del suo capitolo, bloccata o no: vedi SPEC.md,
// "Pagina iniziale" e "Il blocco è un consiglio".

interface Plan {
  readonly due: number
  readonly session: SessionItem[]
  readonly states: Record<string, SkillState>
  readonly known: readonly Known[]
}

function pendingText(due: number): string {
  if (due === 0) return 'Nessun ripasso in attesa.'
  if (due === 1) return '1 ripasso in attesa.'
  return `${due} ripassi in attesa.`
}

// Le celle della striscia e le etichette dei motivi: grafite per il ripasso,
// giallo pieno per l'abilità in corso, giallo tratteggiato per quella nuova.
const reasonCell: Record<Reason, string> = {
  review: 'bg-lead',
  learning: 'bg-pencil',
  new: 'bg-pencil-soft ring-1 ring-pencil ring-inset',
}

const reasonTag: Record<Reason, string> = {
  review: 'bg-lead/10 text-lead',
  learning: 'bg-pencil-soft text-pencil-ink',
  new: 'border border-dashed border-pencil text-pencil-ink',
}

const stateSegment: Record<SkillState, string> = {
  locked: 'bg-hair',
  learning: 'bg-pencil',
  mastered: 'bg-ok',
}

// Il capitolo su cui si lavora ha il giallo della matita, uno chiuso il
// tratteggio; gli altri aperti stanno sulla carta.
const chapterCard: Record<ChapterStatus | 'working', string> = {
  working: 'border-pencil/60 bg-pencil-soft/40',
  open: 'border-hair',
  mastered: 'border-ok/30',
  locked: 'border-dashed border-hair',
}

export function HomePage({
  store,
  skills,
  onStart,
  onOpenLesson,
  onOpenProgress,
  onPractise,
  onChange,
}: {
  store: ProgressStore
  skills: readonly Skill[]
  onStart: (session: SessionItem[]) => void
  onOpenLesson?: (chapter: ChapterId) => void
  onOpenProgress?: (chapter: ChapterId) => void
  onPractise?: (skill: GeneratedSkill) => void
  /** Dopo ogni scrittura nel ProgressStore. */
  onChange?: () => void
}) {
  const { progress, reload } = useProgress(store)

  const plan = useMemo<Plan | null>(() => {
    if (!progress) return null
    const { attempts, known } = progress
    const now = new Date()
    return {
      due: dueReviews(attempts, now, known).filter(canPractise).length,
      session: composeSession({
        graph: skills,
        attempts,
        known,
        now,
        canPractise,
      }),
      states: skillStates(skills, attempts, known),
      known,
    }
  }, [progress, skills])

  async function write(change: Promise<void>) {
    await change
    await reload()
    onChange?.()
  }

  if (!plan) return null

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
      <Today
        plan={plan}
        skills={skills}
        onStart={() => onStart(plan.session)}
      />
      <Path
        states={plan.states}
        known={plan.known}
        onOpenLesson={onOpenLesson}
        onOpenProgress={onOpenProgress}
        onPractise={onPractise}
        onMark={(chapter) =>
          void write(markChapterKnown(store, chapter, Date.now()))
        }
        onUnmark={(chapter) => void write(unmarkChapterKnown(store, chapter))}
      />
    </div>
  )
}

function Today({
  plan,
  skills,
  onStart,
}: {
  plan: Plan
  skills: readonly Skill[]
  onStart: () => void
}) {
  const { due, session } = plan
  const title = (id: string) => skills.find((s) => s.id === id)?.title ?? id
  const empty = session.length === 0

  return (
    <Panel
      aria-label="Oggi"
      className="relative animate-rise p-6 sm:p-8 lg:col-span-7"
    >
      <Eyebrow>Oggi</Eyebrow>

      {due > 0 ? (
        <>
          {/* La frase intera per lo screen reader; a schermo il numero
              grande e le parole accanto. */}
          <p className="sr-only">{pendingText(due)}</p>
          <div aria-hidden="true" className="mt-3 flex items-end gap-4">
            <span className="animate-pop font-display text-8xl leading-[0.8] font-bold tracking-tighter tabular-nums">
              {due}
            </span>
            <span className="pb-1 font-display text-2xl leading-tight font-semibold">
              {due === 1 ? 'ripasso' : 'ripassi'}
              <br />
              in attesa
            </span>
          </div>
        </>
      ) : (
        <p className="mt-3 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
          {pendingText(due)}
        </p>
      )}
      <p className="mt-3 max-w-md text-dim">
        {empty
          ? 'Per oggi non c’è altro da allenare: torna quando scade un ripasso.'
          : due > 0
            ? 'Si parte dai ripassi, poi si va avanti nel percorso.'
            : 'Niente da recuperare: oggi si va avanti nel percorso.'}
      </p>

      {!empty && (
        <Sheet className="mt-6 rounded-2xl p-4 shadow-none sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold">La sessione</p>
            <Note className="-rotate-2">{session.length} esercizi</Note>
          </div>
          {/* Un quadretto per esercizio, nell'ordine in cui arrivano. */}
          <div aria-hidden="true" className="mt-3 flex flex-wrap gap-1.5">
            {session.map((item, i) => (
              <span
                key={i}
                className={cn(
                  'size-5 animate-pop rounded-md',
                  reasonCell[item.reason],
                )}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-2">
            {groupSession(session).map((group) => (
              <li
                key={`${group.reason}:${group.skill}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-panel/80 px-3 py-2"
              >
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    reasonTag[group.reason],
                  )}
                >
                  {reasonLabel[group.reason]}
                </span>
                <span className="min-w-0 flex-1 font-medium">
                  {title(group.skill)}
                </span>
                <span className="text-sm text-dim tabular-nums">
                  ×{group.count}
                </span>
              </li>
            ))}
          </ul>
        </Sheet>
      )}

      <Button
        variant="pencil"
        onClick={onStart}
        disabled={empty}
        className="mt-6 w-full px-6 py-3.5 text-lg sm:w-auto"
      >
        Inizia la sessione
        <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.4} />
      </Button>
    </Panel>
  )
}

function Path({
  states,
  known,
  onOpenLesson,
  onOpenProgress,
  onPractise,
  onMark,
  onUnmark,
}: {
  states: Record<string, SkillState>
  known: readonly Known[]
  onOpenLesson?: ((chapter: ChapterId) => void) | undefined
  onOpenProgress?: ((chapter: ChapterId) => void) | undefined
  onPractise?: ((skill: GeneratedSkill) => void) | undefined
  onMark: (chapter: Chapter) => void
  onUnmark: (chapter: Chapter) => void
}) {
  const working = workingChapter(states)
  const allSkills = chapters.flatMap((c) => c.skills)
  const mastered = allSkills.filter((s) => states[s.id] === 'mastered').length

  return (
    <Panel
      aria-labelledby="path-title"
      className="animate-rise p-6 [animation-delay:90ms] sm:p-8 lg:col-span-5"
    >
      <Eyebrow>Percorso</Eyebrow>
      <h2
        id="path-title"
        className="mt-1 font-display text-2xl font-bold tracking-tight"
      >
        {chapters.length} capitoli, uno alla volta
      </h2>
      <p className="mt-1 text-sm text-dim">
        {`${mastered} di ${allSkills.length} abilità acquisite · in corso: ${working.title}`}
      </p>

      <ol className="mt-5 space-y-3">
        {chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            states={states}
            known={known}
            working={chapter.id === working.id}
            onOpenLesson={
              onOpenLesson && lessons[chapter.id]
                ? () => onOpenLesson(chapter.id)
                : undefined
            }
            onOpenProgress={
              onOpenProgress ? () => onOpenProgress(chapter.id) : undefined
            }
            onPractise={onPractise}
            onMark={() => onMark(chapter)}
            onUnmark={() => onUnmark(chapter)}
          />
        ))}
      </ol>
    </Panel>
  )
}

function ChapterCard({
  chapter,
  states,
  known,
  working,
  onOpenLesson,
  onOpenProgress,
  onPractise,
  onMark,
  onUnmark,
}: {
  chapter: Chapter
  states: Record<string, SkillState>
  known: readonly Known[]
  working: boolean
  onOpenLesson?: (() => void) | undefined
  onOpenProgress?: (() => void) | undefined
  onPractise?: ((skill: GeneratedSkill) => void) | undefined
  onMark: () => void
  onUnmark: () => void
}) {
  const titleId = useId()
  const listId = useId()
  // Aperta all'inizio solo la scheda del capitolo in corso, così sul
  // telefono il percorso resta corto.
  const [expanded, setExpanded] = useState(working)
  const summary = summarize(chapter, states, known)
  const { status, mastered, total } = summary
  const locked = status === 'locked'
  const waiting = locked ? waitingChaptersText(chapter, states) : ''

  return (
    <li
      aria-labelledby={titleId}
      className={cn(
        'rounded-2xl border p-4',
        chapterCard[working ? 'working' : status],
      )}
    >
      <div
        className={cn('flex gap-4', locked ? 'items-start' : 'items-center')}
      >
        {locked ? (
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-paper text-dim">
            <Lock aria-hidden="true" className="size-5" />
          </span>
        ) : (
          <Ring value={total ? mastered / total : 0} className="size-14">
            {mastered}/{total}
          </Ring>
        )}
        <div className="min-w-0">
          <p
            className={cn(
              'text-xs font-semibold',
              working ? 'text-pencil-ink' : 'text-dim',
            )}
          >
            Capitolo {chapter.number}
            {locked && ' · bloccato'}
            {status === 'mastered' && ' · completo'}
          </p>
          <p
            id={titleId}
            className={cn(
              'font-display text-lg leading-tight font-bold',
              locked && 'text-ink/70',
            )}
          >
            {chapter.title}
          </p>
          <p className="text-sm text-dim">{chapter.blurb}</p>
          {waiting && <p className="mt-1 text-sm font-semibold">{waiting}</p>}
          {!locked && (
            <p className="mt-1 text-sm font-semibold">
              {mastered}/{total} acquisite
            </p>
          )}
        </div>
      </div>
      <div aria-hidden="true" className="mt-4 flex gap-1">
        {chapter.skills.map((s) => (
          <span
            key={s.id}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              stateSegment[states[s.id] ?? 'locked'],
            )}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-start gap-2">
        {onOpenLesson && (
          <Button
            variant="ghost"
            onClick={onOpenLesson}
            aria-describedby={titleId}
            icon={<BookOpen aria-hidden="true" className="size-4" />}
            className="px-3 py-2 text-sm"
          >
            Apri la lezione
          </Button>
        )}
        {onOpenProgress && (
          <Button
            variant="ghost"
            onClick={onOpenProgress}
            aria-describedby={titleId}
            icon={<MapIcon aria-hidden="true" className="size-4" />}
            className="px-3 py-2 text-sm"
          >
            Vedi la mappa
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={listId}
          aria-describedby={titleId}
          icon={
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 transition', expanded && 'rotate-180')}
            />
          }
          className="px-3 py-2 text-sm"
        >
          Abilità
        </Button>
        <KnownChapter
          summary={summary}
          onMark={onMark}
          onUnmark={onUnmark}
          describedBy={titleId}
        />
      </div>
      <ul id={listId} hidden={!expanded} className="mt-4 space-y-2">
        {chapter.skills.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            states={states}
            onPractise={onPractise}
          />
        ))}
      </ul>
    </li>
  )
}

// Un'abilità nella scheda del suo capitolo: nome, stato e il pulsante per
// allenarla. Su un'abilità bloccata il pulsante dice "Allena lo stesso" e
// sotto il nome ci sono i prerequisiti che mancano.
function SkillRow({
  skill,
  states,
  onPractise,
}: {
  skill: Skill
  states: Record<string, SkillState>
  onPractise?: ((skill: GeneratedSkill) => void) | undefined
}) {
  const titleId = useId()
  const state = states[skill.id] ?? 'locked'
  const locked = state === 'locked'
  // Un nome a parte perché la guardia di canPractise arrivi fino al click.
  const id = skill.id
  return (
    <li
      aria-labelledby={titleId}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-panel/80 px-3 py-2"
    >
      <div className="min-w-0 flex-1">
        <p id={titleId} className={cn('font-medium', locked && 'text-ink/70')}>
          {skill.title}
        </p>
        {locked && (
          <p className="text-xs text-dim">
            {missingPrerequisitesText(skill, states)}
          </p>
        )}
      </div>
      <span
        className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-semibold',
          stateTag[state],
        )}
      >
        {stateLabel[state]}
      </span>
      {onPractise && canPractise(id) && (
        <Button
          variant={locked ? 'ghost' : 'pencil'}
          onClick={() => onPractise(id)}
          aria-describedby={titleId}
          className="px-3 py-1.5 text-sm"
        >
          {locked ? 'Allena lo stesso' : 'Allena'}
        </Button>
      )}
    </li>
  )
}
