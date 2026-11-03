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
  {
    id: 'lezione-quadrato-binomio',
    title: 'Il quadrato di un binomio',
    note: 'A² + 2AB + B², il doppio prodotto in mezzo',
    text: (
      <>
        <p>
          Alcuni prodotti tornano così spesso che conviene sapere il risultato a
          memoria: sono i prodotti notevoli. Il primo è il quadrato di un
          binomio: (A + B)² = A² + 2AB + B². Il quadrato non si distribuisce sui
          termini: (A + B)² non è A² + B², manca il doppio prodotto 2AB.
        </p>
        <p>
          Sul quaderno la prima riga scrive la formula, con i termini del
          binomio al posto di A e B: (2x² + 3y)² = (2x²)² + 2 · 2x² · 3y +
          (3y)². Poi si calcola come sempre, prima le potenze e poi i prodotti.
          Con il meno, (A − B)² = A² − 2AB + B²: il meno va solo al doppio
          prodotto, perché un quadrato è sempre positivo.
        </p>
      </>
    ),
    example: generate('poly.square', 2), // (5a − 2b)²
    question: generate('poly.square', 0), // (2y − 3)²
  },
  {
    id: 'lezione-somma-per-differenza',
    title: 'Somma per differenza',
    note: 'A² − B², la differenza dei quadrati',
    text: (
      <p>
        La somma di due termini per la loro differenza è la differenza dei
        quadrati: (A + B)(A − B) = A² − B². Con la distributiva i due prodotti
        in mezzo, −AB e +AB, si annullano, e per questo non compaiono. Anche qui
        la prima riga scrive la formula: (3x + 2y)(3x − 2y) = (3x)² − (2y)², poi
        si calcolano le potenze.
      </p>
    ),
    example: generate('poly.sum-diff', 8), // (3x + 4)(3x − 4)
    question: generate('poly.sum-diff', 11), // (4a − 1)(4a + 1)
  },
  {
    id: 'lezione-altri-prodotti-notevoli',
    title: 'Trinomio al quadrato, binomio al cubo',
    note: 'la formula, poi i conti',
    text: (
      <>
        <p>
          Il quadrato di un trinomio è la somma dei quadrati dei tre termini e
          di tutti i doppi prodotti: (A + B + C)² = A² + B² + C² + 2AB + 2AC +
          2BC. Ogni termine entra con il suo segno: in (2x − y + 5)² B è −y, e
          il risultato è 4x² + y² + 25 − 4xy + 20x − 10y.
        </p>
        <p>
          Il cubo di un binomio ha quattro termini: (A + B)³ = A³ + 3A²B + 3AB²
          + B³. Con il meno i segni si alternano, (A − B)³ = A³ − 3A²B + 3AB² −
          B³. Come per il quadrato, la prima riga scrive la formula e le righe
          dopo fanno i conti.
        </p>
      </>
    ),
    example: generate('poly.more-notable', 13), // (y + 2)³
    question: generate('poly.more-notable', 8), // (2a − 3b + 4)²
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
