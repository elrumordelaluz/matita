import { generate } from '../../engine/index.ts'
import { chapterById } from '../chapters.ts'
import { Lesson, type LessonPart, type LessonProps } from './Lesson.tsx'

// La lezione del capitolo "Monomi": le lettere al posto dei numeri, il valore
// numerico di un'espressione letterale. Vedi SPEC.md, "Calcolo letterale".

const chapter = chapterById('mono')

const parts: readonly LessonPart[] = [
  {
    id: 'lezione-valore-numerico',
    title: 'Il valore numerico',
    note: 'il negativo va fra tonde: (−2)²',
    text: (
      <>
        <p>
          In un’espressione letterale le lettere stanno al posto dei numeri: 2a²
          vuol dire 2 per a per a. Fra un numero e una lettera, o fra due
          lettere, il segno di moltiplicazione non si scrive.
        </p>
        <p>
          Per trovare il valore numerico si scrive l’espressione con il numero
          al posto di ogni lettera, poi si calcola come sempre. Un numero
          negativo va fra tonde: per a = −2, a² diventa (−2)², che vale 4. Senza
          tonde sarebbe −2², cioè −4, e l’esponente toccherebbe solo il 2.
        </p>
      </>
    ),
    example: generate('mono.value', 36), // 2a² + 2a, per a = −2
    question: generate('mono.value', 7), // −5a³ − 3a², per a = −2
  },
  {
    id: 'lezione-forma-normale',
    title: 'La forma normale',
    note: 'un solo coefficiente, lettere diverse',
    text: (
      <>
        <p>
          Un monomio è un prodotto di numeri e di potenze di lettere. Il numero
          davanti è il coefficiente, le lettere con i loro esponenti sono la
          parte letterale. Il coefficiente 1 non si scrive: a²b vuol dire 1 ·
          a²b, e −a²b vuol dire −1 · a²b.
        </p>
        <p>
          Un monomio è in forma normale quando ha un solo coefficiente e ogni
          lettera una volta sola. Per arrivarci si moltiplicano i coefficienti
          e, lettera per lettera, si sommano gli esponenti, come nel prodotto di
          potenze con la stessa base: 5a²b · 5b²a³ = 25a⁵b³. L’ordine delle
          lettere non cambia il monomio; il libro le scrive in ordine
          alfabetico.
        </p>
      </>
    ),
    example: generate('mono.normal-form', 45), // 5a²b · 5b²a³
    question: generate('mono.normal-form', 1), // 6c⁴ca³
  },
]

export function MonomialsLesson({ onPractise }: LessonProps) {
  return (
    <Lesson
      chapter={chapter}
      heading={
        <>
          I{' '}
          <span className="underline decoration-pencil decoration-6 underline-offset-[6px]">
            monomi
          </span>
        </>
      }
      intro={
        <p>
          Una lettera può stare al posto di un numero che non si conosce, o di
          un numero qualsiasi. Con le lettere si calcola come con i numeri,
          seguendo le stesse regole. Qui si comincia dal valore numerico: dare
          un numero alle lettere e calcolare quanto vale l’espressione.
        </p>
      }
      parts={parts}
      practice={{
        skill: 'mono.value',
        text: 'Si comincia dal valore numerico di un’espressione letterale.',
      }}
      onPractise={onPractise}
    />
  )
}
