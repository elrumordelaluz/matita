import { generate } from '../../engine/index.ts'
import { chapterById } from '../chapters.ts'
import { Lesson, type LessonPart, type LessonProps } from './Lesson.tsx'

// La lezione del capitolo "Potenze": la potenza, il suo posto nell'ordine
// delle operazioni, il meno davanti alla potenza, le proprietà, l'esponente
// zero e negativo.

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
    question: generate('pow.basics', 66), // 4³
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
    question: generate('pow.basics', 11), // (10 − 6)³ − 13
  },
  {
    id: 'lezione-meno-e-potenza',
    title: '−3² e (−3)²',
    note: 'l’esponente è di chi lo tocca',
    text: (
      <p>
        L’esponente vale per quello che ha subito a sinistra. In (−3)² tocca la
        parentesi, quindi si eleva −3: (−3) × (−3) = 9. In −3² tocca solo il 3:
        prima si calcola 3² = 9, poi il meno resta davanti, −9. Con una base
        negativa la regola dei segni decide: esponente pari, risultato positivo;
        esponente dispari, negativo.
      </p>
    ),
    example: generate('pow.basics', 175), // −9² + (−3)²
    question: generate('pow.basics', 258), // −6² + 8 − (−3)²
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
  {
    id: 'lezione-esponente-zero',
    title: 'Esponente zero',
    note: 'a⁰ = 1, se a non è zero',
    text: (
      <p>
        Che cosa vuol dire 5⁰? La proprietà del quoziente lo dice: 5³ : 5³ = 5⁰,
        ma un numero diviso per sé stesso fa 1. Per questo ogni potenza con
        esponente zero vale 1, qualunque sia la base, purché non sia zero: 0⁰
        non ha significato.
      </p>
    ),
    example: generate('pow.zero-negative', 19), // (−5/3)⁰ + 4⁴ : 4⁴
    question: generate('pow.zero-negative', 8), // (−3)⁰ + 1/4
  },
  {
    id: 'lezione-esponente-negativo',
    title: 'Esponente negativo',
    note: 'a⁻ⁿ = 1/aⁿ: il reciproco',
    text: (
      <p>
        Anche l’esponente negativo nasce dal quoziente: 2³ : 2⁵ = 2⁻², e 8 : 32
        = 1/4. Un esponente negativo chiede il reciproco della base, elevato
        all’esponente positivo: 2⁻² = (1/2)² = 1/4, (2/3)⁻² = (3/2)² = 9/4. Il
        segno della potenza non cambia: 2⁻³ è 1/8, non −8.
      </p>
    ),
    example: generate('pow.zero-negative', 3), // 2³ × 2⁻⁵ − (3/2)⁻¹
    question: generate('pow.zero-negative', 15), // (2/3)⁻²
  },
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
          calcolarla, anche con basi negative e frazioni, a metterla al suo
          posto in un’espressione e a lavorare con le potenze senza calcolarle,
          grazie alle loro proprietà. Alla fine l’esponente può essere zero, o
          negativo.
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
