import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { parseExpression, rationalToText, solve } from '../engine/index.ts'
import { skills } from '../content/skills.ts'
import type { SessionItem } from '../progress/session.ts'
import { SessionPage } from './SessionPage.tsx'

// Il test del capitolo senza lezione svuota la mappa delle lezioni.
const emptyLessons = { current: false }
vi.mock('../content/lessons/index.ts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../content/lessons/index.ts')>()
  return {
    lessons: new Proxy(actual.lessons, {
      get: (map, chapter: string) =>
        emptyLessons.current ? undefined : map[chapter as never],
    }),
  }
})

const page = {
  onAttempt: () => {},
  onDone: () => {},
  onOpenLesson: () => {},
}

test('alla prima voce nuova di un’abilità, il pannello al posto dell’esercizio', () => {
  const items: SessionItem[] = [
    { skill: 'n.mul-div', reason: 'new' },
    { skill: 'n.mul-div', reason: 'new' },
  ]
  render(<SessionPage items={items} skills={skills} {...page} />)
  expect(
    screen.getByRole('heading', { name: 'Moltiplicazioni e divisioni' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/è un’abilità nuova/i)).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Leggi la lezione' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Inizia l’esercizio' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('math')).not.toBeInTheDocument()
})

test('«Inizia l’esercizio» mostra l’esercizio della stessa voce', () => {
  const items: SessionItem[] = [
    { skill: 'n.mul-div', reason: 'new' },
    { skill: 'n.mul-div', reason: 'new' },
  ]
  render(<SessionPage items={items} skills={skills} {...page} />)
  fireEvent.click(screen.getByRole('button', { name: 'Inizia l’esercizio' }))
  expect(screen.getByText('Esercizio 1 di 2')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Verifica' })).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Leggi la lezione' }),
  ).not.toBeInTheDocument()
})

// Risponde giusto all’esercizio sullo schermo e passa al successivo.
function answerCorrectly() {
  const shown = screen.getAllByRole('math')[0]?.getAttribute('aria-label')
  const result = solve(parseExpression(shown ?? '')).result
  fireEvent.change(screen.getByLabelText('Risultato'), {
    target: { value: rationalToText(result) },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
  fireEvent.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
}

test('le voci successive della stessa abilità partono dall’esercizio', () => {
  const items: SessionItem[] = [
    { skill: 'n.mul-div', reason: 'new' },
    { skill: 'n.mul-div', reason: 'new' },
  ]
  render(<SessionPage items={items} skills={skills} {...page} />)
  fireEvent.click(screen.getByRole('button', { name: 'Inizia l’esercizio' }))
  answerCorrectly()
  expect(screen.getByText('Esercizio 2 di 2')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Verifica' })).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Leggi la lezione' }),
  ).not.toBeInTheDocument()
})

test('ripasso e apprendimento partono dall’esercizio', () => {
  const items: SessionItem[] = [
    { skill: 'n.add-sub', reason: 'review' },
    { skill: 'n.order', reason: 'learning' },
  ]
  render(<SessionPage items={items} skills={skills} {...page} />)
  expect(screen.getByRole('button', { name: 'Verifica' })).toBeInTheDocument()
  answerCorrectly()
  expect(screen.getByText('Esercizio 2 di 2')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Verifica' })).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Leggi la lezione' }),
  ).not.toBeInTheDocument()
})

test('l’abilità nuova di un capitolo senza lezione parte dall’esercizio', () => {
  emptyLessons.current = true
  const items: SessionItem[] = [{ skill: 'n.mul-div', reason: 'new' }]
  render(<SessionPage items={items} skills={skills} {...page} />)
  expect(screen.getByRole('button', { name: 'Verifica' })).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Leggi la lezione' }),
  ).not.toBeInTheDocument()
  emptyLessons.current = false
})
