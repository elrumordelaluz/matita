import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { ChapterId } from '../content/chapters.ts'
import { skills } from '../content/skills.ts'
import { parseExpression, rationalToText, solve } from '../engine/index.ts'
import type { QueueItem } from '../progress/queue.ts'
import type { SessionItem } from '../progress/session.ts'
import type { Flashcard } from '../content/flashcards.ts'
import type { FlashcardGrade } from '../progress/flashcards.ts'
import { SessionPage, type SessionSnapshot } from './SessionPage.tsx'

// Il registro finto ha solo la lezione del primo capitolo: gli altri capitoli
// servono al caso dell'abilità nuova senza lezione, come in LessonPage.test.
vi.mock('../content/lessons/index.ts', () => ({
  lessons: { n: () => null },
}))

const cards: Flashcard[] = [
  {
    id: 'pow.zero',
    chapter: 'pow',
    front: String.raw`$a^0 = {}$?`,
    back: String.raw`$1$, con $a \ne 0$.`,
  },
  {
    id: 'n.order',
    chapter: 'n',
    front: 'In che ordine?',
    back: 'Prima per e diviso.',
  },
]
const card = (id: string): QueueItem => ({ kind: 'flashcard', card: id })

const item = (skill: string, reason: SessionItem['reason']): QueueItem => ({
  kind: 'exercise',
  item: { skill, reason },
})

function renderSession(
  items: readonly QueueItem[],
  {
    onOpenLesson = () => {},
    onFlashcardReview = () => {},
    resume,
  }: {
    onFlashcardReview?: (review: {
      card: string
      grade: FlashcardGrade
    }) => void
    onOpenLesson?: (chapter: ChapterId, snapshot: SessionSnapshot) => void
    resume?: SessionSnapshot
  } = {},
) {
  return render(
    <SessionPage
      items={items}
      skills={skills}
      flashcards={cards}
      onFlashcardReview={onFlashcardReview}
      onAttempt={() => {}}
      onDone={() => {}}
      onOpenLesson={onOpenLesson}
      {...(resume === undefined ? {} : { resume })}
    />,
  )
}

