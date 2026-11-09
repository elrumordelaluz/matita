import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import type { ChapterId } from '../content/chapters.ts'
import { NExpressionsLesson } from '../content/lessons/NExpressionsLesson.tsx'
import { flashcards } from '../content/flashcards.ts'
import { skills } from '../content/skills.ts'
import { createMemoryStore, type ProgressStore } from '../progress/store.ts'
import { LessonPage } from './LessonPage.tsx'

// Il registro finto ha solo la lezione del primo capitolo, così il test non
// dipende da quali lezioni sono già scritte.
vi.mock('../content/lessons/index.ts', () => ({
  lessons: { n: NExpressionsLesson },
}))

function Harness({ store }: { store: ProgressStore }) {
  const [chapter, setChapter] = useState<ChapterId>('n')
  return (
    <LessonPage
      store={store}
      skills={skills}
      flashcards={flashcards}
      chapter={chapter}
      onChapter={setChapter}
      onPractise={() => {}}
    />
  )
}

test('si cambia capitolo dalla fila in alto', () => {
  render(<Harness store={createMemoryStore()} />)
  expect(
    screen.getByRole('heading', { name: 'Espressioni in N' }),
  ).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /Potenze/ }))
  expect(screen.getByRole('heading', { name: 'Potenze' })).toBeInTheDocument()
  expect(
    screen.getByText('La lezione di questo capitolo non c’è ancora.'),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Potenze/, pressed: true }),
  ).toBeInTheDocument()
})

test('dalla testata della lezione si segna il capitolo come già saputo', async () => {
  const store = createMemoryStore()
  render(<Harness store={store} />)

  fireEvent.click(await screen.findByRole('button', { name: 'Lo so già' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sì, lo so già' }))
  const undo = await screen.findByRole('button', { name: 'Annulla' })
  expect(undo).toHaveFocus()
  expect((await store.known()).map((k) => k.skill)).toEqual([
    'n.add-sub',
    'n.mul-div',
    'n.order',
    'n.parens',
    'n.brackets',
  ])

  fireEvent.click(undo)
  expect(
    await screen.findByRole('button', { name: 'Lo so già' }),
  ).toBeInTheDocument()
  expect(await store.known()).toEqual([])
})

// Un IntersectionObserver finto: il test decide quando la sentinella entra in
// vista.
function stubObserver() {
  const callbacks: IntersectionObserverCallback[] = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback)
      }
      observe() {}
      disconnect() {}
    },
  )
  return () =>
    act(() => {
      for (const cb of callbacks)
        cb(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        )
    })
}

const nCards = flashcards.filter((f) => f.chapter === 'n').map((f) => f.id)

test('le flashcard del capitolo si introducono quando la sentinella entra in vista', async () => {
  const reach = stubObserver()
  const store = createMemoryStore()
  render(<Harness store={store} />)
  await screen.findByRole('button', { name: 'Lo so già' })
  expect(await store.introduced()).toEqual([])

  reach()
  await waitFor(async () =>
    expect((await store.introduced()).map((i) => i.card).sort()).toEqual(
      [...nCards].sort(),
    ),
  )
  vi.unstubAllGlobals()
})

test('«Lo so già» introduce le flashcard del capitolo', async () => {
  stubObserver()
  const store = createMemoryStore()
  render(<Harness store={store} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Lo so già' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sì, lo so già' }))
  await screen.findByRole('button', { name: 'Annulla' })
  expect((await store.introduced()).map((i) => i.card).sort()).toEqual(
    [...nCards].sort(),
  )
  vi.unstubAllGlobals()
})

test('fare le due cose lascia una sola introduzione per carta, con la data più vecchia', async () => {
  const reach = stubObserver()
  const store = createMemoryStore()
  render(<Harness store={store} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Lo so già' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sì, lo so già' }))
  await screen.findByRole('button', { name: 'Annulla' })
  const first = await store.introduced()
  reach()
  await new Promise((r) => setTimeout(r, 20))
  expect(await store.introduced()).toEqual(first)
  expect(first).toHaveLength(nCards.length)
  vi.unstubAllGlobals()
})
