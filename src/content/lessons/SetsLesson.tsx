import { generate } from '../../engine/index.ts'
import { chapterById } from '../chapters.ts'
import { Lesson, type LessonPart, type LessonProps } from './Lesson.tsx'

// La lezione del capitolo "Insiemi", con la notazione di Matematica C3. Gli
// insiemi sono di naturali; la risposta si scrive per elencazione, in un
// ordine qualsiasi. Vedi SPEC.md, "Insiemi".

const chapter = chapterById('set')

const parts: readonly LessonPart[] = [
  {
    id: 'lezione-rappresentazioni',
    title: 'Tre modi di scrivere un insieme',
    note: 'l’ordine non conta, ogni elemento una volta',
    text: (
      <>
        <p>
          Un insieme si scrive per elencazione, con gli elementi fra graffe
          separati da virgole: {'{1, 3, 5}'}. L’ordine non conta, {'{1, 3, 5}'}{' '}
          e {'{5, 1, 3}'} sono lo stesso insieme, e ogni elemento si scrive una
          volta sola. L’insieme vuoto, che non ha elementi, si scrive ∅ oppure{' '}
          {'{}'}.
        </p>
        <p>
          Lo stesso insieme si può dare per proprietà caratteristica, con la
          condizione a parole: {'{x ∈ N | 5 < x ≤ 11}'} si legge “gli x di N
          tali che x è maggiore di 5 e minore o uguale a 11”. Il terzo modo è il
          diagramma di Eulero-Venn, una linea chiusa con gli elementi dentro.
        </p>
      </>
    ),
    example: generate('set.roster', 3), // {x ∈ N | 5 < x ≤ 11}
    question: generate('set.roster', 23), // {x ∈ N | 1 < x ≤ 5}
  },
  {
    id: 'lezione-elencazione',
    title: 'Dalla proprietà all’elencazione',
    note: '< lascia fuori l’estremo, ≤ lo tiene',
    text: (
      <p>
        Per elencare un insieme dato per proprietà si passano i naturali in
        ordine, dallo zero, e si tengono quelli che rispettano la condizione.
        Attenzione agli estremi: x {'<'} 6 lascia fuori il 6, x ≤ 6 lo
        comprende. Lo zero è un naturale, N = {'{0, 1, 2, …}'}, ed è pari: 0 = 2
        × 0. Per la stessa ragione è multiplo di ogni numero.
      </p>
    ),
    example: generate('set.roster', 12), // {x ∈ N | x ≤ 6 e x è pari}
    question: generate('set.roster', 17), // {x ∈ N | x < 10 e x è pari}
  },
  {
    id: 'lezione-appartenenza-inclusione',
    title: 'Appartenenza e inclusione',
    note: 'un numero ∈, un insieme ⊂',
    text: (
      <>
        <p>
          Un numero appartiene a un insieme o non gli appartiene: 2 ∈ A, 3 ∉ A.
          Fra due insiemi si parla invece di inclusione: {'{2}'} ⊂ A vuol dire
          che ogni elemento di {'{2}'} sta in A e che A ne ha altri. È un
          sottoinsieme proprio. Se un elemento esce da A si scrive ⊄.
        </p>
        <p>
          Due insiemi con gli stessi elementi sono uguali, anche scritti in un
          altro ordine: ogni insieme è sottoinsieme improprio di sé stesso, e si
          scrive =. Il simbolo ⊆ si usa quando non si sa se i due insiemi
          coincidono; qui lo si sa sempre, quindi si sceglie fra ⊂ e =.
        </p>
      </>
    ),
    example: generate('set.relations', 5), // A = {2, 7, 8, 10}
    question: generate('set.relations', 17), // A = {1, 2, 6, 8}
  },
  {
    id: 'lezione-unione-intersezione',
    title: 'Unione e intersezione',
    note: '∪ in almeno uno, ∩ in tutti e due',
    text: (
      <p>
        L’unione A ∪ B ha gli elementi che stanno in A o in B, almeno in uno dei
        due, scritti una volta sola. L’intersezione A ∩ B ha solo quelli che
        stanno in tutti e due; se non ce ne sono è ∅, e A e B si dicono
        disgiunti. Fra ∪ e ∩ non c’è un ordine delle operazioni: con più di
        un’operazione le parentesi dicono da dove cominciare, e si parte dalla
        più interna.
      </p>
    ),
    example: generate('set.operations', 21), // (A ∪ B) ∩ C
    question: generate('set.operations', 12), // A ∩ B
  },
  {
    id: 'lezione-differenza-complementare',
    title: 'Differenza e complementare',
    note: 'A − B: di A, ma non di B',
    text: (
      <p>
        La differenza A − B ha gli elementi di A che non stanno in B. Non è
        commutativa: B − A è un altro insieme. Quando tutti gli insiemi stanno
        dentro un universo U, il complementare di A, Ā, ha gli elementi di U che
        non stanno in A: Ā = U − A. Per questo l’esercizio dice sempre chi è U.
      </p>
    ),
    example: generate('set.operations', 20), // Ā ∩ B
    question: generate('set.operations', 9), // A − B
  },
  {
    id: 'lezione-parti-prodotto',
    title: 'Insieme delle parti e prodotto cartesiano',
    note: 'card(℘(A)) = 2ⁿ, card(A × B) = card(A) × card(B)',
    text: (
      <>
        <p>
          L’insieme delle parti ℘(A) ha per elementi tutti i sottoinsiemi di A,
          compresi ∅ e A stesso: ℘({'{1, 2}'}) = {'{∅, {1}, {2}, {1, 2}}'}. Ogni
          elemento di A può stare in un sottoinsieme o restarne fuori, due
          scelte per elemento: con n elementi i sottoinsiemi sono 2ⁿ.
        </p>
        <p>
          Il prodotto cartesiano A × B ha per elementi le coppie ordinate (a; b)
          con a in A e b in B: se A = {'{1, 2}'} e B = {'{5, 6, 7}'}, le coppie
          sono (1; 5), (1; 6), (1; 7), (2; 5), (2; 6), (2; 7). Ogni elemento di
          A fa coppia con ogni elemento di B, quindi le coppie sono card(A) ×
          card(B) = 2 × 3 = 6. Negli esercizi non si elencano: si contano.
        </p>
      </>
    ),
    example: generate('set.parts-product', 0), // A = {3, 4, 9}: card(℘(A))
    question: generate('set.parts-product', 13), // card(A × B)
  },
  {
    id: 'lezione-venn-due',
    title: 'Problemi con due insiemi',
    note: 'card(A ∪ B) = card(A) + card(B) − card(A ∩ B)',
    text: (
      <>
        <p>
          Un problema dà alcuni numeri e ne chiede un altro. Si disegnano due
          cerchi dentro un rettangolo, l’universo: il diagramma ha quattro
          regioni, solo A, solo B, entrambi e nessuno, fuori dai cerchi. Si
          riempie una regione alla volta, ogni volta con un conto che ha una
          sola incognita: prima l’intersezione, poi solo A, solo B, l’esterno.
        </p>
        <p>
          Attenzione a chi sta in tutti e due: in card(A) + card(B) è contato
          due volte, quindi chi sta in almeno uno dei due è card(A) + card(B) −
          card(A ∩ B). “Solo A” non è “almeno A”, e chi non sta in nessuno dei
          due è il totale meno chi sta in almeno uno.
        </p>
      </>
    ),
    example: generate('set.venn2', 1), // 50 studenti, 9 nessuna lingua
    question: generate('set.venn2', 5), // quanti nessuna lingua?
  },
]

export function SetsLesson({ onPractise }: LessonProps) {
  return (
    <Lesson
      chapter={chapter}
      heading={
        <>
          Gli{' '}
          <span className="underline decoration-pencil decoration-6 underline-offset-[6px]">
            insiemi
          </span>
        </>
      }
      intro={
        <p>
          Un insieme è una raccolta di oggetti scelti con un criterio preciso:
          di ogni oggetto si deve poter dire se ci sta o no. Qui gli oggetti
          sono numeri naturali. Si scrive un insieme con una lettera maiuscola,
          A, e si dice che 3 appartiene ad A, 3 ∈ A, quando 3 è uno dei suoi
          elementi.
        </p>
      }
      parts={parts}
      practice={{
        skill: 'set.roster',
        text: 'Si comincia dall’elencazione: dalla proprietà caratteristica agli elementi.',
      }}
      onPractise={onPractise}
    />
  )
}
