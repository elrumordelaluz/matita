import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { chapterById } from '../content/chapters.ts'
import type { Flashcard } from '../content/flashcards.ts'
import { skills } from '../content/skills.ts'
import { createMemoryStore, type ProgressStore } from '../progress/store.ts'
import { HomePage } from './HomePage.tsx'

// Vedi SPEC.md, "Pagina iniziale" e "Il blocco è un consiglio".

const flashcards: Flashcard[] = [1, 2, 3].map((n) => ({
  id: `n.card-${n}`,
  chapter: 'n',
  front: 'davanti',
  back: 'dietro',
}))

const monday = Date.UTC(2026, 8, 14, 9)

async function firstChapterKnown(): Promise<ProgressStore> {
  const store = createMemoryStore()
  await store.putKnown(
    chapterById('n').skills.map((s) => ({ skill: s.id, markedAt: monday })),
  )
  return store
}

function renderHome(store: ProgressStore, cards = flashcards) {
  const onStart = vi.fn()
  const handlers = {
    onOpenLesson: vi.fn(),
    onOpenProgress: vi.fn(),
    onPractise: vi.fn(),
  }
  render(
    <HomePage
      store={store}
      skills={skills}
      flashcards={cards}
      onStart={onStart}
      {...handlers}
    />,
  )
  return { ...handlers, onStart }
}

const card = async (title: string) =>
  within(await screen.findByRole('listitem', { name: title }))

test('la riga di stato dice quante abilità sono acquisite e il capitolo in corso', async () => {
  renderHome(await firstChapterKnown())
  expect(
    await screen.findByText(
      `5 di ${skills.length} abilità acquisite · in corso: Espressioni in Z`,
    ),
  ).toBeInTheDocument()
})

test('una scheda bloccata apre la lezione e la mappa, e dice cosa aspetta', async () => {
  const { onOpenLesson, onOpenProgress } = renderHome(createMemoryStore())
  const poly = await card('Polinomi')
  expect(poly.getByText(/bloccato/)).toBeInTheDocument()
  expect(poly.getByText('Prima: capitolo 6, Monomi')).toBeInTheDocument()

  fireEvent.click(poly.getByRole('button', { name: 'Apri la lezione' }))
  expect(onOpenLesson).toHaveBeenCalledWith('poly')
  fireEvent.click(poly.getByRole('button', { name: 'Vedi la mappa' }))
  expect(onOpenProgress).toHaveBeenCalledWith('poly')
})

test('una scheda aperta non dice cosa aspetta', async () => {
  renderHome(createMemoryStore())
  const first = await card('Espressioni in N')
  expect(first.queryByText(/^Prima: capitolo/)).not.toBeInTheDocument()
})

