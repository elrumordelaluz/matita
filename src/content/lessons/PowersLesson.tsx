import { generate } from '../../engine/index.ts'
import { chapterById } from '../chapters.ts'
import { Lesson, type LessonPart, type LessonProps } from './Lesson.tsx'

// La lezione del capitolo "Potenze". Per ora con basi naturali: la potenza,
// il suo posto nell'ordine delle operazioni e le proprietà.

const chapter = chapterById('pow')

const parts: readonly LessonPart[] = [
  {
    id: 'lezione-potenza',
    title: 'La potenza',
    note: '2³ = 2 × 2 × 2, non 2 × 3',
    text: (
      <p>
        Una potenza è un prodotto di fattori tutti uguali. La base dice quale
        fattore, l’esponente quante volte: 2³ = 2 × 2 × 2 = 8. Base ed esponente
        non si moltiplicano fra loro. Una potenza con esponente 1 vale quanto la
        base, e 1 elevato a qualunque esponente resta 1.
      </p>
    ),
    example: generate('pow.basics', 1), // 6² : 3 + 15
    question: generate('pow.basics', 7), // 2⁶
  },
  {
    id: 'lezione-prima-le-potenze',
    title: 'Prima le potenze',
    note: 'potenze, poi × e :, poi + e −',
    text: (
      <p>
        In un’espressione le potenze si calcolano per prime, prima di × e :.
        Quando la base è una parentesi, prima si svolge la parentesi e poi si
        eleva il risultato: (9 − 5)² è 4², non 9² − 5².
      </p>
    ),
    example: generate('pow.basics', 58), // 9 + (9 − 5)² × 6
    question: generate('pow.basics', 16), // 8² + (9 − 5)²
  },
  {
    id: 'lezione-stessa-base',
    title: 'Stessa base',
    note: 'stessa base: × somma, : sottrae',
    text: (
      <p>
        Fra potenze con la stessa base non serve calcolare tutto. Nel prodotto
        la base resta e gli esponenti si sommano: 2⁵ × 2³ = 2⁸, perché sono
        cinque fattori 2 seguiti da altri tre. Nel quoziente gli esponenti si
        sottraggono: 2⁸ : 2⁶ = 2². Sul quaderno le proprietà vanno in una riga
        sola, prima di calcolare la potenza che resta.
      </p>
    ),
    example: generate('pow.properties', 0), // 2⁵ × 2⁶ : 2⁹
    question: generate('pow.properties', 27), // 2⁴ × 2³ : 2⁵
  },
  {
    id: 'lezione-potenza-di-potenza',
    title: 'Potenza di potenza',
    note: '(aᵐ)ⁿ: gli esponenti si moltiplicano',
    text: (
      <p>
        Una potenza elevata a sua volta si scrive con la base fra parentesi. Gli
        esponenti si moltiplicano: (3²)³ = 3² × 3² × 3² = 3⁶. Non si sommano: 3⁵
        è un’altra cosa.
      </p>
    ),
    example: generate('pow.properties', 59), // (3²)³ : 3⁴
    question: generate('pow.properties', 15), // (3²)³ : 3³
  },
  {
    id: 'lezione-stesso-esponente',
    title: 'Stesso esponente',
    note: 'stesso esponente: si lavora sulle basi',
    text: (
      <p>
        Quando le basi sono diverse ma l’esponente è lo stesso, si moltiplicano
        o si dividono le basi e l’esponente resta: 6³ : 2³ = 3³, 2² × 5² = 10².
        Conviene quando le basi danno un numero comodo.
      </p>
    ),
    example: generate('pow.properties', 34), // 15³ : 5³
    question: generate('pow.properties', 74), // 2² × 5²
  },
  // Le parti che arrivano con le basi negative e le frazioni, quando il
  // motore le avrà:
  // - −3² e (−3)²: il meno fuori dalla potenza e la base negativa;
  // - l'esponente zero: a⁰ = 1, da a³ : a³;
  // - l'esponente negativo: a⁻ⁿ è il reciproco di aⁿ.
]

export function PowersLesson({ onPractise }: LessonProps) {
  return (
    <Lesson
      chapter={chapter}
      heading={
        <>
          Le{' '}
          <span className="underline decoration-pencil decoration-6 underline-offset-[6px]">
            potenze
          </span>
        </>
      }
      intro={
        <p>
          Scrivere 2 × 2 × 2 × 2 × 2 è lungo, e con tanti fattori si sbaglia a
          contarli. La potenza lo scrive in breve: 2⁵. Qui si impara a
          calcolarla, a metterla al suo posto in un’espressione e a lavorare con
          le potenze senza calcolarle, grazie alle loro proprietà.
        </p>
      }
      parts={parts}
      practice={{
        skill: 'pow.basics',
        text: 'Si comincia dal calcolo delle potenze, poi si passa alle proprietà.',
      }}
      onPractise={onPractise}
    />
  )
}
