import { Eye } from 'lucide-react'
import { useState } from 'react'
import type { Flashcard } from '../content/flashcards.ts'
import { flashcardGrades, type FlashcardGrade } from '../progress/flashcards.ts'
import { Formula } from './Formula.tsx'
import { Button, Panel } from './kit.tsx'

// Una flashcard in sessione: davanti la consegna e "Mostra", poi il dietro
// con i tre voti. Niente si scrive e il motore non controlla nulla.

const gradeLabels: Record<FlashcardGrade, string> = {
  again: 'Di nuovo',
  hard: 'Difficile',
  good: 'Bene',
}

/** Il testo di una carta: i pezzi fra `$…$` sono formule, il resto è testo. */
export function CardText({ text }: { text: string }) {
  return (
    <>
      {text
        .split('$')
        .map((part, i) =>
          i % 2 === 1 ? (
            <Formula key={i} tex={part} text={part} />
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
    </>
  )
}

export function FlashcardView({
  card,
  onGrade,
}: {
  card: Flashcard
  onGrade: (grade: FlashcardGrade) => void
}) {
  const [revealed, setRevealed] = useState(false)
  return (
    <Panel className="flex animate-rise flex-col gap-5 p-6 sm:p-8">
      <p className="max-w-prose text-2xl leading-snug">
        <CardText text={card.front} />
      </p>
      {revealed ? (
        <>
          <p className="max-w-prose border-t border-hair pt-5 text-xl leading-snug">
            <CardText text={card.back} />
          </p>
          <div className="flex flex-wrap gap-2">
            {flashcardGrades.map((grade) => (
              <Button
                key={grade}
                variant={grade === 'good' ? 'pencil' : 'ghost'}
                onClick={() => onGrade(grade)}
              >
                {gradeLabels[grade]}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <Button
          variant="primary"
          onClick={() => setRevealed(true)}
          icon={<Eye aria-hidden="true" className="size-4" />}
          className="self-start"
        >
          Mostra
        </Button>
      )}
    </Panel>
  )
}
