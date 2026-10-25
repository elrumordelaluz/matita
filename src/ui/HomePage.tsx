import { useEffect, useState } from 'react'
import type { Skill } from '../content/skills.ts'
import { dueReviews } from '../progress/review.ts'
import { composeSession, type SessionItem } from '../progress/session.ts'
import type { ProgressStore } from '../progress/store.ts'
import { canPractise } from './exercises.ts'

// La pagina iniziale: quanti ripassi aspettano e il pulsante per la sessione.

interface Plan {
  readonly due: number
  readonly session: SessionItem[]
}

function pendingText(due: number): string {
  if (due === 0) return 'Nessun ripasso in attesa.'
  if (due === 1) return '1 ripasso in attesa.'
  return `${due} ripassi in attesa.`
}

export function HomePage({
  store,
  skills,
  onStart,
}: {
  store: ProgressStore
  skills: readonly Skill[]
  onStart: (session: SessionItem[]) => void
}) {
  const [plan, setPlan] = useState<Plan | null>(null)

  useEffect(() => {
    let live = true
    void store.attempts().then((attempts) => {
      if (!live) return
      const now = new Date()
      setPlan({
        due: dueReviews(attempts, now).filter(canPractise).length,
        session: composeSession({ graph: skills, attempts, now, canPractise }),
      })
    })
    return () => {
      live = false
    }
  }, [store, skills])

  if (!plan) return null

  return (
    <section className="space-y-4">
      <p>{pendingText(plan.due)}</p>
      {plan.session.length === 0 && (
        <p className="text-dim">
          Per oggi non c’è altro da allenare: torna quando scade un ripasso.
        </p>
      )}
      <button
        type="button"
        onClick={() => onStart(plan.session)}
        disabled={plan.session.length === 0}
        className="rounded bg-ink px-4 py-2 text-paper disabled:opacity-40"
      >
        Inizia la sessione
      </button>
    </section>
  )
}
