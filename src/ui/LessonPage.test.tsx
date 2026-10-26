import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import type { ChapterId } from '../content/chapters.ts'
import { NExpressionsLesson } from '../content/lessons/NExpressionsLesson.tsx'
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
