import { useState } from 'react'
import { NExpressionsLesson } from './content/lessons/NExpressionsLesson.tsx'
import { generate, type GeneratedSkill } from './engine/index.ts'
import { PracticePage } from './ui/PracticePage.tsx'

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
}

export default function App() {
  // Nessun router: la lezione, oppure la pratica di un'abilità.
  const [skill, setSkill] = useState<GeneratedSkill | null>(null)
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Matita</h1>
      <div className="mt-10">
        {skill === null ? (
          <NExpressionsLesson onPractise={setSkill} />
        ) : (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setSkill(null)}
              className="text-sm text-dim underline"
            >
              Torna alla lezione
            </button>
            <PracticePage
              key={skill}
              createExercise={() => generate(skill, randomSeed())}
            />
          </div>
        )}
      </div>
    </main>
  )
}
