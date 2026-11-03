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
  {
    id: 'lezione-monomio-per-polinomio',
    title: 'Monomio per polinomio',
    note: 'il monomio moltiplica ogni termine',
    text: (
      <>
        <p>
          Per moltiplicare un monomio per un polinomio si usa la proprietà
          distributiva: il monomio moltiplica ogni termine, e i prodotti si
          sommano. 2xy(3y + 5x²) = 6xy² + 10x³y. Sul quaderno è un passaggio
          solo, dritto al risultato; aprendolo si vedono i prodotti uno per uno,
          ciascuno con la regola dei segni.
        </p>
        <p>
          Allo stesso modo un polinomio si divide per un monomio dividendo ogni
          termine: (12x⁴ − 8x³ + 4x²) : 4x² = 3x² − 2x + 1. Il quoziente è un
          polinomio solo se ogni termine si divide, cioè se ha tutte le lettere
          del divisore con esponente uguale o maggiore.
        </p>
      </>
    ),
    example: generate('poly.mono-times', 16), // 2a(2a² + b² − 3b)
    question: generate('poly.mono-times', 19), // −2x²(x + 3)
  },
  {
    id: 'lezione-polinomio-per-polinomio',
    title: 'Polinomio per polinomio',
    note: 'ogni termine per ogni termine, poi i simili',
    text: (
      <>
        <p>
          Fra due polinomi la distributiva si applica due volte: ogni termine
          del primo moltiplica ogni termine del secondo. Con due binomi i
          prodotti sono quattro: (x + 3y)(2x − 4y) = 2x² − 4xy + 6xy − 12y². Il
          libro a volte scrive prima x(2x − 4y) + 3y(2x − 4y); è il modo di
          contare i prodotti, e sul quaderno si va dritti ai quattro termini.
        </p>
        <p>
          Fra i prodotti ci sono spesso dei monomi simili, e la riga dopo li
          riduce: −4xy + 6xy = 2xy, quindi 2x² + 2xy − 12y².
        </p>
      </>
    ),
    example: generate('poly.times', 33), // (−4a + 5b)(5a + b)
    question: generate('poly.times', 11), // (2a + 2)(−2a + 3)
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
