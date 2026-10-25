import {
  attemptOutcomes,
  type Attempt,
  type AttemptOutcome,
} from './attempt.ts'
import type { ProgressStore } from './store.ts'

// Esportazione e importazione di tutti i tentativi in un file JSON. Senza
// account è l'unica difesa contro un browser ripulito. L'importazione legge e
// controlla tutto il file prima di scrivere: un file non valido non tocca i
// dati esistenti.

const format = 'matita-progress'
const version = 1

export async function exportBackup(store: ProgressStore): Promise<string> {
  const attempts = await store.attempts()
  return JSON.stringify({ format, version, attempts }, null, 2)
}

export type ImportResult =
  | { readonly ok: true; readonly count: number }
  | { readonly ok: false; readonly message: string }

export async function importBackup(
  store: ProgressStore,
  text: string,
): Promise<ImportResult> {
  const parsed = parseBackup(text)
  if (!parsed.ok) return parsed
  await store.putAttempts(parsed.attempts)
  return { ok: true, count: parsed.attempts.length }
}

type Parsed =
  | { readonly ok: true; readonly attempts: Attempt[] }
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
  if (data.version !== version)
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
  return { ok: true, attempts }
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
