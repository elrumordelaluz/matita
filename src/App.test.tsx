import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('mostra il titolo', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Matita' })).toBeInTheDocument()
})

test('si parte dalla lezione e si passa alla pratica', () => {
  render(<App />)
  expect(
    screen.getByRole('heading', { name: 'Espressioni in N' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(screen.getByLabelText('Risultato')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Torna alla lezione' }))
  expect(
    screen.getByRole('heading', { name: 'Espressioni in N' }),
  ).toBeInTheDocument()
})
