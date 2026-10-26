import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { parseExpression, type Exercise } from '../engine/index.ts'
import { PracticePage } from './PracticePage.tsx'

function exercise(source: string): Exercise {
  return {
    skill: 'n.add-sub',
    seed: 1,
    generatorVersion: 1,
    expression: parseExpression(source),
  }
}

afterEach(() => {
  vi.useRealTimers()
})

function answer(text: string) {
  fireEvent.change(screen.getByLabelText('Risultato'), {
    target: { value: text },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
}

test('mostra l’espressione da calcolare', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  expect(
    screen.getByRole('math', { name: '12 − 5 + 3 − 4' }),
  ).toBeInTheDocument()
})

test('risposta giusta', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  answer('6')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  expect(screen.getByRole('region', { name: 'Soluzione' })).toBeInTheDocument()
})

test('risposta sbagliata con soluzione per righe', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  answer('14')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Non è corretto: il risultato è 6.',
  )
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(within(solution).getByRole('math', { name: '6' })).toBeInTheDocument()
  expect(within(solution).getByText('12 − 5 = 7')).toBeInTheDocument()
  expect(within(solution).getByText('10 − 4 = 6')).toBeInTheDocument()
})

test('un errore tipico mostra la spiegazione prima della soluzione', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  answer('20')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Non è corretto: il risultato è 14.',
  )
  const explanation = screen.getByText(/Senza parentesi si fanno prima × e :/)
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(
    explanation.compareDocumentPosition(solution) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(within(solution).getByText('3 × 4 = 12')).toBeInTheDocument()
  expect(screen.getByLabelText('Risultato')).toHaveAttribute('readonly')
})

test('una risposta illeggibile non chiude l’esercizio', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  answer('sei')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Scrivi il risultato come numero.',
  )
  expect(screen.queryByRole('region', { name: 'Soluzione' })).toBeNull()
  answer('6')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
})

test('il suggerimento mostra la prossima riga', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  expect(screen.queryByRole('region', { name: 'Soluzione' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(within(solution).getByRole('math', { name: '6' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Suggerimento' })).toBeDisabled()
})

test('l’esercizio successivo riparte da capo', () => {
  const sources = ['12 − 5 + 3 − 4', '20 + 8 − 15']
  let i = 0
  render(<PracticePage createExercise={() => exercise(sources[i++] ?? '')} />)
  answer('6')
  fireEvent.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
  expect(screen.getByRole('math', { name: '20 + 8 − 15' })).toBeInTheDocument()
  expect(screen.getByLabelText('Risultato')).toHaveValue('')
  expect(screen.queryByRole('status')).toBeNull()
})

test('a esercizio chiuso riferisce il tentativo', () => {
  vi.useFakeTimers({ toFake: ['Date'], now: 1_000 })
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('12 − 5 + 3 − 4')}
      onAttempt={onAttempt}
    />,
  )
  vi.setSystemTime(26_000)
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  answer('sei')
  expect(onAttempt).not.toHaveBeenCalled()
  answer('6')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith({
    exercise: exercise('12 − 5 + 3 − 4'),
    answer: '6',
    outcome: { kind: 'correct' },
    hints: 1,
    rewrites: 0,
    durationMs: 25_000,
  })
})

test('la durata riparte con l’esercizio successivo', () => {
  vi.useFakeTimers({ toFake: ['Date'], now: 1_000 })
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('12 − 5 + 3 − 4')}
      onAttempt={onAttempt}
    />,
  )
  vi.setSystemTime(11_000)
  answer('14')
  fireEvent.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
  vi.setSystemTime(18_000)
  answer('6')
  expect(onAttempt).toHaveBeenLastCalledWith(
    expect.objectContaining({
      outcome: { kind: 'correct' },
      durationMs: 7_000,
    }),
  )
})

test('anche un errore tipico chiude l’esercizio e riferisce il tentativo', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('2 + 3 × 4')}
      onAttempt={onAttempt}
    />,
  )
  answer('20')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      answer: '20',
      outcome: expect.objectContaining({
        kind: 'misconception',
        misconception: 'add-before-mul',
      }),
    }),
  )
})

test('in Z il risultato e i conti hanno il meno tipografico', () => {
  render(<PracticePage createExercise={() => exercise('−8 − (3 − (−6))')} />)
  answer('-1')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Non è corretto: il risultato è −17.',
  )
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(within(solution).getByText('3 − (−6) = 9')).toBeInTheDocument()
  expect(within(solution).getByText('−8 − 9 = −17')).toBeInTheDocument()
})
