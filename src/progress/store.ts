import { chronological, type Attempt } from './attempt.ts'
import type { Known } from './known.ts'

// Dove vivono i tentativi e i segni di già saputo. Il resto dell'app parla
// solo con questa interfaccia, così la persistenza si può cambiare senza
// toccare altro. Vedi SPEC.md, "Storage".

export interface ProgressStore {
  /** Tutti i tentativi, in ordine cronologico. */
  attempts(): Promise<Attempt[]>
  addAttempt(attempt: Attempt): Promise<void>
  /**
   * Aggiunge i tentativi in un colpo solo, sostituendo quelli con lo stesso
   * id: reimportare lo stesso backup non duplica nulla.
   */
  putAttempts(attempts: readonly Attempt[]): Promise<void>
  /** Tutti i segni di già saputo, uno per abilità. */
  known(): Promise<Known[]>
  /** Aggiunge i segni, sostituendo quelli della stessa abilità. */
  putKnown(known: readonly Known[]): Promise<void>
  /** Toglie i segni di queste abilità; i tentativi restano. */
  removeKnown(skills: readonly string[]): Promise<void>
}

export function createMemoryStore(): ProgressStore {
  const byId = new Map<string, Attempt>()
  const bySkill = new Map<string, Known>()
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
    async known() {
      return [...bySkill.values()]
    },
    async putKnown(known) {
      for (const k of known) bySkill.set(k.skill, k)
    },
    async removeKnown(skills) {
      for (const skill of skills) bySkill.delete(skill)
    },
  }
}
