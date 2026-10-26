import { ArrowRight, BookOpen, Lock, Map as MapIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Skill } from '../content/skills.ts'
import { cn } from '../lib/cn.ts'
import { dueReviews } from '../progress/review.ts'
import { composeSession, type SessionItem } from '../progress/session.ts'
import { skillStates, type SkillState } from '../progress/skillState.ts'
import type { ProgressStore } from '../progress/store.ts'
import { canPractise } from './exercises.ts'
import { firstChapter, upcomingChapters } from './home/chapters.ts'
import { groupSession, reasonLabel, type Reason } from './home/skillProgress.ts'
import { Button, Eyebrow, Note, Panel, Ring, Sheet } from './kit.tsx'

// La pagina iniziale: quanti ripassi aspettano, cosa c'è nella sessione di
// oggi e a che punto è il percorso.

interface Plan {
  readonly due: number
  readonly session: SessionItem[]
  readonly states: Record<string, SkillState>
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

export function HomePage({
  store,
  skills,
  onStart,
  onOpenLesson,
  onOpenProgress,
}: {
  store: ProgressStore
  skills: readonly Skill[]
  onStart: (session: SessionItem[]) => void
  onOpenLesson?: () => void
  onOpenProgress?: () => void
}) {
  const [plan, setPlan] = useState<Plan | null>(null)

  useEffect(() => {
    let live = true
    void store.attempts().then((attempts) => {
      if (!live) return
      const now = new Date()
      setPlan({
        due: dueReviews(attempts, now).filter(canPractise).length,
        session: composeSession({ graph: skills, attempts, now, canPractise }),
        states: skillStates(skills, attempts),
      })
    })
    return () => {
      live = false
    }
  }, [store, skills])

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
        skills={skills}
        onOpenLesson={onOpenLesson}
        onOpenProgress={onOpenProgress}
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
  skills,
  onOpenLesson,
  onOpenProgress,
}: {
  states: Record<string, SkillState>
  skills: readonly Skill[]
  onOpenLesson?: (() => void) | undefined
  onOpenProgress?: (() => void) | undefined
}) {
  const mastered = skills.filter((s) => states[s.id] === 'mastered').length

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
        {upcomingChapters.length + 1} capitoli, uno alla volta
      </h2>

      <ol className="mt-5 space-y-3">
        <li className="rounded-2xl border border-pencil/60 bg-pencil-soft/40 p-4">
          <div className="flex items-center gap-4">
            <Ring value={mastered / skills.length} className="size-14">
              {mastered}/{skills.length}
            </Ring>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-pencil-ink">
                Capitolo {firstChapter.number}
              </p>
              <p className="font-display text-lg leading-tight font-bold">
                {firstChapter.title}
              </p>
              <p className="text-sm text-dim">{firstChapter.blurb}</p>
              <p className="mt-1 text-sm font-semibold">
                {mastered}/{skills.length} acquisite
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="mt-4 flex gap-1">
            {skills.map((s) => (
              <span
                key={s.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  stateSegment[states[s.id] ?? 'locked'],
                )}
              />
            ))}
          </div>
          {(onOpenLesson || onOpenProgress) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onOpenLesson && (
                <Button
                  variant="ghost"
                  onClick={onOpenLesson}
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
                  icon={<MapIcon aria-hidden="true" className="size-4" />}
                  className="px-3 py-2 text-sm"
                >
                  Vedi la mappa
                </Button>
              )}
            </div>
          )}
        </li>

        {upcomingChapters.map((chapter) => (
          <li
            key={chapter.number}
            className="flex items-start gap-4 rounded-2xl border border-dashed border-hair p-4"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-paper text-dim">
              <Lock aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-dim">
                Capitolo {chapter.number} · in arrivo
              </p>
              <p className="font-display text-lg leading-tight font-bold text-ink/70">
                {chapter.title}
              </p>
              <p className="text-sm text-dim">{chapter.blurb}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
