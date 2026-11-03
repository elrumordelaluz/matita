import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { PolynomialsLesson } from './PolynomialsLesson.tsx'

// La lezione del capitolo "Polinomi": le righe degli esempi sono quelle del
// motore, e le domande riconoscono i loro errori tipici.

function lesson(onPractise = vi.fn()) {
  render(<PolynomialsLesson onPractise={onPractise} />)
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

test('nella somma di polinomi prima cadono le parentesi, poi si sommano i simili', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: (−5x³ + 5x² + 9x + 6) − (8x² + 6x − 1)',
  })
  expect(lines(example)).toEqual([
    '−5x³ + 5x² + 9x + 6 − 8x² − 6x + 1',
    '−5x³ − 3x² + 3x + 7',
  ])
  fireEvent.click(within(example).getByRole('button', { name: 'Apri tutto' }))
  expect(
    within(example).getByText('−(8x² + 6x − 1) = −8x² − 6x + 1'),
  ).toBeInTheDocument()
  expect(
    within(example).getByText('il meno cambia il segno di ogni termine'),
  ).toBeInTheDocument()
})

test('la domanda sulla somma riconosce i segni lasciati dentro la parentesi', () => {
  lesson()
  const name = 'y − (y² + 6y − 9)'
  expect(answer(name, '7y - y^2 - 9')).toHaveTextContent(
    'Hai tolto una parentesi preceduta dal meno senza cambiare i segni dentro.',
  )
  expect(answer(name, '-5y - y^2 + 9')).toHaveTextContent('Esatto!')
})

test('dalla lezione si passa alla pratica della prima abilità', () => {
  const onPractise = lesson()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(onPractise).toHaveBeenCalledWith('poly.add-sub')
})
