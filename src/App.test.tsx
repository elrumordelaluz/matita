import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'
import { parseExpression, rationalToText, solve } from './engine/index.ts'
import { createMemoryStore } from './progress/store.ts'

test('mostra il titolo', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Matita' })).toBeInTheDocument()
})

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

test('gli esercizi svolti finiscono nei progressi', async () => {
  const store = createMemoryStore()
  render(<App store={store} />)
  fireEvent.click(screen.getByRole('button', { name: 'Pratica' }))
  for (let i = 0; i < 3; i++) {
    answerCorrectly()
    fireEvent.click(
      screen.getByRole('button', { name: 'Esercizio successivo' }),
    )
  }
  expect(await store.attempts()).toHaveLength(3)

  fireEvent.click(screen.getByRole('button', { name: 'I miei progressi' }))
  const item = await screen.findByRole('listitem', {
    name: 'Addizioni e sottrazioni',
  })
  expect(within(item).getByText('acquisita')).toBeInTheDocument()
})
