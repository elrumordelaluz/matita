import type { ReactNode } from 'react'
import { generate, type GeneratedSkill } from '../../engine/index.ts'
import { CheckQuestion } from '../../ui/CheckQuestion.tsx'
import { WorkedExample } from '../../ui/WorkedExample.tsx'

// La lezione del capitolo "Espressioni in N". Esempi e domande vengono dai
// generatori con un seme fisso, così la lezione mostra le stesse righe che lo
// studente vedrà nella soluzione di un esercizio. Vedi SPEC.md, "Lezioni".

const firstSkill: GeneratedSkill = 'n.add-sub'

const examples = {
  order: generate('n.order', 15), // 6 : 3 + 3 × 8
  parens: generate('n.parens', 29), // 1 + (7 + 8) × 3
  brackets: generate('n.brackets', 98), // [4 × (8 + 8) − 20] : 4 + 16
}

const questions = {
  order: generate('n.order', 8), // 14 + 10 : 2 × 3
  parens: generate('n.parens', 41), // (12 − 8) : 2 + 5
  brackets: generate('n.brackets', 72), // 4 × 11 − [20 : (3 + 7) + 12]
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      {children}
    </section>
  )
}

export function NExpressionsLesson({
  onPractise,
}: {
  onPractise: (skill: GeneratedSkill) => void
}) {
  return (
    <article className="space-y-10 leading-relaxed">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Espressioni in N</h2>
        <p>
          Un’espressione è una fila di numeri e operazioni. Per calcolarla
          bisogna sapere in che ordine svolgere le operazioni: se ognuno
          scegliesse il suo, la stessa espressione darebbe risultati diversi. Le
          regole sono poche e valgono sempre.
        </p>
      </header>

      <Section title="Prima × e :, poi + e −">
        <p>
          Moltiplicazioni e divisioni si svolgono prima di addizioni e
          sottrazioni. Fra operazioni dello stesso tipo si va da sinistra a
          destra, nell’ordine in cui compaiono. Sul quaderno si scrive una riga
          per ogni giro: prima tutti i × e i :, poi tutti i + e i −.
        </p>
        <WorkedExample exercise={examples.order} />
        <CheckQuestion exercise={questions.order} />
      </Section>

      <Section title="Le parentesi">
        <p>
          Le parentesi cambiano l’ordine: quello che sta dentro si calcola per
          primo, con le stesse regole. Quando dentro resta un solo numero, le
          parentesi non servono più e si tolgono.
        </p>
        <WorkedExample exercise={examples.parens} />
        <CheckQuestion exercise={questions.parens} />
      </Section>

      <Section title="Tonde, quadre e graffe">
        <p>
          Quando le parentesi sono una dentro l’altra, le tonde stanno dentro,
          le quadre le contengono e le graffe stanno fuori. Si parte sempre
          dalle più interne. Una quadra resta una quadra anche quando le tonde
          sono sparite: le parentesi non cambiano tipo.
        </p>
        <WorkedExample exercise={examples.brackets} />
        <CheckQuestion exercise={questions.brackets} />
      </Section>

      <footer className="border-t border-hair pt-6">
        <p className="mb-4">
          Si comincia dalle addizioni e sottrazioni, poi si aggiunge il resto.
        </p>
        <button
          type="button"
          onClick={() => onPractise(firstSkill)}
          className="rounded bg-ink px-4 py-2 text-paper"
        >
          Inizia la pratica
        </button>
      </footer>
    </article>
  )
}
