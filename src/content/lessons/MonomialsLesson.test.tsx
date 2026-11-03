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

test('la forma normale è un passaggio solo, con la sua regola', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: 5a²b · 5b²a³',
  })
  expect(lines(example)).toEqual(['25a⁵b³'])
  fireEvent.click(within(example).getByRole('button', { name: 'Apri tutto' }))
  expect(within(example).getByText('5a²b · 5b²a³ = 25a⁵b³')).toBeInTheDocument()
  expect(
    within(example).getByText(
      'coefficienti per coefficienti, esponenti sommati',
    ),
  ).toBeInTheDocument()
})

test('la domanda sulla forma normale chiede di riscrivere le lettere ripetute', () => {
  lesson()
  expect(answer('6c⁴ca³', '6c^4ca^3')).toHaveTextContent(
    'Scrivi ogni monomio in forma normale.',
  )
  expect(answer('6c⁴ca³', '6c^5a^3')).toHaveTextContent('Esatto!')
})

test('la somma riduce ogni gruppo di simili in un passaggio, anche lontani', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: −x² + xy + x²y + 4x² − 9xy',
  })
  expect(lines(example)).toEqual(['3x² − 8xy + x²y'])
  fireEvent.click(within(example).getByRole('button', { name: 'Apri tutto' }))
  expect(within(example).getByText('−x² + 4x² = 3x²')).toBeInTheDocument()
  expect(within(example).getByText('xy − 9xy = −8xy')).toBeInTheDocument()
})

test('la domanda sulla somma riconosce il coefficiente sottinteso contato zero', () => {
  lesson()
  expect(answer('2x − x + 9x', '11x')).toHaveTextContent(
    'Hai contato zero un coefficiente che non si vede.',
  )
  expect(answer('2x − x + 9x', '10x')).toHaveTextContent('Esatto!')
})

test('prodotto e quoziente vanno da sinistra a destra, un passaggio ciascuno', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: 3x · 5xy² : 2y',
  })
  expect(lines(example)).toEqual(['15/2 x²y'])
  fireEvent.click(within(example).getByRole('button', { name: 'Apri tutto' }))
  expect(within(example).getByText('3x · 5xy² = 15x²y²')).toBeInTheDocument()
  expect(
    within(example).getByText('15x²y² : 2y = 15/2 x²y'),
  ).toBeInTheDocument()
})

test('la domanda sul prodotto riconosce gli esponenti moltiplicati', () => {
  lesson()
  expect(answer('4a³b³ · a⁴', '4a^12b^3')).toHaveTextContent(
    'Fra potenze con la stessa base hai moltiplicato',
  )
  expect(answer('4a³b³ · a⁴', '4a^7b^3')).toHaveTextContent('Esatto!')
})

test('la potenza del monomio viene prima del prodotto', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: (−3b³a²)² · (−2a²b³)',
  })
  expect(lines(example)).toEqual(['9a⁴b⁶ · (−2a²b³)', '−18a⁶b⁹'])
})

test('la domanda sulla potenza riconosce il coefficiente non elevato e il segno', () => {
  lesson()
  expect(answer('(−3x²y³)²', '3x^4y^6')).toHaveTextContent(
    'Hai elevato solo la parte letterale.',
  )
  expect(answer('(−3x²y³)²', '-9x^4y^6')).toHaveTextContent(
    'Hai lasciato il meno alla potenza di un numero negativo.',
  )
  expect(answer('(−3x²y³)²', '9x^4y^6')).toHaveTextContent('Esatto!')
})

test('un’espressione con i monomi: gruppo, potenze, prodotti, simili', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: −1/2 a(4a² + 4a²) + (2a)³ + (3a)³',
  })
  expect(lines(example)).toEqual([
    '−1/2 a · 8a² + (2a)³ + (3a)³',
    '−1/2 a · 8a² + 8a³ + 27a³',
    '−4a³ + 8a³ + 27a³',
    '31a³',
  ])
})

test('la domanda sulle espressioni riconosce gli esponenti sommati fra simili', () => {
  lesson()
  const name = 'a³ · (−2a³) + (3a²)³ − (−2a³)²'
  expect(answer(name, '21a^18')).toHaveTextContent(
    'Fra monomi simili hai sommato anche gli esponenti.',
  )
  expect(answer(name, '21a^6')).toHaveTextContent('Esatto!')
})

test('dalla lezione si passa alla pratica della prima abilità', () => {
  const onPractise = lesson()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(onPractise).toHaveBeenCalledWith('mono.value')
})
