import { useRef, useState } from 'react'
import type { Skill } from '../content/skills.ts'
import type { Exercise } from '../engine/index.ts'
import type { SessionItem } from '../progress/session.ts'
import { exerciseFor, randomSeed } from './exercises.ts'
import { PracticePage, type PracticeAttempt } from './PracticePage.tsx'

// Una sessione: gli esercizi in fila, uno per voce del piano. Finita la fila,
// "Esercizio successivo" continua con l'ultima abilità, fuori sessione.

const reasonLabel: Record<SessionItem['reason'], string> = {
  review: 'Ripasso',
  learning: 'In apprendimento',
  new: 'Abilità nuova',
}

interface Progress {
  /** La voce del piano mostrata adesso. */
  readonly index: number
  /** Se l'esercizio mostrato si è già chiuso. */
  readonly closed: boolean
}

export function SessionPage({
  items,
  skills,
  onAttempt,
  onDone,
}: {
  items: readonly SessionItem[]
  skills: readonly Skill[]
  onAttempt: (attempt: PracticeAttempt) => void
  onDone: () => void
}) {
  const [progress, setProgress] = useState<Progress>({
    index: 0,
    closed: false,
  })
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
    update({ ...current.current, closed: true })
  }

  const inSession = progress.index <= last
  const finished =
    progress.index > last || (progress.index === last && progress.closed)

  return (
    <section className="space-y-6">
      {inSession && item && (
        <p className="flex gap-2 text-sm text-dim">
          <span>{`Esercizio ${progress.index + 1} di ${items.length}`}</span>
          <span>{`${reasonLabel[item.reason]}: ${title ?? item.skill}`}</span>
        </p>
      )}
      <PracticePage createExercise={createExercise} onAttempt={record} />
      {finished && (
        <div className="space-y-3 border-t border-hair pt-4">
          <p className="text-ok">Sessione completata.</p>
          <button
            type="button"
            onClick={onDone}
            className="rounded border border-hair px-4 py-2"
          >
            Torna all’inizio
          </button>
        </div>
      )}
    </section>
  )
}
