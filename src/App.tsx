import {
  BookOpen,
  ChartNoAxesColumn,
  House,
  Pencil,
  PencilLine,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChapterId } from './content/chapters.ts'
import { skills } from './content/skills.ts'
import { generate, type GeneratedSkill } from './engine/index.ts'
import { cn } from './lib/cn.ts'
import { attemptFromPractice } from './progress/record.ts'
import type { SessionItem } from './progress/session.ts'
import { skillStates } from './progress/skillState.ts'
import { createMemoryStore, type ProgressStore } from './progress/store.ts'
import { randomSeed } from './ui/exercises.ts'
import { practiceSkill, workingChapter } from './ui/home/chapterProgress.ts'
import { HomePage } from './ui/HomePage.tsx'
import { LessonPage } from './ui/LessonPage.tsx'
import { PracticePage, type PracticeAttempt } from './ui/PracticePage.tsx'
import { ProgressPage } from './ui/ProgressPage.tsx'
import { SessionPage, type SessionSnapshot } from './ui/SessionPage.tsx'
import { useProgress } from './ui/useProgress.ts'

type View = 'home' | 'lesson' | 'practice' | 'progress'

// La sessione in corso: le sue voci e, quando se n'è aperta la lezione di
// un'abilità nuova, da dove riprendere al ritorno.
interface HeldSession {
  readonly items: readonly SessionItem[]
  readonly resume: SessionSnapshot | null
}

const views: readonly { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'home', label: 'Inizio', icon: House },
  { view: 'lesson', label: 'Lezione', icon: BookOpen },
  { view: 'practice', label: 'Pratica', icon: PencilLine },
  { view: 'progress', label: 'I miei progressi', icon: ChartNoAxesColumn },
]

// Without `store`, progress lives in memory only: main.tsx passes the
// IndexedDB one.
export default function App({ store: given }: { store?: ProgressStore }) {
  const [store] = useState(() => given ?? createMemoryStore())
  const [view, setView] = useState<View>('home')
  const [held, setHeld] = useState<HeldSession | null>(null)
  // Re-read after every write; until the first read, the app starts from
  // the first chapter.
  const { progress, reload } = useProgress(store)
  const states = useMemo(
    () => progress && skillStates(skills, progress.attempts, progress.known),
    [progress],
  )
  // Fixed when the view opens, so they don't shift while the student
  // works.
  const [practised, setPractised] = useState<GeneratedSkill>(() =>
    practiceSkill(skills, null, []),
  )
  const [lessonChapter, setLessonChapter] = useState<ChapterId | null>(null)
  const [mapChapter, setMapChapter] = useState<ChapterId | undefined>()

  const refresh = () => void reload()

  function save(result: PracticeAttempt) {
    void store
      .addAttempt(
        attemptFromPractice(result, {
          id: crypto.randomUUID(),
          answeredAt: Date.now(),
        }),
      )
      .then(reload)
  }

  function practise(skill: GeneratedSkill) {
    setHeld(null)
    setPractised(skill)
    setView('practice')
  }

  function openLesson(chapter: ChapterId) {
    setHeld(null)
    setLessonChapter(chapter)
    setView('lesson')
  }

  function openProgress(chapter: ChapterId) {
    setHeld(null)
    setMapChapter(chapter)
    setView('progress')
  }

  // La lezione richiesta dal cancello di un'abilità nuova: la sessione resta
  // sospesa, con lo scatto di dov'era, e riprende al ritorno.
  function openSessionLesson(chapter: ChapterId, snapshot: SessionSnapshot) {
    if (held) setHeld({ items: held.items, resume: snapshot })
    setLessonChapter(chapter)
    setView('lesson')
  }

  function backToSession() {
    setView('home')
  }

  function show(v: View) {
    setHeld(null)
    if (v === 'lesson') setLessonChapter(states && workingChapter(states).id)
    if (v === 'practice')
      setPractised(practiceSkill(skills, states, progress?.attempts ?? []))
    if (v === 'progress') setMapChapter(undefined)
    setView(v)
  }

  return (
    <div className="min-h-dvh pb-28 lg:pb-0 lg:pl-28">
      <nav
        aria-label="Viste"
        className="fixed inset-x-3 bottom-3 z-20 flex justify-around rounded-3xl border border-hair/70 bg-panel/90 p-1.5 shadow-lift backdrop-blur lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-4 lg:-translate-y-1/2 lg:flex-col lg:gap-1"
      >
        {views.map(({ view: v, label, icon: Icon }) => (
          <button
            key={v}
            type="button"
            aria-current={view === v ? 'page' : undefined}
            onClick={() => show(v)}
            className={cn(
              'group flex w-20 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] leading-tight font-semibold transition',
              'focus-visible:ring-2 focus-visible:ring-pencil focus-visible:outline-none',
              view === v
                ? 'bg-pencil-soft text-pencil-ink'
                : 'text-dim hover:bg-paper hover:text-ink',
            )}
          >
            <Icon
              aria-hidden="true"
              className="size-5 transition group-hover:-translate-y-0.5"
              strokeWidth={2.2}
            />
            <span className="text-center">{label}</span>
          </button>
        ))}
      </nav>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:pt-10">
        <header className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 -rotate-6 place-items-center rounded-2xl bg-pencil text-on-pencil shadow-key"
          >
            <Pencil className="size-5" strokeWidth={2.4} />
          </span>
          <div>
            <h1 className="font-display text-3xl leading-none font-bold tracking-tight">
              Matita
            </h1>
            <p className="mt-1 text-sm text-dim">
              Spiega <span className="text-pencil">·</span> Allena{' '}
              <span className="text-pencil">·</span> Ripassa
            </p>
          </div>
        </header>
        <div className="mt-8">
          {view === 'home' &&
            (held ? (
              <SessionPage
                items={held.items}
                skills={skills}
                onAttempt={save}
                onDone={() => setHeld(null)}
                onOpenLesson={openSessionLesson}
                resume={held.resume}
              />
            ) : (
              <HomePage
                store={store}
                skills={skills}
                onStart={(items) => setHeld({ items, resume: null })}
                onOpenLesson={openLesson}
                onOpenProgress={openProgress}
                onPractise={practise}
                onChange={refresh}
              />
            ))}
          {view === 'lesson' && (
            <LessonPage
              store={store}
              skills={skills}
              chapter={
                lessonChapter ?? (states ? workingChapter(states).id : 'n')
              }
              onChapter={setLessonChapter}
              onPractise={practise}
              onChange={refresh}
              onBackToSession={held ? backToSession : undefined}
            />
          )}
          {view === 'practice' && (
            <PracticePage
              key={practised}
              title={skills.find((s) => s.id === practised)?.title ?? ''}
              createExercise={() => generate(practised, randomSeed())}
              onAttempt={save}
            />
          )}
          {view === 'progress' && (
            <ProgressPage
              store={store}
              skills={skills}
              chapter={mapChapter}
              onPractise={practise}
            />
          )}
        </div>
      </div>
    </div>
  )
}
