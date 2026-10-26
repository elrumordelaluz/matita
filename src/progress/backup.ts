import {
  attemptOutcomes,
  type Attempt,
  type AttemptOutcome,
} from './attempt.ts'
import type { Known } from './known.ts'
import type { ProgressStore } from './store.ts'

// Esportazione e importazione di tutti i tentativi e dei segni di già saputo
// in un file JSON. Senza account è l'unica difesa contro un browser ripulito.
// L'importazione legge e controlla tutto il file prima di scrivere: un file
// non valido non tocca i dati esistenti.

const format = 'matita-progress'
// La versione 1 porta solo i tentativi, la 2 anche i segni di già saputo. Si
// scrive sempre l'ultima e si leggono tutte e due.
const version = 2
const readable = [1, 2]

export async function exportBackup(store: ProgressStore): Promise<string> {
  const attempts = await store.attempts()
  const known = await store.known()
  return JSON.stringify({ format, version, attempts, known }, null, 2)
}

export type ImportResult =
  | {
      readonly ok: true
      /** I tentativi importati. */
      readonly count: number
      /** Le abilità segnate come già sapute, solo se il file ne porta. */
      readonly known?: number
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
  const count = parsed.attempts.length
  return parsed.known.length > 0
    ? { ok: true, count, known: parsed.known.length }
    : { ok: true, count }
}

type Parsed =
  | {
      readonly ok: true
      readonly attempts: Attempt[]
      readonly known: Known[]
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
  return { ok: true, attempts, known }
}

function readKnown(item: unknown): Known | null {
  if (!isRecord(item)) return null
  const { skill, markedAt } = item
  if (typeof skill !== 'string' || skill === '' || !isCount(markedAt))
    return null
  return { skill, markedAt }
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
