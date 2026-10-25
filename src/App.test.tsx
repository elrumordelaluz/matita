import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { parseExpression, rationalToText, solve } from './engine/index.ts'
import { attempt } from './progress/fixtures.ts'
import { createMemoryStore } from './progress/store.ts'

afterEach(() => {
  vi.useRealTimers()
})

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

const day = 86_400_000
const monday = Date.UTC(2026, 8, 14, 9)

test('la pagina iniziale dice quanti ripassi sono in attesa', async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: monday + 30 * day })
  const store = createMemoryStore()
  for (let i = 0; i < 3; i++)
    await store.addAttempt(
      attempt({ skill: 'n.add-sub', answeredAt: monday + i * 60_000 }),
    )
  render(<App store={store} />)
  expect(await screen.findByText('1 ripasso in attesa.')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Inizia la sessione' }),
  ).toBeEnabled()
})

test('una sessione intera: dieci esercizi, tutti salvati', async () => {
  const store = createMemoryStore()
  render(<App store={store} />)
  expect(
    await screen.findByText('Nessun ripasso in attesa.'),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la sessione' }))

  for (let i = 1; i <= 10; i++) {
    expect(screen.getByText(`Esercizio ${i} di 10`)).toBeInTheDocument()
    answerCorrectly()
    if (i < 10)
      fireEvent.click(
        screen.getByRole('button', { name: 'Esercizio successivo' }),
      )
  }
  expect(screen.getByText('Sessione completata.')).toBeInTheDocument()
  expect(await store.attempts()).toHaveLength(10)

  fireEvent.click(screen.getByRole('button', { name: 'Torna all’inizio' }))
  expect(
    await screen.findByRole('button', { name: 'Inizia la sessione' }),
  ).toBeInTheDocument()
})
