import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { Exercise } from '../engine/index.ts'
import { PracticePage } from './PracticePage.tsx'

// La pratica del capitolo 5: la stessa pagina, con la consegna, l'anteprima
// e la soluzione del tipo di risposta "insieme".

// C3 5.16b: {x ∈ N | 2 ≤ x < 5}.
const roster: Exercise = {
  kind: 'set',
  skill: 'set.roster',
  seed: 1,
  generatorVersion: 1,
  task: {
    kind: 'roster',
    property: {
      lower: { value: 2n, strict: false },
      upper: { value: 5n, strict: true },
    },
  },
}

function answer(text: string) {
  fireEvent.change(screen.getByLabelText('Risultato'), {
    target: { value: text },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
}

test('la consegna è la proprietà caratteristica', () => {
  render(<PracticePage createExercise={() => roster} />)
  expect(
    screen.getByRole('heading', { name: 'Scrivi l’insieme per elencazione' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('math', { name: '{x ∈ N | 2 ≤ x < 5}' }),
  ).toBeInTheDocument()
})

test('un insieme in un altro ordine è corretto, e la soluzione lo elenca in ordine', () => {
  render(<PracticePage createExercise={() => roster} />)
  answer('{4, 2, 3}')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(
    within(solution).getByRole('math', { name: '{2, 3, 4}' }),
  ).toBeInTheDocument()
})

test('il < letto come ≤ mostra la spiegazione dell’errore', () => {
  render(<PracticePage createExercise={() => roster} />)
  answer('{2, 3, 4, 5}')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Non è corretto: il risultato è {2, 3, 4}.',
  )
  expect(screen.getByText(/x < 7 non comprende il 7/)).toBeInTheDocument()
})