test('all’apertura solo la scheda del capitolo in corso mostra le abilità', async () => {
  renderHome(await firstChapterKnown())
  const z = await card('Espressioni in Z')
  expect(z.getByRole('button', { name: 'Abilità' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  expect(z.getByRole('listitem', { name: 'Somma algebrica' })).toBeVisible()

  const n = await card('Espressioni in N')
  const toggle = n.getByRole('button', { name: 'Abilità' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(
    n.queryByRole('listitem', { name: 'Addizioni e sottrazioni' }),
  ).not.toBeInTheDocument()

  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(
    n.getByRole('listitem', { name: 'Addizioni e sottrazioni' }),
  ).toBeInTheDocument()
})

test('ogni abilità si allena dalla sua scheda, anche bloccata', async () => {
  const { onPractise } = renderHome(await firstChapterKnown())
  const z = await card('Espressioni in Z')

  const sum = within(z.getByRole('listitem', { name: 'Somma algebrica' }))
  expect(sum.getByText('in apprendimento')).toBeInTheDocument()
  fireEvent.click(sum.getByRole('button', { name: 'Allena' }))
  expect(onPractise).toHaveBeenLastCalledWith('z.add-sub')

  const order = within(
    z.getByRole('listitem', { name: 'Le quattro operazioni con i relativi' }),
  )
  expect(order.getByText('bloccata')).toBeInTheDocument()
  expect(
    order.getByText('Prima: Somma algebrica, La regola dei segni'),
  ).toBeInTheDocument()
  fireEvent.click(order.getByRole('button', { name: 'Allena lo stesso' }))
  expect(onPractise).toHaveBeenLastCalledWith('z.order')

  // Le abilità acquisite si allenano ancora.
  const n = await card('Espressioni in N')
  fireEvent.click(n.getByRole('button', { name: 'Abilità' }))
  const parens = within(n.getByRole('listitem', { name: 'Parentesi tonde' }))
  expect(parens.getByText('acquisita')).toBeInTheDocument()
  fireEvent.click(parens.getByRole('button', { name: 'Allena' }))
  expect(onPractise).toHaveBeenLastCalledWith('n.parens')
})

// Tre flashcard introdotte e votate Good tanto tempo fa: scadute.
async function withDueFlashcards(): Promise<ProgressStore> {
  const store = createMemoryStore()
  await store.putIntroduced(
    flashcards.map((f) => ({ card: f.id, introducedAt: monday })),
  )
  await store.putFlashcardReviews(
    flashcards.map((f) => ({ card: f.id, grade: 'good', at: monday })),
  )
  return store
}

test('Oggi conta le flashcard scadute accanto ai ripassi', async () => {
  renderHome(await withDueFlashcards())
  expect(
    await screen.findByText('Nessun ripasso e 3 flashcard in attesa.'),
  ).toBeInTheDocument()
})

test('una sessione di sole flashcard può cominciare', async () => {
  const { onStart } = renderHome(await withDueFlashcards())
  const start = await screen.findByRole('button', {
    name: 'Inizia la sessione',
  })
  fireEvent.click(start)
  expect(onStart).toHaveBeenCalledOnce()
  const queue = onStart.mock.calls[0]?.[0] as { kind: string }[]
  expect(queue.filter((q) => q.kind === 'flashcard')).toHaveLength(3)
})

test('senza introduzioni il testo è quello di prima', async () => {
  renderHome(createMemoryStore())
  expect(
    await screen.findByText('Nessun ripasso in attesa.'),
  ).toBeInTheDocument()
  expect(screen.queryByText(/flashcard/)).not.toBeInTheDocument()
})

// Il capitolo N saputo (cinque ripassi scaduti), tre flashcard scadute e due
// introdotte e mai viste: la coda è ripassi e flashcard scadute, poi le
// flashcard nuove, poi le abilità nuove.
test('Oggi somma i ripassi e le flashcard, e le mostra nell’ordine della coda', async () => {
  const cards: Flashcard[] = [1, 2, 3, 4, 5].map((n) => ({
    id: `n.card-${n}`,
    chapter: 'n',
    front: 'davanti',
    back: 'dietro',
  }))
  const store = await firstChapterKnown()
  await store.putIntroduced(
    cards.map((f) => ({ card: f.id, introducedAt: monday })),
  )
  await store.putFlashcardReviews(
    cards.slice(0, 3).map((f) => ({ card: f.id, grade: 'good', at: monday })),
  )
  renderHome(store, cards)

  const today = within(await screen.findByLabelText('Oggi'))
  await today.findByText('5 ripassi e 3 flashcard in attesa.')
  expect(today.getByText('8')).toBeInTheDocument()
  expect(today.getByText(/in attesa:/)).toHaveTextContent(
    'in attesa:5 ripassi e 3 flashcard',
  )

  // Le righe: ripassi e flashcard scadute, poi le nuove, poi le abilità.
  const rows = today.getAllByRole('listitem').map((li) => li.textContent)
  const firstNew = rows.findIndex((r) => r?.startsWith('FlashcardNuove'))
  const firstSkill = rows.findIndex((r) => r?.startsWith('Abilità nuova'))
  expect(rows.filter((r) => r?.startsWith('Flashcard'))).toEqual([
    'FlashcardDa ripassare×3',
    'FlashcardNuove×2',
  ])
  expect(
    rows.slice(0, firstNew).every((r) => /^(Ripasso|Flashcard)/.test(r ?? '')),
  ).toBe(true)
  expect(firstNew).toBeLessThan(firstSkill)

  // Un quadretto per voce della coda, le flashcard col loro contorno.
  const squares = [...document.querySelectorAll('[data-kind]')]
  expect(
    squares.filter((s) => s.matches('[data-kind=flashcard]')),
  ).toHaveLength(5)
  expect(squares.length).toBeGreaterThan(5)
  const cardSquares = squares.filter((s) => s.matches('[data-kind=flashcard]'))
  expect(cardSquares.every((s) => s.classList.contains('border-lead'))).toBe(
    true,
  )
  // Le scadute hanno il contorno continuo, le nuove tratteggiato.
  expect(cardSquares.map((s) => s.classList.contains('border-dashed'))).toEqual(
    [false, false, false, true, true],
  )
  expect(today.getByText(/\d+ esercizi/)).toBeInTheDocument()
})
