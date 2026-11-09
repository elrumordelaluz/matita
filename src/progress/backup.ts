import {
  attemptOutcomes,
  type Attempt,
  type AttemptOutcome,
} from './attempt.ts'
import type { FlashcardReview, Introduced } from './flashcards.ts'
import { flashcardGrades } from './flashcards.ts'
import type { Known } from './known.ts'
import type { ProgressStore } from './store.ts'

// Esportazione e importazione di tutti i tentativi, dei segni di già saputo,
// delle introduzioni e dei voti alle flashcard in un file JSON. Senza account è l'unica difesa contro un browser ripulito.
// L'importazione legge e controlla tutto il file prima di scrivere: un file
// non valido non tocca i dati esistenti.

const format = 'matita-progress'
// La versione 1 porta solo i tentativi, la 2 anche i segni di già saputo, la 3
// anche le introduzioni e i voti alle flashcard. Si scrive sempre l'ultima e si
// leggono tutte.
const version = 3
const readable = [1, 2, 3]

export async function exportBackup(store: ProgressStore): Promise<string> {
  const attempts = await store.attempts()
  const known = await store.known()
  const introduced = await store.introduced()
  const flashcardReviews = await store.flashcardReviews()
  return JSON.stringify(
    { format, version, attempts, known, introduced, flashcardReviews },
    null,
    2,
  )
}

export type ImportResult =
  | {
      readonly ok: true
      /** I tentativi importati. */
      readonly count: number
      /** Le abilità segnate come già sapute, solo se il file ne porta. */
      readonly known?: number
      /** Le flashcard introdotte, solo se il file ne porta. */
      readonly introduced?: number
      /** I voti alle flashcard, solo se il file ne porta. */
      readonly reviews?: number
    }
  | { readonly ok: false; readonly message: string }

export async function importBackup(
  store: ProgressStore,
  text: string,
): Promise<ImportResult> {
  const parsed = parseBackup(text)
  if (!parsed.ok) return parsed
  await store.putAttempts(parsed.attempts)
  await store.putKnown(parsed.known)
  await store.putIntroduced(parsed.introduced)
  await store.putFlashcardReviews(parsed.reviews)
  return {
    ok: true,
    count: parsed.attempts.length,
    ...(parsed.known.length > 0 && { known: parsed.known.length }),
    ...(parsed.introduced.length > 0 && {
      introduced: parsed.introduced.length,
    }),
    ...(parsed.reviews.length > 0 && { reviews: parsed.reviews.length }),
  }
}

// Il testo dell’avviso dopo l’importazione: il messaggio quando il file non
// va, il conto di ciò che è entrato quando va. Un file valido ma senza niente
// dentro non è un errore: lo dice chiaro, senza contare zero tentativi.
export function importNotice(result: ImportResult): string {
  if (!result.ok) return result.message
  const { count, known, introduced, reviews } = result
  if (
    count === 0 &&
    known === undefined &&
    introduced === undefined &&
    reviews === undefined
  )
    return 'Il backup non contiene progressi.'
  const parts = [
    count === 1 ? 'Importato 1 tentativo' : `Importati ${count} tentativi`,
  ]
  if (known !== undefined)
    parts.push(
      known === 1 ? '1 abilità già saputa' : `${known} abilità già sapute`,
    )
  if (introduced !== undefined)
    parts.push(
      introduced === 1
        ? '1 flashcard introdotta'
        : `${introduced} flashcard introdotte`,
    )
  if (reviews !== undefined)
    parts.push(
      reviews === 1
        ? '1 voto alle flashcard'
        : `${reviews} voti alle flashcard`,
    )
  const last = parts.pop()
  return `${parts.join(', ')}${parts.length ? ' e ' : ''}${last}.`
}

type Parsed =
  | {
      readonly ok: true
      readonly attempts: Attempt[]
      readonly known: Known[]
      readonly introduced: Introduced[]
      readonly reviews: FlashcardReview[]
    }
  | { readonly ok: false; readonly message: string }

