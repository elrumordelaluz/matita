import {
  BookOpen,
  ChartNoAxesColumn,
  House,
  Pencil,
  PencilLine,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NExpressionsLesson } from './content/lessons/NExpressionsLesson.tsx'
import { skills } from './content/skills.ts'
import { generate, type GeneratedSkill } from './engine/index.ts'
import { cn } from './lib/cn.ts'
import { attemptFromPractice } from './progress/record.ts'
import type { SessionItem } from './progress/session.ts'
import { createMemoryStore, type ProgressStore } from './progress/store.ts'
import { randomSeed } from './ui/exercises.ts'
import { HomePage } from './ui/HomePage.tsx'
import { PracticePage, type PracticeAttempt } from './ui/PracticePage.tsx'
import { ProgressPage } from './ui/ProgressPage.tsx'
import { SessionPage } from './ui/SessionPage.tsx'

type View = 'home' | 'lesson' | 'practice' | 'progress'

const views: readonly { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'home', label: 'Inizio', icon: House },
  { view: 'lesson', label: 'Lezione', icon: BookOpen },
  { view: 'practice', label: 'Pratica', icon: PencilLine },
  { view: 'progress', label: 'I miei progressi', icon: ChartNoAxesColumn },
]

// Senza `store` i progressi vivono solo in memoria: main.tsx passa quello su
// IndexedDB.
export default function App({ store: given }: { store?: ProgressStore }) {
  const [store] = useState(() => given ?? createMemoryStore())
  const [view, setView] = useState<View>('home')
  const [session, setSession] = useState<SessionItem[] | null>(null)
  const [practised, setPractised] = useState<GeneratedSkill>('n.add-sub')

  function save(result: PracticeAttempt) {
    void store.addAttempt(
      attemptFromPractice(result, {
        id: crypto.randomUUID(),
        answeredAt: Date.now(),
      }),
    )
  }

  function show(v: View) {
    setSession(null)
    setView(v)
  }

  // Il banco di lavoro: la barra delle viste a sinistra (in basso sul
  // telefono), la testata, e la pagina sulla scrivania.
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
            className="grid size-11 -rotate-6 place-items-center rounded-2xl bg-pencil text-[#1c1b19] shadow-key"
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
            (session ? (
              <SessionPage
                items={session}
                skills={skills}
                onAttempt={save}
                onDone={() => setSession(null)}
              />
            ) : (
              <HomePage store={store} skills={skills} onStart={setSession} />
            ))}
          {view === 'lesson' && (
            <NExpressionsLesson
              onPractise={(skill) => {
                setPractised(skill)
                setView('practice')
              }}
            />
          )}
          {view === 'practice' && (
            <>
              <p className="mb-6 text-dim">
                {skills.find((s) => s.id === practised)?.title}
              </p>
              <PracticePage
                key={practised}
                createExercise={() => generate(practised, randomSeed())}
                onAttempt={save}
              />
            </>
          )}
          {view === 'progress' && (
            <ProgressPage store={store} skills={skills} />
          )}
        </div>
      </div>
    </div>
  )
}
