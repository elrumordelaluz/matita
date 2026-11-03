import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { chapterById } from '../content/chapters.ts'
import { skills } from '../content/skills.ts'
import { createMemoryStore, type ProgressStore } from '../progress/store.ts'
import { HomePage } from './HomePage.tsx'

// Vedi SPEC.md, "Pagina iniziale" e "Il blocco è un consiglio".

const monday = Date.UTC(2026, 8, 14, 9)

async function firstChapterKnown(): Promise<ProgressStore> {
  const store = createMemoryStore()
  await store.putKnown(
    chapterById('n').skills.map((s) => ({ skill: s.id, markedAt: monday })),
  )
  return store
}

function renderHome(store: ProgressStore) {
  const handlers = {
    onOpenLesson: vi.fn(),
    onOpenProgress: vi.fn(),
    onPractise: vi.fn(),
  }
  render(
    <HomePage store={store} skills={skills} onStart={vi.fn()} {...handlers} />,
  )
  return handlers
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
