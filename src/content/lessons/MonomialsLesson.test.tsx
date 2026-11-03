import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { MonomialsLesson } from './MonomialsLesson.tsx'

// La lezione del capitolo "Monomi": le righe degli esempi sono quelle del
// motore, e le domande riconoscono i loro errori tipici.

function lesson(onPractise = vi.fn()) {
  render(<MonomialsLesson onPractise={onPractise} />)
  return onPractise
}

function lines(example: HTMLElement) {
  return within(example)
    .getAllByRole('listitem', { name: /^Riga/ })
    .map((li) => within(li).getAllByRole('math')[0]?.getAttribute('aria-label'))
}

function answer(name: string, value: string) {
  const question = screen.getByRole('group', { name: `Domanda: ${name}` })
  fireEvent.change(within(question).getByLabelText('Risposta'), {
    target: { value },
  })
  fireEvent.click(within(question).getByRole('button', { name: 'Controlla' }))
  return within(question).getByRole('status')
}

test('il valore numerico comincia dalla riga della sostituzione', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: 2a² + 2a, per a = −2',
  })
  expect(lines(example)).toEqual([
    '2 × (−2)² + 2 × (−2)',
    '2 × 4 + 2 × (−2)',
    '8 + (−4)',
    '4',
  ])
  const [first] = within(example).getAllByRole('listitem', { name: /^Riga/ })
  if (!first) throw new Error('Manca la prima riga')
  fireEvent.click(
    within(first).getByRole('button', { name: 'Mostra un passaggio' }),
  )
  expect(within(first).getByText('a = −2')).toBeInTheDocument()
  expect(
    within(first).getByText('al posto della lettera, il suo valore'),
  ).toBeInTheDocument()
})

test('la domanda sul valore riconosce il negativo senza tonde', () => {
  lesson()
  // −5 × (−2)³ − 3 × (−2²) = 40 + 12
  expect(answer('−5a³ − 3a², per a = −2', '52')).toHaveTextContent(
    'Hai sostituito un numero negativo senza le parentesi.',
  )
  expect(answer('−5a³ − 3a², per a = −2', '28')).toHaveTextContent('Esatto!')
})

test('dalla lezione si passa alla pratica della prima abilità', () => {
  const onPractise = lesson()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(onPractise).toHaveBeenCalledWith('mono.value')
})