function parseBackup(text: string): Parsed {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, message: 'Il file non è un backup di Matita.' }
  }
  if (!isRecord(data) || data.format !== format)
    return { ok: false, message: 'Il file non è un backup di Matita.' }
  if (!readable.some((v) => v === data.version))
    return {
      ok: false,
      message: 'Il backup viene da una versione di Matita che non conosco.',
    }
  if (!Array.isArray(data.attempts))
    return { ok: false, message: 'Il backup è danneggiato.' }
  const attempts: Attempt[] = []
  for (const item of data.attempts) {
    const a = readAttempt(item)
    if (!a) return { ok: false, message: 'Il backup è danneggiato.' }
    attempts.push(a)
  }
  // Un file della versione 1 non ha segni: vuol dire nessun segno.
  const knownItems = data.version === 1 ? [] : data.known
  if (!Array.isArray(knownItems))
    return { ok: false, message: 'Il backup è danneggiato.' }
  const known: Known[] = []
  for (const item of knownItems) {
    const k = readKnown(item)
    if (!k) return { ok: false, message: 'Il backup è danneggiato.' }
    known.push(k)
  }
  // Prima della versione 3 non ci sono flashcard: vuol dire nessuna.
  const introducedItems = data.version === 3 ? data.introduced : []
  const reviewItems = data.version === 3 ? data.flashcardReviews : []
  if (!Array.isArray(introducedItems) || !Array.isArray(reviewItems))
    return { ok: false, message: 'Il backup è danneggiato.' }
  const introduced = introducedItems.map(readIntroduced)
  const reviews = reviewItems.map(readReview)
  if (introduced.includes(null) || reviews.includes(null))
    return { ok: false, message: 'Il backup è danneggiato.' }
  return {
    ok: true,
    attempts,
    known,
    introduced: introduced as Introduced[],
    reviews: reviews as FlashcardReview[],
  }
}

function readKnown(item: unknown): Known | null {
  if (!isRecord(item)) return null
  const { skill, markedAt } = item
  if (typeof skill !== 'string' || skill === '' || !isCount(markedAt))
    return null
  return { skill, markedAt }
}

function readIntroduced(item: unknown): Introduced | null {
  if (!isRecord(item)) return null
  const { card, introducedAt } = item
  if (typeof card !== 'string' || card === '' || !isCount(introducedAt))
    return null
  return { card, introducedAt }
}

function readReview(item: unknown): FlashcardReview | null {
  if (!isRecord(item)) return null
  const { card, grade, at } = item
  if (
    typeof card !== 'string' ||
    card === '' ||
    !flashcardGrades.some((g) => g === grade) ||
    !isCount(at)
  )
    return null
  return { card, grade: grade as FlashcardReview['grade'], at }
}

function readAttempt(item: unknown): Attempt | null {
  if (!isRecord(item)) return null
  const {
    id,
    skill,
    seed,
    generatorVersion,
    answer,
    outcome,
    misconception,
    hints,
    rewrites,
    durationMs,
    answeredAt,
  } = item
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof skill !== 'string' ||
    skill === '' ||
    !isCount(seed) ||
    !isCount(generatorVersion) ||
    typeof answer !== 'string' ||
    !isOutcome(outcome) ||
    !(misconception === null || typeof misconception === 'string') ||
    !isCount(hints) ||
    !isCount(rewrites) ||
    !isCount(durationMs) ||
    !isCount(answeredAt)
  )
    return null
  // Solo i campi noti: quello che il file aggiunge in più non entra nei dati.
  return {
    id,
    skill,
    seed,
    generatorVersion,
    answer,
    outcome,
    misconception,
    hints,
    rewrites,
    durationMs,
    answeredAt,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0
}

function isOutcome(value: unknown): value is AttemptOutcome {
  return attemptOutcomes.some((o) => o === value)
}
