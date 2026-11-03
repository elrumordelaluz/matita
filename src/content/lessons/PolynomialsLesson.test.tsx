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

test('monomio per polinomio: un passaggio, con i prodotti a due a due', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: 2a(2a² + b² − 3b)',
  })
  expect(lines(example)).toEqual(['4a³ + 2ab² − 6ab'])
  fireEvent.click(within(example).getByRole('button', { name: 'Apri tutto' }))
  const products = within(example).getByRole('list', {
    name: 'I prodotti a due a due',
  })
  expect(
    within(products)
      .getAllByRole('listitem')
      .map((li) => li.textContent),
  ).toEqual(['2a · 2a² = 4a³', '2a · b² = 2ab²', '2a · (−3b) = −6ab'])
  expect(
    within(example).getByText('ogni termine per ogni termine'),
  ).toBeInTheDocument()
})

test('la domanda sul monomio per polinomio riconosce la distributiva sul primo termine', () => {
  lesson()
  const name = '−2x²(x + 3)'
  expect(answer(name, '-2x^3 + 3')).toHaveTextContent(
    'Hai moltiplicato il monomio solo per il primo termine della parentesi.',
  )
  expect(answer(name, '-2x^3 - 6x^2')).toHaveTextContent('Esatto!')
})

test('polinomio per polinomio: la distributiva, poi la riduzione dei simili', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: (−4a + 5b)(5a + b)',
  })
  expect(lines(example)).toEqual([
    '−20a² − 4ab + 25ab + 5b²',
    '−20a² + 21ab + 5b²',
  ])
  fireEvent.click(within(example).getByRole('button', { name: 'Apri tutto' }))
  expect(
    within(
      within(example).getByRole('list', { name: 'I prodotti a due a due' }),
    )
      .getAllByRole('listitem')
      .map((li) => li.textContent),
  ).toEqual([
    '−4a · 5a = −20a²',
    '−4a · b = −4ab',
    '5b · 5a = 25ab',
    '5b · b = 5b²',
  ])
})

test('la domanda sul prodotto di polinomi riconosce gli esponenti sommati fra simili', () => {
  lesson()
  const name = '(2a + 2)(−2a + 3)'
  expect(answer(name, '-2a^2 + 6')).toHaveTextContent(
    'Fra monomi simili hai sommato anche gli esponenti.',
  )
  expect(answer(name, '-4a^2 + 2a + 6')).toHaveTextContent('Esatto!')
})

test('il quadrato di un binomio comincia dalla riga della formula, con A e B', () => {
  lesson()
  const example = screen.getByRole('figure', { name: 'Esempio: (5a − 2b)²' })
  expect(lines(example)).toEqual([
    '(5a)² − 2 · 5a · 2b + (2b)²',
    '25a² − 2 · 5a · 2b + 4b²',
    '25a² − 20ab + 4b²',
  ])
  const [first] = within(example).getAllByRole('listitem', { name: /^Riga/ })
  if (!first) throw new Error('Manca la prima riga')
  fireEvent.click(
    within(first).getByRole('button', { name: 'Mostra un passaggio' }),
  )
  expect(
    within(first).getByText('(A − B)² = A² − 2AB + B²'),
  ).toBeInTheDocument()
  expect(within(first).getByText('A = 5a, B = 2b')).toBeInTheDocument()
})

test('la domanda sul quadrato riconosce il segno sbagliato e la potenza distribuita', () => {
  lesson()
  const name = '(2y − 3)²'
  expect(answer(name, '4y^2 - 12y - 9')).toHaveTextContent(
    'Nel quadrato di una differenza hai dato il meno anche all’ultimo termine.',
  )
  expect(answer(name, '4y^2 + 9')).toHaveTextContent(
    'Hai elevato ogni termine della parentesi',
  )
  expect(answer(name, '4y^2 - 12y + 9')).toHaveTextContent('Esatto!')
})

test('la somma per differenza: la formula, poi le potenze', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: (3x + 4)(3x − 4)',
  })
  expect(lines(example)).toEqual(['(3x)² − 4²', '9x² − 16'])
})

test('la domanda sulla somma per differenza riconosce il più', () => {
  lesson()
  const name = '(4a − 1)(4a + 1)'
  expect(answer(name, '16a^2 + 1')).toHaveTextContent(
    'Nella somma per differenza hai sommato i quadrati.',
  )
  expect(answer(name, '16a^2 - 1')).toHaveTextContent('Esatto!')
})

test('il cubo di un binomio: la formula, le potenze, i prodotti', () => {
  lesson()
  const example = screen.getByRole('figure', { name: 'Esempio: (y + 2)³' })
  expect(lines(example)).toEqual([
    'y³ + 3 · y² · 2 + 3 · y · 2² + 2³',
    'y³ + 3 · y² · 2 + 3 · y · 4 + 8',
    'y³ + 6y² + 12y + 8',
  ])
})

test('la domanda sul quadrato di un trinomio riconosce la potenza distribuita', () => {
  lesson()
  const name = '(2a − 3b + 4)²'
  expect(answer(name, '4a^2 + 9b^2 + 16')).toHaveTextContent(
    'Hai elevato ogni termine della parentesi',
  )
  expect(answer(name, '4a^2 + 9b^2 + 16 - 12ab + 16a - 24b')).toHaveTextContent(
    'Esatto!',
  )
})

test('dalla lezione si passa alla pratica della prima abilità', () => {
  const onPractise = lesson()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(onPractise).toHaveBeenCalledWith('poly.add-sub')
})
