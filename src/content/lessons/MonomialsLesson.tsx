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
  {
    id: 'lezione-somma-monomi',
    title: 'La somma di monomi',
    note: 'si sommano solo i simili',
    text: (
      <>
        <p>
          Due monomi sono simili quando hanno la stessa parte letterale: 3a²b e
          −5a²b lo sono, 3a²b e 3ab² no. La somma di monomi simili è un monomio
          simile a loro: si sommano i coefficienti e la parte letterale resta,
          9x + 5x − 10x + x = 5x. Attenzione a x: il suo coefficiente è 1, e
          quello di −x è −1.
        </p>
        <p>
          In una somma i simili si cercano anche lontani. Sul quaderno ogni
          gruppo di simili diventa un termine solo, al posto del primo, e i
          monomi che non hanno simili restano come sono: 3a + 2b non si riduce.
        </p>
      </>
    ),
    example: generate('mono.add-sub', 36), // −x² + xy + x²y + 4x² − 9xy
    question: generate('mono.add-sub', 6), // 2x − x + 9x
  },
  {
    id: 'lezione-prodotto-quoziente',
    title: 'Prodotto e quoziente',
    note: 'coefficienti fra loro, esponenti sommati o sottratti',
    text: (
      <>
        <p>
          Il prodotto di due monomi è un monomio: si moltiplicano i coefficienti
          e si sommano gli esponenti della stessa lettera. Nel quoziente i
          coefficienti si dividono e gli esponenti si sottraggono: 4a²b³ : 2b² =
          2a²b. Ogni operazione fra due monomi è un passaggio solo, e × e :
          vanno da sinistra a destra come con i numeri.
        </p>
        <p>
          Il quoziente però non è sempre un monomio. In 10a³b : 2a⁴ la a del
          divisore ha l’esponente più grande: verrebbe a⁻¹, e un monomio ha solo
          esponenti naturali. Il quoziente è un monomio solo quando il dividendo
          ha tutte le lettere del divisore, con esponente uguale o maggiore.
        </p>
      </>
    ),
    example: generate('mono.mul-div', 0), // 3x · 5xy² : 2y
    question: generate('mono.mul-div', 8), // 4a³b³ · a⁴
  },
  {
    id: 'lezione-potenza-monomio',
    title: 'La potenza di un monomio',
    note: 'si eleva tutto: coefficiente, segno, lettere',
    text: (
      <p>
        Per elevare un monomio si eleva il coefficiente, con il suo segno, e si
        moltiplica ogni esponente per l’esponente della potenza: (−3a²)³ =
        −27a⁶. Come con i numeri, un esponente pari rende positivo il risultato:
        (−3a³)² = 9a⁶. Il meno davanti alla parentesi resta fuori: −(−3a³)³ =
        −(−27a⁹) = 27a⁹. Sul quaderno la potenza è un passaggio solo, prima di ×
        e :.
      </p>
    ),
    example: generate('mono.power', 7), // (−3b³a²)² · (−2a²b³)
    question: generate('mono.power', 20), // (−3x²y³)²
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
