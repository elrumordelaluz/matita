import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ZExpressionsLesson } from './ZExpressionsLesson.tsx'

function lesson(onPractise = vi.fn()) {
  render(<ZExpressionsLesson onPractise={onPractise} />)
  return onPractise
}

function lines(example: HTMLElement) {
  return within(example)
    .getAllByRole('listitem', { name: /^Riga/ })
    .map((li) => within(li).getAllByRole('math')[0]?.getAttribute('aria-label'))
}

test('un esempio svolto mostra i conti con i segni', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: −3 + (−1) − (−6)',
  })
  const [first] = within(example).getAllByRole('listitem', { name: /^Riga/ })
  if (!first) throw new Error('Manca la riga')
  const open = within(first).getByRole('button', {
    name: 'Mostra un passaggio',
  })
  fireEvent.click(open)
  expect(within(first).getByText('−3 + (−1) = −4')).toBeInTheDocument()
  fireEvent.click(open)
  expect(within(first).getByText('−4 − (−6) = 2')).toBeInTheDocument()
})

test('il meno davanti alla parentesi cambia il segno in una riga a sé', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: −(−7 + 1) + 2',
  })
  expect(lines(example)).toEqual(['−(−6) + 2', '6 + 2', '8'])
  const [, second] = within(example).getAllByRole('listitem', {
    name: /^Riga/,
  })
  if (!second) throw new Error('Manca la riga')
  fireEvent.click(
    within(second).getByRole('button', { name: 'Mostra un passaggio' }),
  )
  expect(within(second).getByText('−(−6) = 6')).toBeInTheDocument()
  expect(
    within(second).getByText('il meno cambia il segno'),
  ).toBeInTheDocument()
})

test('gli esempi svolti mostrano le stesse righe della soluzione', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: 7 − [−2 × (−5 − (−1)) − (−6)]',
  })
  expect(lines(example)).toEqual([
    '7 − [−2 × (−4) − (−6)]',
    '7 − [8 − (−6)]',
    '7 − 14',
    '−7',
  ])
})

test('una domanda di controllo riconosce la regola dei segni usata male', () => {
  lesson()
  const question = screen.getByRole('group', {
    name: 'Domanda: −5 × (+9) × (−2)',
  })
  const input = within(question).getByLabelText('Risposta')
  const check = within(question).getByRole('button', { name: 'Controlla' })

  fireEvent.change(input, { target: { value: '-90' } })
  fireEvent.click(check)
  expect(within(question).getByRole('status')).toHaveTextContent(
    'segni uguali danno più',
  )

  fireEvent.change(input, { target: { value: '90' } })
  fireEvent.click(check)
  expect(within(question).getByRole('status')).toHaveTextContent('Esatto!')
})

test('una domanda sul meno davanti alla parentesi', () => {
  lesson()
  const question = screen.getByRole('group', {
    name: 'Domanda: 6 − (−1 + (−1))',
  })
  const input = within(question).getByLabelText('Risposta')
  const check = within(question).getByRole('button', { name: 'Controlla' })

  fireEvent.change(input, { target: { value: '6' } })
  fireEvent.click(check)
  expect(within(question).getByRole('status')).toHaveTextContent(
    'senza cambiare i segni dentro',
  )

  fireEvent.change(input, { target: { value: '8' } })
  fireEvent.click(check)
  expect(within(question).getByRole('status')).toHaveTextContent('Esatto!')
})

test('dalla lezione si passa alla pratica della somma algebrica', () => {
  const onPractise = lesson()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(onPractise).toHaveBeenCalledWith('z.add-sub')
})
