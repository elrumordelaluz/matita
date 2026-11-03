import { generate } from '../../engine/index.ts'
import { chapterById } from '../chapters.ts'
import { Lesson, type LessonPart, type LessonProps } from './Lesson.tsx'

// La lezione del capitolo "Polinomi": la somma algebrica di polinomi, con le
// parentesi precedute dal meno. Vedi SPEC.md, "Calcolo letterale".

const chapter = chapterById('poly')

const parts: readonly LessonPart[] = [
  {
    id: 'lezione-somma-polinomi',
    title: 'La somma di polinomi',
    note: 'dopo il meno, ogni termine cambia segno',
    text: (
      <>
        <p>
          Un polinomio è una somma di monomi, i suoi termini: 4y³ + 3y + 5 ha
          tre termini, e 5 è il termine noto. È in forma normale quando non ha
          termini simili. Un polinomio fra parentesi in forma normale non ha più
          niente da svolgere dentro: le parentesi cadono, e poi si sommano i
          simili.
        </p>
        <p>
          Dopo il più le parentesi cadono e basta. Dopo il meno cadono cambiando
          il segno di ogni termine, perché il meno vale per tutto il gruppo: 5a
          − (2a − b) = 5a − 2a + b. Cambia segno anche l’ultimo termine, quello
          che si dimentica più spesso.
        </p>
      </>
    ),
    example: generate('poly.add-sub', 9), // (−5x³ + 5x² + 9x + 6) − (8x² + 6x − 1)
    question: generate('poly.add-sub', 24), // y − (y² + 6y − 9)
  },
]

export function PolynomialsLesson({ onPractise }: LessonProps) {
  return (
    <Lesson
      chapter={chapter}
      heading={
        <>
          I{' '}
          <span className="underline decoration-pencil decoration-6 underline-offset-[6px]">
            polinomi
          </span>
        </>
      }
      intro={
        <p>
          Con i monomi si fanno somme che non sempre diventano un monomio: 3a +
          2b resta così, ed è un polinomio. Qui si impara a calcolare con i
          polinomi, a partire dalla somma, con le parentesi che cadono.
        </p>
      }
      parts={parts}
      practice={{
        skill: 'poly.add-sub',
        text: 'Si comincia dalla somma algebrica di polinomi.',
      }}
      onPractise={onPractise}
    />
  )
}
