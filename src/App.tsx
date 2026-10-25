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

const views: readonly { view: View; label: string }[] = [
  { view: 'home', label: 'Inizio' },
  { view: 'lesson', label: 'Lezione' },
  { view: 'practice', label: 'Pratica' },
  { view: 'progress', label: 'I miei progressi' },
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Matita</h1>
      <nav className="mt-4 flex gap-4 text-sm">
        {views.map(({ view: v, label }) => (
          <button
            key={v}
            type="button"
            aria-current={view === v ? 'page' : undefined}
            onClick={() => show(v)}
            className={cn(view === v ? 'text-ink underline' : 'text-dim')}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-10">
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
        {view === 'progress' && <ProgressPage store={store} skills={skills} />}
      </div>
    </main>
  )
}
