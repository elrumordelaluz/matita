import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { finiteSet, type Exercise } from '../engine/index.ts'
import { PracticePage } from './PracticePage.tsx'

// Le quattro scritture si completano con i tasti (SPEC.md, "Insiemi",
// "Risposte"): "Verifica" si attiva quando tutte hanno un simbolo.

// C3 5.14: A = {0, 2, 5}.
const exercise: Exercise = {
  kind: 'symbols',
  skill: 'set.relations',
  seed: 1,
  generatorVersion: 1,
  set: finiteSet([0n, 2n, 5n]),
  objects: [
    { kind: 'number', value: 2n },
    { kind: 'number', value: 3n },
    { kind: 'set', elements: [2n] },
    { kind: 'set', elements: [5n, 0n, 2n] },
  ],
}

const statements = ['2 … A', '3 … A', '{2} … A', '{5, 0, 2} … A']

function choose(symbols: readonly string[]) {
  symbols.forEach((symbol, i) => {
    const group = screen.getByRole('group', {
      name: `Scrittura ${i + 1}: ${statements[i] ?? ''}`,
    })
    fireEvent.click(within(group).getByRole('button', { name: symbol }))
  })
}

test('si completano le quattro scritture con i tasti', () => {
  const onAttempt = vi.fn()
  render(<PracticePage createExercise={() => exercise} onAttempt={onAttempt} />)
  expect(
    screen.getByRole('math', { name: 'A = {0, 2, 5}' }),
  ).toBeInTheDocument()
  // Il campo di testo non c'è: si risponde con i tasti.
  expect(screen.queryByRole('textbox', { name: 'Risultato' })).toBeNull()
  const check = screen.getByRole('button', { name: 'Verifica' })
  expect(check).toBeDisabled()

  choose(['∈', '∉', '⊂'])
  expect(check).toBeDisabled()
  const last = screen.getByRole('group', { name: 'Scrittura 4: {5, 0, 2} … A' })
  fireEvent.click(within(last).getByRole('button', { name: '=' }))
  expect(within(last).getByRole('button', { name: '=' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(check).toBeEnabled()
  fireEvent.click(check)

  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  expect(onAttempt).toHaveBeenCalledWith(
    expect.objectContaining({
      answer: '∈,∉,⊂,=',
      outcome: { kind: 'correct' },
    }),
  )
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(
    within(solution).getByRole('math', { name: '{2} ⊂ A' }),
  ).toBeInTheDocument()
  expect(
    within(solution).getByText('ha gli stessi elementi di A'),
  ).toBeInTheDocument()
})

test('un ⊆ va riscritto, e l’esercizio resta aperto', () => {
  render(<PracticePage createExercise={() => exercise} />)
  choose(['∈', '∉', '⊆', '='])
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
  expect(screen.getByRole('status')).toHaveTextContent(
    'È vero, ma c’è un simbolo più preciso.',
  )
  const third = screen.getByRole('group', { name: 'Scrittura 3: {2} … A' })
  fireEvent.click(within(third).getByRole('button', { name: '⊂' }))
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
})

test('{2} ∈ A mostra la spiegazione dell’errore', () => {
  render(<PracticePage createExercise={() => exercise} />)
  choose(['∈', '∉', '∈', '='])
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
  expect(screen.getByText(/si dice che è incluso/)).toBeInTheDocument()
})
