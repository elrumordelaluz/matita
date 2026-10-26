import { generate } from '../../engine/index.ts'
import { chapterById } from '../chapters.ts'
import { Lesson, type LessonPart, type LessonProps } from './Lesson.tsx'

// La lezione del capitolo "Espressioni in Z".

const chapter = chapterById('z')

const parts: readonly LessonPart[] = [
  {
    id: 'lezione-somma-algebrica',
    title: 'La somma algebrica',
    note: '+ (−3) è − 3, − (−3) è + 3',
    text: (
      <p>
        In Z addizione e sottrazione diventano una cosa sola, la somma
        algebrica. Sommare un negativo vuol dire togliere: 5 + (−3) = 5 − 3.
        Togliere un negativo vuol dire sommare: 5 − (−3) = 5 + 3. Poi si va da
        sinistra a destra, come in N. Due negativi insieme restano negativi: −3
        − 4 = −7.
      </p>
    ),
    example: generate('z.add-sub', 7), // −3 + (−1) − (−6)
    question: generate('z.add-sub', 6), // −4 + (−6) + (+2)
  },
  {
    id: 'lezione-regola-segni',
    title: 'La regola dei segni',
    note: 'segni uguali +, segni diversi −',
    text: (
      <p>
        Nel prodotto e nel quoziente il valore si calcola come in N, poi si
        decide il segno: due segni uguali danno più, due segni diversi danno
        meno. Con più fattori si va da sinistra a destra, un segno alla volta.
        In mezzo all’espressione un numero relativo sta fra tonde, così il suo
        segno non si confonde con l’operazione.
      </p>
    ),
    example: generate('z.mul-div', 23), // −10 : (−5) × (−7)
    question: generate('z.mul-div', 21), // −5 × (+9) × (−2)
  },
  {
    id: 'lezione-meno-parentesi',
    title: 'Il meno davanti alla parentesi',
    note: '−(−6) = +6, −(+6) = −6',
    text: (
      <p>
        Il meno davanti a una parentesi vale per tutto quello che c’è dentro.
        Sul quaderno si calcola prima la parentesi; quando dentro resta un
        numero solo, il meno ne cambia il segno. Se invece togli subito le
        parentesi, devi cambiare il segno di ogni termine: −(−7 + 1) diventa +7
        − 1.
      </p>
    ),
    example: generate('z.minus-group', 16), // −(−7 + 1) + 2
    question: generate('z.minus-group', 13), // 6 − (−1 + (−1))
  },
  {
    id: 'lezione-graffe-z',
    title: 'Tonde, quadre e graffe',
    note: 'un negativo resta fra tonde',
    text: (
      <p>
        Con le parentesi una dentro l’altra valgono le regole del primo
        capitolo: si parte dal gruppo più interno. Quando un gruppo dà un numero
        negativo le sue parentesi cadono, ma il numero resta fra tonde perché ha
        il segno: 5 − (3 − 7) diventa 5 − (−4).
      </p>
    ),
    example: generate('z.brackets', 8), // 7 − [−2 × (−5 − (−1)) − (−6)]
    question: generate('z.brackets', 51), // −2 − [−4 − (−8 + 1)]
  },
]

export function ZExpressionsLesson({ onPractise }: LessonProps) {
  return (
    <Lesson
      chapter={chapter}
      heading={
        <>
          Espressioni in{' '}
          <span className="underline decoration-pencil decoration-6 underline-offset-[6px]">
            Z
          </span>
        </>
      }
      intro={
        <p>
          In N il conto 3 − 7 non si poteva fare. In Z sì: ogni numero ha un
          segno, e 3 − 7 = −4. L’ordine delle operazioni resta quello del primo
          capitolo. Cambiano i conti, con due regole nuove: la regola dei segni
          e il meno davanti alla parentesi.
        </p>
      }
      parts={parts}
      practice={{
        skill: 'z.add-sub',
        text: 'Si comincia dalla somma algebrica, poi arrivano i prodotti e le parentesi.',
      }}
      onPractise={onPractise}
    />
  )
}
