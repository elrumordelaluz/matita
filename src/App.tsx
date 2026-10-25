import { generate } from './engine/index.ts'
import { PracticePage } from './ui/PracticePage.tsx'

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
}

export default function App() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Matita</h1>
      <p className="mt-2 text-dim">Addizioni e sottrazioni in N.</p>
      <div className="mt-10">
        <PracticePage
          createExercise={() => generate('n.add-sub', randomSeed())}
        />
      </div>
    </main>
  )
}
