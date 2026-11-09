import { chronological, type Attempt } from './attempt.ts'
import type { FlashcardReview, Introduced } from './flashcards.ts'
import type { Known } from './known.ts'

// Dove vivono i tentativi, i segni di già saputo, le introduzioni e i voti
// delle flashcard. Il resto dell'app parla
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
  /** Tutte le introduzioni delle flashcard, una per carta. */
  introduced(): Promise<Introduced[]>
  /** Aggiunge le introduzioni; per la stessa carta resta la data più antica. */
  putIntroduced(introduced: readonly Introduced[]): Promise<void>
  /** Tutti i voti alle flashcard, in ordine cronologico. */
  flashcardReviews(): Promise<FlashcardReview[]>
  /** Aggiunge i voti, sostituendo quelli con la stessa carta e data. */
  putFlashcardReviews(reviews: readonly FlashcardReview[]): Promise<void>
}

export function createMemoryStore(): ProgressStore {
  const byId = new Map<string, Attempt>()
  const bySkill = new Map<string, Known>()
  const byCard = new Map<string, Introduced>()
  const byCardAt = new Map<string, FlashcardReview>()
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
    async introduced() {
      return [...byCard.values()]
    },
    async putIntroduced(introduced) {
      for (const i of introduced) {
        const held = byCard.get(i.card)
        if (!held || i.introducedAt < held.introducedAt) byCard.set(i.card, i)
      }
    },
    async flashcardReviews() {
      return [...byCardAt.values()].sort((a, b) => a.at - b.at)
    },
    async putFlashcardReviews(reviews) {
      for (const r of reviews) byCardAt.set(JSON.stringify([r.card, r.at]), r)
    },
  }
}
