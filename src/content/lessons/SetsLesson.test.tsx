import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { SetsLesson } from './SetsLesson.tsx'

function lesson(onPractise = vi.fn()) {
  render(<SetsLesson onPractise={onPractise} />)
  return onPractise
}

function question(name: string) {
  const group = screen.getByRole('group', { name: `Domanda: ${name}` })
  const input = within(group).getByLabelText('Risposta')
  const check = within(group).getByRole('button', { name: 'Controlla' })
  return (answer: string) => {
    fireEvent.change(input, { target: { value: answer } })
    fireEvent.click(check)
    return within(group).getByRole('status')
  }
}

function rows(name: string) {
  const example = screen.getByRole('figure', { name: `Esempio: ${name}` })
  return within(example)
    .getAllByRole('listitem', { name: /^Riga/ })
    .map((li) => within(li).getAllByRole('math')[0]?.getAttribute('aria-label'))
}

test('la lezione comincia dalle rappresentazioni', () => {
  lesson()
  const [first] = screen.getAllByRole('heading', { level: 3 })
  expect(first).toHaveTextContent('Tre modi di scrivere un insieme')
  const track = screen.getByRole('navigation', {
    name: 'Percorso della lezione',
  })
  const [link] = within(track).getAllByRole('link')
  expect(link).toHaveAttribute('href', '#lezione-rappresentazioni')
})

test('un esempio svolto elenca gli elementi in ordine crescente', () => {
  lesson()
  expect(rows('{x ∈ N | 5 < x ≤ 11}')).toEqual(['{6, 7, 8, 9, 10, 11}'])
  expect(rows('{x ∈ N | x ≤ 6 e x è pari}')).toEqual(['{0, 2, 4, 6}'])
})

test('l’ordine non conta, ma le graffe sì', () => {
  lesson()
  const check = question('{x ∈ N | 1 < x ≤ 5}')
  const status = check('2, 3, 4, 5')
  expect(status).toHaveTextContent('Un insieme si scrive fra graffe.')
  expect(status).toHaveTextContent('Il valore è giusto')
  expect(check('{5, 4, 3, 2}')).toHaveTextContent('Esatto!')
})

test('lo zero escluso dai pari è un errore tipico', () => {
  lesson()
  const check = question('{x ∈ N | x < 10 e x è pari}')
  expect(check('{2, 4, 6, 8}')).toHaveTextContent('Lo zero è pari')
  expect(check('{0, 2, 4, 6, 8, 10}')).toHaveTextContent('Hai scambiato < e ≤.')
  expect(check('{0, 2, 4, 6, 8}')).toHaveTextContent('Esatto!')
})

test('un esempio di scritture dice per ogni simbolo perché', () => {
  lesson()
  const name = 'A = {2, 7, 8, 10}: {2} … A, 7 … A, 3 … A, {7, 2, 3} … A'
  expect(rows(name)).toEqual(['{2} ⊂ A', '7 ∈ A', '3 ∉ A', '{7, 2, 3} ⊄ A'])
  const example = screen.getByRole('figure', { name: `Esempio: ${name}` })
  expect(within(example).getByText('3 non sta in A')).toBeInTheDocument()
})

test('la domanda sulle scritture si risponde con i tasti', () => {
  lesson()
  const group = screen.getByRole('group', {
    name: 'Domanda: A = {1, 2, 6, 8}: {6, 2, 8, 1} … A, 2 … A, 10 … A, {1, 8} … A',
  })
  const check = within(group).getByRole('button', { name: 'Controlla' })
  expect(check).toBeDisabled()
  const pick = (symbols: readonly string[]) =>
    symbols.forEach((symbol, i) => {
      const row = within(group).getByRole('group', {
        name: new RegExp(`^Scrittura ${i + 1}:`),
      })
      fireEvent.click(within(row).getByRole('button', { name: symbol }))
    })
  pick(['⊂', '∈', '∉', '⊂'])
  fireEvent.click(check)
  expect(within(group).getByRole('status')).toHaveTextContent(
    'I due insiemi hanno gli stessi elementi',
  )
  pick(['='])
  fireEvent.click(check)
  expect(within(group).getByRole('status')).toHaveTextContent('Esatto!')
})

test('un esempio di operazioni scrive una riga per operazione, con il perché', () => {
  lesson()
  const name =
    'A = {6, 7, 8, 14}, B = {2, 3, 4, 6, 10, 14}, C = {1, 4, 8, 9, 13}: (A ∪ B) ∩ C'
  expect(rows(name)).toEqual([
    'A ∪ B = {2, 3, 4, 6, 7, 8, 10, 14}',
    '(A ∪ B) ∩ C = {4, 8}',
  ])
  const example = screen.getByRole('figure', { name: `Esempio: ${name}` })
  expect(
    within(example).getByText('in (A ∪ B) e in C: 4, 8'),
  ).toBeInTheDocument()
})

test('il complementare si prende rispetto a U', () => {
  lesson()
  expect(
    rows(
      'A = {2, 4, 7, 8}, B = {2, 3, 6, 9}, U = {1, 2, 3, 4, 5, 6, 7, 8, 9}: Ā ∩ B',
    ),
  ).toEqual(['Ā = {1, 3, 5, 6, 9}', 'Ā ∩ B = {3, 6, 9}'])
})

test('l’unione al posto dell’intersezione è un errore tipico', () => {
  lesson()
  const check = question('A = {2, 3, 6, 7, 11}, B = {1, 2, 4, 6, 7, 12}: A ∩ B')
  expect(check('{1, 2, 3, 4, 6, 7, 11, 12}')).toHaveTextContent(
    'Hai scambiato l’unione con l’intersezione.',
  )
  expect(check('{7, 6, 2}')).toHaveTextContent('Esatto!')
})

test('B − A al posto di A − B è un errore tipico', () => {
  lesson()
  const check = question('A = {4, 11, 13}, B = {2, 5, 9, 10, 11, 15}: A − B')
  expect(check('{2, 5, 9, 10, 15}')).toHaveTextContent(
    'La differenza non è commutativa',
  )
  expect(check('{4, 13}')).toHaveTextContent('Esatto!')
})

test('dalla lezione si passa alla pratica dell’elencazione', () => {
  const onPractise = lesson()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(onPractise).toHaveBeenCalledWith('set.roster')
})
