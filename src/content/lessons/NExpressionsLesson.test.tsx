import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { NExpressionsLesson } from './NExpressionsLesson.tsx'

function lesson(onPractise = vi.fn()) {
  render(<NExpressionsLesson onPractise={onPractise} />)
  return onPractise
}

test('un esempio svolto si apre passaggio per passaggio', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: 6 : 3 + 3 × 8',
  })
  const [first, second] = within(example).getAllByRole('listitem', {
    name: /^Riga/,
  })
  if (!first || !second) throw new Error('Mancano le righe')
  expect(
    within(first).getByRole('math', { name: '2 + 24' }),
  ).toBeInTheDocument()
  expect(within(first).queryByText('6 : 3 = 2')).toBeNull()

  const open = within(first).getByRole('button', {
    name: 'Mostra un passaggio',
  })
  fireEvent.click(open)
  expect(within(first).getByText('6 : 3 = 2')).toBeInTheDocument()
  expect(within(first).queryByText('3 × 8 = 24')).toBeNull()

  fireEvent.click(open)
  expect(within(first).getByText('3 × 8 = 24')).toBeInTheDocument()
  expect(
    within(first).queryByRole('button', { name: 'Mostra un passaggio' }),
  ).toBeNull()
  expect(within(second).queryByText('2 + 24 = 26')).toBeNull()
})

test('gli esempi svolti mostrano le stesse righe della soluzione', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: [4 × (8 + 8) − 20] : 4 + 16',
  })
  expect(
    within(example)
      .getAllByRole('listitem', { name: /^Riga/ })
      .map((li) =>
        within(li).getAllByRole('math')[0]?.getAttribute('aria-label'),
      ),
  ).toEqual([
    '[4 × 16 − 20] : 4 + 16',
    '[64 − 20] : 4 + 16',
    '44 : 4 + 16',
    '11 + 16',
    '27',
  ])
})

test('una domanda di controllo dà l’esito', () => {
  lesson()
  const question = screen.getByRole('group', {
    name: 'Domanda: 14 + 10 : 2 × 3',
  })
  const input = within(question).getByLabelText('Risposta')
  const check = within(question).getByRole('button', { name: 'Controlla' })

  fireEvent.change(input, { target: { value: '36' } })
  fireEvent.click(check)
  expect(within(question).getByRole('status')).toHaveTextContent(
    'Senza parentesi si fanno prima × e :',
  )

  fireEvent.change(input, { target: { value: '29' } })
  fireEvent.click(check)
  expect(within(question).getByRole('status')).toHaveTextContent('Esatto!')
})

test('dalla lezione si passa alla pratica della prima abilità', () => {
  const onPractise = lesson()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(onPractise).toHaveBeenCalledWith('n.add-sub')
})
