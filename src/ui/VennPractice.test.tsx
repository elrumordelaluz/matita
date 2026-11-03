import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { quantities, type Exercise } from '../engine/index.ts'
import { PracticePage } from './PracticePage.tsx'

// Un problema con due insiemi nella pratica (SPEC.md, "Insiemi",
// "Problemi"): prima di rispondere solo il testo, dopo l'esito la soluzione
// e il diagramma, con le regioni riempite fino alla riga mostrata.

const two = quantities(2)

// C3, Esempio 5.36.
const exercise: Exercise = {
  kind: 'problem',
  skill: 'set.venn2',
  seed: 1,
  generatorVersion: 1,
  problem: {
    setting: 'languages',
    regions: [4n, 12n, 7n, 5n],
    data: [two.total, two.atLeast(0), two.atLeast(1), two.region(3)],
    asked: two.region(0),
  },
}

function answer(text: string) {
  fireEvent.change(screen.getByLabelText('Risultato'), {
    target: { value: text },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
}

test('prima di rispondere si vede solo il testo', () => {
  render(<PracticePage createExercise={() => exercise} />)
  expect(
    screen.getByText(
      'In una classe di 28 studenti, 17 studiano inglese, 12 studiano francese e 5 studiano entrambe le lingue. Quanti non studiano nessuna delle due lingue?',
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('group', { name: 'Diagramma di Eulero-Venn' }),
  ).toBeNull()
})

test('dopo l’esito il diagramma ha le regioni trovate, con i loro nomi', () => {
  render(<PracticePage createExercise={() => exercise} />)
  answer('4')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  const diagram = screen.getByRole('group', {
    name: 'Diagramma di Eulero-Venn',
  })
  expect(
    within(diagram).getByRole('img', { name: 'entrambi: 5' }),
  ).toBeInTheDocument()
  expect(
    within(diagram).getByRole('img', { name: 'nessuno: 4' }),
  ).toBeInTheDocument()
  // Le righe della soluzione non trovano "solo inglese": resta vuota.
  expect(
    within(diagram).getByRole('img', { name: 'solo inglese' }),
  ).toBeInTheDocument()
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(
    within(solution).getByRole('math', { name: 'nessuno = 28 − 24 = 4' }),
  ).toBeInTheDocument()
})

test('la regione esterna dimenticata mostra la spiegazione', () => {
  render(<PracticePage createExercise={() => exercise} />)
  answer('24')
  expect(
    screen.getByText(/la regione esterna del diagramma/),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('group', { name: 'Diagramma di Eulero-Venn' }),
  ).toBeInTheDocument()
})
