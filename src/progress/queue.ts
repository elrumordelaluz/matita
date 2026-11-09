import type { Attempt } from './attempt.ts'
import {
  dueFlashcards,
  newFlashcards,
  type Flashcard,
  type FlashcardGrade,
  type FlashcardReview,
  type Introduced,
} from './flashcards.ts'
import type { Known } from './known.ts'
import { composeSession, type SessionItem } from './session.ts'
import type { SkillGraph } from './skillState.ts'

// La coda di una seduta: gli esercizi di `composeSession` con le flashcard in
// mezzo. Vedi SPEC.md, "Sessione". Le flashcard non contano nei dieci
// esercizi e `composeSession` resta com'è.

export type QueueItem =
  | { readonly kind: 'exercise'; readonly item: SessionItem }
  | { readonly kind: 'flashcard'; readonly card: string }

// Le flashcard nuove che una seduta introduce al più, dopo le scadute.
const newPerSession = 5
// Quante voci dopo torna una flashcard votata Again.
const againGap = 3

export function composeQueue({
  graph,
  attempts,
  known = [],
  now,
  canPractise,
  flashcards,
  introduced,
  flashcardReviews,
  random = Math.random,
}: {
  graph: SkillGraph
  attempts: readonly Attempt[]
  known?: readonly Known[]
  now: Date
  canPractise?: (skill: string) => boolean
  flashcards: readonly Flashcard[]
  introduced: readonly Introduced[]
  flashcardReviews: readonly FlashcardReview[]
  /** Un numero in [0, 1), iniettato perché il mescolamento sia provabile. */
  random?: () => number
}): QueueItem[] {
  const session = composeSession({
    graph,
    attempts,
    known,
    now,
    ...(canPractise && { canPractise }),
  })
  const exercise = (item: SessionItem): QueueItem => ({
    kind: 'exercise',
    item,
  })
  const flashcard = (card: string): QueueItem => ({ kind: 'flashcard', card })

  const due: QueueItem[] = [
    ...session.filter((i) => i.reason === 'review').map(exercise),
    ...dueFlashcards(flashcards, introduced, flashcardReviews, now).map(
      flashcard,
    ),
  ]
  // Fisher-Yates.
  for (let i = due.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[due[i], due[j]] = [due[j]!, due[i]!]
  }
  const fresh = newFlashcards(flashcards, introduced, flashcardReviews)
    .slice(0, newPerSession)
    .map(flashcard)
  const rest = session.filter((i) => i.reason !== 'review').map(exercise)
  return [...due, ...fresh, ...rest]
}

/**
 * La coda dopo aver votato la voce `index`: con Again la stessa voce torna
 * tre posti dopo, o in fondo se ne restano meno; con gli altri voti nulla.
 */
export function requeue(
  queue: readonly QueueItem[],
  index: number,
  grade: FlashcardGrade,
): QueueItem[] {
  const item = queue[index]
  if (grade !== 'again' || !item) return [...queue]
  const at = Math.min(index + againGap, queue.length)
  return [...queue.slice(0, at), item, ...queue.slice(at)]
}
