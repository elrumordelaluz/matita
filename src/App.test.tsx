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
    // All'inizio di ogni abilità nuova, la sessione offre prima la lezione.
    const begin = screen.queryByRole('button', { name: 'Inizia l’esercizio' })
    if (begin) fireEvent.click(begin)
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

test('dalla lezione si passa alla pratica', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Lezione' }))
  expect(
    screen.getByRole('heading', { name: 'Espressioni in N' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(screen.getByLabelText('Risultato')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Lezione' }))
  expect(
    screen.getByRole('heading', { name: 'Espressioni in N' }),
  ).toBeInTheDocument()
})

// Vedi SPEC.md, "Già saputo".

const chapterCard = async (title: string) =>
  within(await screen.findByRole('listitem', { name: title }))

test('un capitolo segnato come già saputo apre il successivo, e si annulla', async () => {
  const store = createMemoryStore()
  render(<App store={store} />)

  let first = await chapterCard('Espressioni in N')
  expect(
    (await chapterCard('Espressioni in Z')).getByText(/bloccato/),
  ).toBeInTheDocument()
  fireEvent.click(first.getByRole('button', { name: 'Lo so già' }))
  expect(
    first.getByText(
      'Le 5 abilità del capitolo diventano acquisite senza esercizi e il ripasso le controlla fra qualche giorno.',
    ),
  ).toBeInTheDocument()
  fireEvent.click(first.getByRole('button', { name: 'Sì, lo so già' }))

  expect(
    await first.findByText(/Segnato come già saputo il/),
  ).toBeInTheDocument()
  expect(first.getByText('5/5 acquisite')).toBeInTheDocument()
  const second = await chapterCard('Espressioni in Z')
  expect(second.queryByText(/bloccato/)).not.toBeInTheDocument()
  expect(second.getByText('0/5 acquisite')).toBeInTheDocument()
  expect(await store.known()).toHaveLength(5)
  expect(await store.attempts()).toEqual([])

  // La mappa si apre sul capitolo su cui si lavora: il secondo.
  fireEvent.click(screen.getByRole('button', { name: 'I miei progressi' }))
  const sum = await screen.findByRole('listitem', { name: 'Somma algebrica' })
  expect(within(sum).getByText('in apprendimento')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Espressioni in N/ }))
  for (const title of ['Addizioni e sottrazioni', 'Tonde, quadre e graffe']) {
    const item = await screen.findByRole('listitem', { name: title })
    expect(within(item).getByText('acquisita')).toBeInTheDocument()
  }

  fireEvent.click(screen.getByRole('button', { name: 'Inizio' }))
  first = await chapterCard('Espressioni in N')
  fireEvent.click(await first.findByRole('button', { name: 'Annulla' }))

  expect(await first.findByText('0/5 acquisite')).toBeInTheDocument()
  expect(first.getByRole('button', { name: 'Lo so già' })).toBeInTheDocument()
  expect(
    (await chapterCard('Espressioni in Z')).getByText(/bloccato/),
  ).toBeInTheDocument()
  expect(await store.known()).toEqual([])
})

test('“Non ora” chiude la conferma senza segnare nulla', async () => {
  const store = createMemoryStore()
  render(<App store={store} />)
  const first = await chapterCard('Espressioni in N')
  fireEvent.click(first.getByRole('button', { name: 'Lo so già' }))
  fireEvent.click(first.getByRole('button', { name: 'Non ora' }))
  expect(first.getByRole('button', { name: 'Lo so già' })).toHaveFocus()
  expect(await store.known()).toEqual([])
})

test('la lezione si apre sul capitolo su cui si lavora', async () => {
  const store = createMemoryStore()
  await store.putKnown(
    ['n.add-sub', 'n.mul-div', 'n.order', 'n.parens', 'n.brackets'].map(
      (skill) => ({ skill, markedAt: monday }),
    ),
  )
  render(<App store={store} />)
  await chapterCard('Espressioni in N')

  fireEvent.click(screen.getByRole('button', { name: 'Lezione' }))
  expect(
    screen.getByRole('button', { name: /Espressioni in Z/, pressed: true }),
  ).toBeInTheDocument()

  // Dalla scheda del capitolo si apre la sua lezione.
  fireEvent.click(screen.getByRole('button', { name: 'Inizio' }))
  const first = await chapterCard('Espressioni in N')
  fireEvent.click(first.getByRole('button', { name: 'Apri la lezione' }))
  expect(
    screen.getByRole('heading', { name: 'Espressioni in N' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Espressioni in N/, pressed: true }),
  ).toBeInTheDocument()
  expect(
    await screen.findByText(/Segnato come già saputo il/),
  ).toBeInTheDocument()
})

test('durante una sessione, la lezione dell’abilità nuova si apre e si richiude', async () => {
  const store = createMemoryStore()
  render(<App store={store} />)
  expect(
    await screen.findByText('Nessun ripasso in attesa.'),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la sessione' }))

  for (let i = 1; i <= 10; i++) {
    if (i === 7) {
      // A metà sessione, la lezione della seconda abilità nuova: la sessione
      // resta sospesa, con la sua fila e i suoi risultati.
      fireEvent.click(screen.getByRole('button', { name: 'Leggi la lezione' }))
      expect(
        screen.getByRole('heading', { name: 'Espressioni in N' }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Leggi la lezione' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Verifica' }),
      ).not.toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('button', { name: 'Torna alla sessione' }),
      )
      expect(screen.getByText('Esercizio 7 di 10')).toBeInTheDocument()
      expect(
        screen.getByRole('progressbar', { name: 'Esercizi della sessione' }),
      ).toHaveAttribute('aria-valuenow', '6')
    }
    const begin = screen.queryByRole('button', { name: 'Inizia l’esercizio' })
    if (begin) fireEvent.click(begin)
    answerCorrectly()
    if (i < 10)
      fireEvent.click(
        screen.getByRole('button', { name: 'Esercizio successivo' }),
      )
  }
  expect(screen.getByText('Sessione completata.')).toBeInTheDocument()
})
