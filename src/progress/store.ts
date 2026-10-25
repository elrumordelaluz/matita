import { chronological, type Attempt } from './attempt.ts'

// Dove vivono i tentativi. Il resto dell'app parla solo con questa
// interfaccia, così la persistenza si può cambiare senza toccare altro.
// Vedi SPEC.md, "Storage".

export interface ProgressStore {
  /** Tutti i tentativi, in ordine cronologico. */
  attempts(): Promise<Attempt[]>
  addAttempt(attempt: Attempt): Promise<void>
  /**
   * Aggiunge i tentativi in un colpo solo, sostituendo quelli con lo stesso
   * id: reimportare lo stesso backup non duplica nulla.
   */
  putAttempts(attempts: readonly Attempt[]): Promise<void>
}

export function createMemoryStore(): ProgressStore {
  const byId = new Map<string, Attempt>()
  return {
    async attempts() {
      return chronological([...byId.values()])
    },
    async addAttempt(attempt) {
      byId.set(attempt.id, attempt)
    },
    async putAttempts(attempts) {
      for (const a of attempts) byId.set(a.id, a)
    },
  }
}
