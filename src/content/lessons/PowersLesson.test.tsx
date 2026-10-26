import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { PowersLesson } from './PowersLesson.tsx'

function lesson(onPractise = vi.fn()) {
  render(<PowersLesson onPractise={onPractise} />)
  return onPractise
}

function lines(example: HTMLElement) {
  return within(example)
    .getAllByRole('listitem', { name: /^Riga/ })
    .map((li) => within(li).getAllByRole('math')[0]?.getAttribute('aria-label'))
}

test('un esempio svolto si apre passaggio per passaggio', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: 9 + (9 − 5)² × 6',
  })
  const [first, second] = within(example).getAllByRole('listitem', {
    name: /^Riga/,
  })
  if (!first || !second) throw new Error('Mancano le righe')
  expect(
    within(first).getByRole('math', { name: '9 + 4² × 6' }),
  ).toBeInTheDocument()

  fireEvent.click(
    within(first).getByRole('button', { name: 'Mostra un passaggio' }),
  )
  expect(within(first).getByText('9 − 5 = 4')).toBeInTheDocument()

  fireEvent.click(
    within(second).getByRole('button', { name: 'Mostra un passaggio' }),
  )
  expect(within(second).getByText('4² = 16')).toBeInTheDocument()
  expect(within(second).getByText('prima le potenze')).toBeInTheDocument()
})

test('gli esempi svolti mostrano le stesse righe della soluzione', () => {
  lesson()
  expect(
    lines(screen.getByRole('figure', { name: 'Esempio: 9 + (9 − 5)² × 6' })),
  ).toEqual(['9 + 4² × 6', '9 + 16 × 6', '9 + 96', '105'])
  expect(
    lines(screen.getByRole('figure', { name: 'Esempio: 2⁵ × 2⁶ : 2⁹' })),
  ).toEqual(['2²', '4'])
})

test('una proprietà si legge come passaggio, con la sua regola', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: (3²)³ : 3⁴',
  })
  expect(lines(example)).toEqual(['3²', '9'])
  fireEvent.click(within(example).getByRole('button', { name: 'Apri tutto' }))
  expect(within(example).getByText('(3²)³ = 3⁶')).toBeInTheDocument()
  expect(
    within(example).getByText(
      'potenza di potenza: si moltiplicano gli esponenti',
    ),
  ).toBeInTheDocument()
  expect(within(example).getByText('3⁶ : 3⁴ = 3²')).toBeInTheDocument()
})

test('una domanda di controllo riconosce base per esponente', () => {
  lesson()
  const question = screen.getByRole('group', { name: 'Domanda: 2⁶' })
  const input = within(question).getByLabelText('Risposta')
  const check = within(question).getByRole('button', { name: 'Controlla' })

  fireEvent.change(input, { target: { value: '12' } })
  fireEvent.click(check)
  expect(within(question).getByRole('status')).toHaveTextContent(
    'Hai moltiplicato la base per l’esponente.',
  )

  fireEvent.change(input, { target: { value: '64' } })
  fireEvent.click(check)
  expect(within(question).getByRole('status')).toHaveTextContent('Esatto!')
})

test('una domanda di controllo riconosce gli esponenti sommati', () => {
  lesson()
  const question = screen.getByRole('group', { name: 'Domanda: (3²)³ : 3³' })
  fireEvent.change(within(question).getByLabelText('Risposta'), {
    target: { value: '9' },
  })
  fireEvent.click(within(question).getByRole('button', { name: 'Controlla' }))
  expect(within(question).getByRole('status')).toHaveTextContent(
    'Gli esponenti si moltiplicano',
  )
})

test('dalla lezione si passa alla pratica della prima abilità', () => {
  const onPractise = lesson()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(onPractise).toHaveBeenCalledWith('pow.basics')
})
