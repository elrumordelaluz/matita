import { generate } from '../../engine/index.ts'
import { chapterById } from '../chapters.ts'
import { Lesson, type LessonPart, type LessonProps } from './Lesson.tsx'

// La lezione del capitolo "Espressioni in Q". Il quaderno scrive ogni conto
// fra frazioni come un passaggio solo, con il risultato già ridotto: la
// riduzione ai minimi termini, il minimo comune multiplo, la semplificazione
// in croce e il reciproco li spiega il testo. Vedi SPEC.md, "Risolutore".

const chapter = chapterById('q')

const parts: readonly LessonPart[] = [
  {
    id: 'lezione-minimi-termini',
    title: 'La riduzione ai minimi termini',
    note: 'dividi sopra e sotto per il MCD',
    text: (
      <p>
        Una frazione è ridotta ai minimi termini quando il massimo comune
        divisore (MCD) di numeratore e denominatore è 1. Per ridurla si dividono
        tutti e due per il loro MCD: in 12/18 il MCD è 6, e 12/18 = 2/3. Se il
        denominatore arriva a 1 resta un intero, e si scrive come intero: 6/3 =
        2. Il segno va davanti alla frazione, mai al denominatore: 2/−3 si
        scrive −2/3. Sul quaderno la riduzione non ha una riga sua: 5/3 + 4/3 fa
        9/3, e si scrive subito 3.
      </p>
    ),
    example: generate('q.add-sub', 17), // 1/3 + 4/3 + 4/3
    question: generate('q.mul-div', 89), // 2/3 × (−1/2)
  },
  {
    id: 'lezione-mcm',
    title: 'La somma con il minimo comune multiplo',
    note: 'stesso denominatore, poi i numeratori',
    text: (
      <p>
        Per sommare due frazioni si portano allo stesso denominatore, il minimo
        comune multiplo dei denominatori, e poi si sommano i numeratori: 1/4 +
        1/6 = 3/12 + 2/12 = 5/12. I denominatori non si sommano mai. I segni
        funzionano come in Z, e alla fine si riduce ai minimi termini.
      </p>
    ),
    example: generate('q.add-sub', 1), // 5/12 + (−1/4) − (−1/2)
    question: generate('q.add-sub', 37), // −4/3 − 5/6 − (−5/4)
  },
  {
    id: 'lezione-prodotto',
    title: 'Il prodotto e la semplificazione in croce',
    note: 'prima semplifica, poi moltiplica',
    text: (
      <p>
        Il prodotto di due frazioni ha per numeratore il prodotto dei numeratori
        e per denominatore il prodotto dei denominatori. Prima di moltiplicare
        conviene semplificare in croce: un numeratore e il denominatore
        dell’altra frazione si dividono per lo stesso fattore. In 4/9 × 9/8 il 9
        si semplifica con il 9 e il 4 con l’8: resta 1/2.
      </p>
    ),
    example: generate('q.mul-div', 28), // +4/9 × (−9/8)
    question: generate('q.mul-div', 21), // 5/4 × 3/10
  },
  {
    id: 'lezione-reciproco',
    title: 'La divisione per il reciproco',
    note: 'a/b : c/d = a/b × d/c',
    text: (
      <p>
        Dividere per una frazione vuol dire moltiplicare per il suo reciproco,
        la frazione con numeratore e denominatore scambiati: 9/8 : 3/2 = 9/8 ×
        2/3. Da lì si semplifica in croce e si moltiplica, come nel prodotto.
        Sul quaderno la divisione è un passaggio solo: il reciproco si scrive a
        margine o si fa a mente.
      </p>
    ),
    example: generate('q.mul-div', 51), // 9/8 : 3/2
    question: generate('q.mul-div', 17), // −2/5 : (−4/3)
  },
  {
    id: 'lezione-espressioni-q',
    title: 'Le espressioni con le frazioni',
    note: 'le regole non cambiano',
    text: (
      <p>
        Nelle espressioni con le frazioni valgono le regole di sempre: prima le
        parentesi più interne, poi × e :, poi + e −, con i segni di Z. Un intero
        è una frazione con denominatore 1: 3 = 3/1. Il risultato si scrive
        ridotto, con il segno davanti alla frazione.
      </p>
    ),
    example: generate('q.brackets', 6), // −5/4 + (−2) × (−2/3 + 1/4)
    question: generate('q.brackets', 24), // 3 − (2/3 − (−5/6))
  },
]

export function QExpressionsLesson({ onPractise }: LessonProps) {
  return (
    <Lesson
      chapter={chapter}
      heading={
        <>
          Espressioni in{' '}
          <span className="underline decoration-pencil decoration-6 underline-offset-[6px]">
            Q
          </span>
        </>
      }
      intro={
        <p>
          In Z la divisione 3 : 4 non dava un intero. In Q sì: 3 : 4 = 3/4.
          L’ordine delle operazioni e la regola dei segni restano quelli che
          conosci; cambiano i conti, che adesso sono fra frazioni. Un risultato
          con il valore giusto ma scritto in un’altra forma, come 4/6 invece di
          2/3, non è sbagliato: va riscritto.
        </p>
      }
      parts={parts}
      practice={{
        skill: 'q.add-sub',
        text: 'Si comincia dalla somma di frazioni, poi arrivano prodotti, quozienti e parentesi.',
      }}
      onPractise={onPractise}
    />
  )
}
