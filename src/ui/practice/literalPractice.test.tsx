import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import {
  parseLiteralExpression,
  rational,
  type Exercise,
} from '../../engine/index.ts'
import { PracticePage } from '../PracticePage.tsx'

// La pratica del capitolo 6: il valore numerico chiede un numero, gli altri
// esercizi un polinomio, con l'anteprima e la soluzione per righe.

function answer(text: string) {
  fireEvent.change(screen.getByLabelText('Risultato'), {
    target: { value: text },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
}

const polynomial = (source: string): Exercise => ({
  kind: 'polynomial',
  skill: 'mono.add-sub',
  seed: 1,
  generatorVersion: 1,
  expression: parseLiteralExpression(source),
})

test('il valore numerico mostra i valori delle lettere e la riga della sostituzione', () => {
  const exercise: Exercise = {
    kind: 'number',
    skill: 'mono.value',
    seed: 1,
    generatorVersion: 1,
    expression: parseLiteralExpression('2a² + 3a'),
    substitution: [{ letter: 'a', value: rational(-2n) }],
  }
  render(<PracticePage createExercise={() => exercise} />)
  expect(
    screen.getByRole('math', { name: '2a² + 3a, per a = −2' }),
  ).toBeInTheDocument()
  answer('-14')
  expect(
    screen.getByText(/Hai sostituito un numero negativo senza le parentesi/),
  ).toBeInTheDocument()
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(
    within(solution).getByRole('math', { name: '2 × (−2)² + 3 × (−2)' }),
  ).toBeInTheDocument()
  expect(within(solution).getByText('a = −2')).toBeInTheDocument()
})

test('la risposta polinomio ha l’anteprima come è scritta', () => {
  render(<PracticePage createExercise={() => polynomial('3a² + 2b − a²')} />)
  fireEvent.change(screen.getByLabelText('Risultato'), {
    target: { value: '2a^2 + 2b' },
  })
  expect(screen.getByRole('math', { name: '2a² + 2b' })).toBeInTheDocument()
})

test('una risposta polinomio da riscrivere, poi giusta', () => {
  render(<PracticePage createExercise={() => polynomial('3a² + 2b − a²')} />)
  answer('2b + a^2 + a^2')
  expect(screen.getByRole('status')).toHaveTextContent('Somma i monomi simili.')
  answer('2b + 2a^2')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(within(solution).getByText('3a² − a² = 2a²')).toBeInTheDocument()
})
