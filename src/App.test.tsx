import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('mostra il titolo', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Matita' })).toBeInTheDocument()
})
