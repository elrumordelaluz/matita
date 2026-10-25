import { useState } from 'react'
import { skills } from './content/skills.ts'
import { generate } from './engine/index.ts'
import { attemptFromPractice } from './progress/record.ts'
import { createMemoryStore, type ProgressStore } from './progress/store.ts'
import { cn } from './lib/cn.ts'
import { PracticePage, type PracticeAttempt } from './ui/PracticePage.tsx'
import { ProgressPage } from './ui/ProgressPage.tsx'

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
}

type View = 'practice' | 'progress'

const views: readonly { view: View; label: string }[] = [
  { view: 'practice', label: 'Pratica' },
  { view: 'progress', label: 'I miei progressi' },
]

// Senza `store` i progressi vivono solo in memoria: main.tsx passa quello su
// IndexedDB.
export default function App({ store: given }: { store?: ProgressStore }) {
  const [store] = useState(() => given ?? createMemoryStore())
  const [view, setView] = useState<View>('practice')

  function save(result: PracticeAttempt) {
    void store.addAttempt(
      attemptFromPractice(result, {
        id: crypto.randomUUID(),
        answeredAt: Date.now(),
      }),
    )
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
            onClick={() => setView(v)}
            className={cn(view === v ? 'text-ink underline' : 'text-dim')}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-10">
        {view === 'practice' && (
          <>
            <p className="mb-6 text-dim">Addizioni e sottrazioni in N.</p>
            <PracticePage
              createExercise={() => generate('n.add-sub', randomSeed())}
              onAttempt={save}
            />
          </>
        )}
        {view === 'progress' && <ProgressPage store={store} skills={skills} />}
      </div>
    </main>
  )
}