// Risponde giusto all'esercizio sullo schermo, leggendolo dal nome
// accessibile della formula.
function answerCorrectly() {
  const shown = screen.getAllByRole('math')[0]?.getAttribute('aria-label')
  const result = solve(parseExpression(shown ?? '')).result
  fireEvent.change(screen.getByLabelText('Risultato'), {
    target: { value: rationalToText(result) },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
}

test('alla prima voce nuova di un’abilità, il cancello al posto dell’esercizio', () => {
  renderSession([item('n.add-sub', 'new'), item('n.mul-div', 'new')])
  expect(screen.getByText('Esercizio 1 di 2')).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Addizioni e sottrazioni' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/È un’abilità nuova/)).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Leggi la lezione' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Inizia l’esercizio' }),
  ).toBeInTheDocument()
  expect(screen.queryByLabelText('Risultato')).not.toBeInTheDocument()
})

test('«Inizia l’esercizio» mostra l’esercizio, e il cancello non torna', () => {
  renderSession([
    item('n.add-sub', 'new'),
    item('n.add-sub', 'new'),
    item('n.mul-div', 'new'),
  ])
  fireEvent.click(screen.getByRole('button', { name: 'Inizia l’esercizio' }))
  expect(screen.getByLabelText('Risultato')).toBeInTheDocument()

  // La voce dopo, stessa abilità: si parte dall'esercizio.
  answerCorrectly()
  next()
  expect(screen.getByText('Esercizio 2 di 3')).toBeInTheDocument()
  expect(screen.getByLabelText('Risultato')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Leggi la lezione' }),
  ).not.toBeInTheDocument()
})

test('ripasso e apprendimento passano dritti, il cancello aspetta la voce nuova', () => {
  renderSession([
    item('n.add-sub', 'review'),
    item('n.mul-div', 'learning'),
    item('n.order', 'new'),
  ])
  for (const step of [1, 2]) {
    expect(screen.getByText(`Esercizio ${step} di 3`)).toBeInTheDocument()
    expect(screen.getByLabelText('Risultato')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Leggi la lezione' }),
    ).not.toBeInTheDocument()
    answerCorrectly()
    next()
  }
  expect(
    screen.getByRole('heading', { name: 'Le quattro operazioni insieme' }),
  ).toBeInTheDocument()
})

test('un’abilità nuova il cui capitolo non ha lezione parte dall’esercizio', () => {
  renderSession([item('z.add-sub', 'new'), item('n.add-sub', 'new')])
  expect(screen.getByLabelText('Risultato')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Leggi la lezione' }),
  ).not.toBeInTheDocument()

  // Il capitolo con lezione, invece, apre il cancello.
  answerCorrectly()
  next()
  expect(
    screen.getByRole('button', { name: 'Leggi la lezione' }),
  ).toBeInTheDocument()
})

test('due abilità nuove, un cancello ciascuno; anche in chiusura di sessione', () => {
  renderSession([item('n.add-sub', 'new'), item('n.mul-div', 'new')])
  expect(
    screen.getByRole('heading', { name: 'Addizioni e sottrazioni' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia l’esercizio' }))
  answerCorrectly()
  next()

  // L'ultima voce della sessione è essa stessa un cancello.
  expect(
    screen.getByRole('heading', { name: 'Moltiplicazioni e divisioni' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia l’esercizio' }))
  answerCorrectly()
  expect(screen.getByText('Sessione completata.')).toBeInTheDocument()
})

test('dopo la lezione si torna al cancello: stessa voce, stessi risultati', () => {
  const onOpenLesson = vi.fn()
  const view = renderSession(
    [item('n.mul-div', 'learning'), item('n.add-sub', 'new')],
    { onOpenLesson },
  )
  answerCorrectly()
  next()
  expect(
    screen.getByRole('heading', { name: 'Addizioni e sottrazioni' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Leggi la lezione' }))
  expect(onOpenLesson).toHaveBeenCalledExactlyOnceWith(
    'n',
    expect.objectContaining({ index: 1, closed: false, results: ['clean'] }),
  )

  // Come fa App tornando dalla lezione: la pagina si rimonta sullo scatto.
  const snapshot = onOpenLesson.mock.lastCall?.[1]
  view.unmount()
  renderSession(
    [item('n.mul-div', 'learning'), item('n.add-sub', 'new')],
    snapshot ? { resume: snapshot } : {},
  )
  expect(screen.getByText('Esercizio 2 di 2')).toBeInTheDocument()
  expect(
    screen.getByRole('progressbar', { name: 'Esercizi della sessione' }),
  ).toHaveAttribute('aria-valuenow', '1')
  expect(
    screen.getByRole('heading', { name: 'Addizioni e sottrazioni' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia l’esercizio' }))
  answerCorrectly()
  expect(screen.getByText('Sessione completata.')).toBeInTheDocument()
  expect(
    screen.getByText('Tutti corretti, senza suggerimenti.'),
  ).toBeInTheDocument()
})

test('una flashcard: il dietro e i voti solo dopo «Mostra», e niente Easy', () => {
  renderSession([card('pow.zero')])
  expect(screen.getByRole('math', { name: 'a^0 = {}' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Bene' })).not.toBeInTheDocument()
  expect(screen.queryByText(/con/)).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Mostra' }))
  expect(screen.getByRole('math', { name: '1' })).toBeInTheDocument()
  for (const name of ['Di nuovo', 'Difficile', 'Bene'])
    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /facile|easy/i })).toBeNull()
  expect(screen.getAllByRole('math')).toHaveLength(3)
})

test.each([
  ['Di nuovo', 'again'],
  ['Difficile', 'hard'],
  ['Bene', 'good'],
])('il voto «%s» chiama onFlashcardReview una volta', (name, grade) => {
  const onFlashcardReview = vi.fn()
  renderSession([card('pow.zero'), card('n.order')], { onFlashcardReview })
  fireEvent.click(screen.getByRole('button', { name: 'Mostra' }))
  fireEvent.click(screen.getByRole('button', { name }))
  expect(onFlashcardReview).toHaveBeenCalledExactlyOnceWith({
    card: 'pow.zero',
    grade,
  })
})

test('con Again la stessa flashcard torna prima della fine', () => {
  const onFlashcardReview = vi.fn()
  renderSession([card('pow.zero')], { onFlashcardReview })
  fireEvent.click(screen.getByRole('button', { name: 'Mostra' }))
  fireEvent.click(screen.getByRole('button', { name: 'Di nuovo' }))
  // Di nuovo davanti, con il dietro nascosto.
  expect(screen.queryByText('Sessione completata.')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Mostra' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Mostra' }))
  fireEvent.click(screen.getByRole('button', { name: 'Bene' }))
  expect(screen.getByText('Sessione completata.')).toBeInTheDocument()
  expect(onFlashcardReview).toHaveBeenCalledTimes(2)
})

test('una sessione di sole flashcard si completa', () => {
  renderSession([card('pow.zero'), card('n.order')])
  for (let i = 0; i < 2; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'Mostra' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bene' }))
  }
  expect(screen.getByText('Sessione completata.')).toBeInTheDocument()
})

test('un esercizio e poi una flashcard: dalla chiusura si passa alla carta', () => {
  renderSession([item('n.add-sub', 'learning'), card('n.order')])
  answerCorrectly()
  next()
  expect(screen.getByRole('button', { name: 'Mostra' })).toBeInTheDocument()
})
