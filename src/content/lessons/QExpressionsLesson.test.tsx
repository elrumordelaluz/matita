import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { QExpressionsLesson } from './QExpressionsLesson.tsx'

function lesson(onPractise = vi.fn()) {
  render(<QExpressionsLesson onPractise={onPractise} />)
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

test('un esempio svolto scrive le frazioni ridotte, passaggio per passaggio', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: 5/12 + (−1/4) − (−1/2)',
  })
  const [first] = within(example).getAllByRole('listitem', { name: /^Riga/ })
  if (!first) throw new Error('Manca la riga')
  expect(within(first).getByRole('math', { name: '2/3' })).toBeInTheDocument()
  const open = within(first).getByRole('button', {
    name: 'Mostra un passaggio',
  })
  fireEvent.click(open)
  expect(within(first).getByText('5/12 + (−1/4) = 1/6')).toBeInTheDocument()
  fireEvent.click(open)
  expect(within(first).getByText('1/6 − (−1/2) = 2/3')).toBeInTheDocument()
})

test('gli esempi svolti mostrano le stesse righe della soluzione', () => {
  lesson()
  const example = screen.getByRole('figure', {
    name: 'Esempio: −5/4 + (−2) × (−2/3 + 1/4)',
  })
  expect(
    within(example)
      .getAllByRole('listitem', { name: /^Riga/ })
      .map((li) =>
        within(li).getAllByRole('math')[0]?.getAttribute('aria-label'),
      ),
  ).toEqual(['−5/4 + (−2) × (−5/12)', '−5/4 + 5/6', '−5/12'])
})

test('una frazione non ridotta va riscritta, e la domanda resta aperta', () => {
  lesson()
  const check = question('−4/3 − 5/6 − (−5/4)')
  const status = check('-22/24')
  expect(status).toHaveTextContent('Riduci ai minimi termini.')
  expect(status).toHaveTextContent('Il valore è giusto')
  expect(check('-11/12')).toHaveTextContent('Esatto!')
})

test('una divisione svolta senza il reciproco è un errore tipico', () => {
  lesson()
  const check = question('−2/5 : (−4/3)')
  expect(check('8/15')).toHaveTextContent('moltiplicare per il suo reciproco')
  expect(check('3/10')).toHaveTextContent('Esatto!')
})

test('un decimale al posto della frazione va riscritto', () => {
  lesson()
  const check = question('3 − (2/3 − (−5/6))')
  expect(check('1,5')).toHaveTextContent('Scrivi il risultato come frazione.')
  expect(check('3/2')).toHaveTextContent('Esatto!')
})

test('dalla lezione si passa alla pratica della somma di frazioni', () => {
  const onPractise = lesson()
  fireEvent.click(screen.getByRole('button', { name: 'Inizia la pratica' }))
  expect(onPractise).toHaveBeenCalledWith('q.add-sub')
})
