import { generate } from '../../engine/index.ts'
import { chapterById } from '../chapters.ts'
import { Lesson, type LessonPart, type LessonProps } from './Lesson.tsx'

// La lezione del capitolo "Espressioni in N".

const chapter = chapterById('n')

const parts: readonly LessonPart[] = [
  {
    id: 'lezione-ordine',
    title: 'Prima × e :, poi + e −',
    note: 'stesso tipo? da sinistra a destra',
    text: (
      <p>
        Moltiplicazioni e divisioni si svolgono prima di addizioni e
        sottrazioni. Fra operazioni dello stesso tipo si va da sinistra a
        destra, nell’ordine in cui compaiono. Sul quaderno si scrive una riga
        per ogni giro: prima tutti i × e i :, poi tutti i + e i −.
      </p>
    ),
    example: generate('n.order', 15), // 6 : 3 + 3 × 8
    question: generate('n.order', 8), // 14 + 10 : 2 × 3
  },
  {
    id: 'lezione-parentesi',
    title: 'Le parentesi',
    note: 'un solo numero? via le parentesi',
    text: (
      <p>
        Le parentesi cambiano l’ordine: quello che sta dentro si calcola per
        primo, con le stesse regole. Quando dentro resta un solo numero, le
        parentesi non servono più e si tolgono.
      </p>
    ),
    example: generate('n.parens', 29), // 1 + (7 + 8) × 3
    question: generate('n.parens', 41), // (12 − 8) : 2 + 5
  },
  {
    id: 'lezione-graffe',
    title: 'Tonde, quadre e graffe',
    note: '( ) dentro [ ] dentro { }',
    text: (
      <p>
        Quando le parentesi sono una dentro l’altra, le tonde stanno dentro, le
        quadre le contengono e le graffe stanno fuori. Si parte sempre dalle più
        interne. Una quadra resta una quadra anche quando le tonde sono sparite:
        le parentesi non cambiano tipo.
      </p>
    ),
    example: generate('n.brackets', 98), // [4 × (8 + 8) − 20] : 4 + 16
    question: generate('n.brackets', 72), // 4 × 11 − [20 : (3 + 7) + 12]
  },
]

export function NExpressionsLesson({ onPractise }: LessonProps) {
  return (
    <Lesson
      chapter={chapter}
      heading={
        <>
          Espressioni in{' '}
          <span className="underline decoration-pencil decoration-6 underline-offset-[6px]">
            N
          </span>
        </>
      }
      intro={
        <p>
          Un’espressione è una fila di numeri e operazioni. Per calcolarla
          bisogna sapere in che ordine svolgere le operazioni: se ognuno
          scegliesse il suo, la stessa espressione darebbe risultati diversi. Le
          regole sono poche e valgono sempre.
        </p>
      }
      parts={parts}
      practice={{
        skill: 'n.add-sub',
        text: 'Si comincia dalle addizioni e sottrazioni, poi si aggiunge il resto.',
      }}
      onPractise={onPractise}
    />
  )
}
