import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
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
