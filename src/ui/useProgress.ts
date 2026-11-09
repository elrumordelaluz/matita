import { useCallback, useEffect, useState } from 'react'
import type { Attempt } from '../progress/attempt.ts'
import type { FlashcardReview, Introduced } from '../progress/flashcards.ts'
import type { Known } from '../progress/known.ts'
import type { ProgressStore } from '../progress/store.ts'

// Quello che c'è nel ProgressStore, letto una volta all'apertura della pagina
// e di nuovo con `reload` dopo ogni scrittura.

export interface Progress {
  readonly attempts: Attempt[]
  readonly known: Known[]
  readonly introduced: Introduced[]
  readonly flashcardReviews: FlashcardReview[]
}

async function read(store: ProgressStore): Promise<Progress> {
  const [attempts, known, introduced, flashcardReviews] = await Promise.all([
    store.attempts(),
    store.known(),
    store.introduced(),
    store.flashcardReviews(),
  ])
  return { attempts, known, introduced, flashcardReviews }
}

export function useProgress(store: ProgressStore): {
  progress: Progress | null
  reload: () => Promise<void>
} {
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    let live = true
    void read(store).then((p) => {
      if (live) setProgress(p)
    })
    return () => {
      live = false
    }
  }, [store])

  const reload = useCallback(async () => {
    setProgress(await read(store))
  }, [store])

  return { progress, reload }
}
