import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { skills } from '../content/skills.ts'
import { exportBackup } from '../progress/backup.ts'
import { attempt } from '../progress/fixtures.ts'
import { createMemoryStore } from '../progress/store.ts'
import { ProgressPage } from './ProgressPage.tsx'

async function stateOf(title: string) {
  return within(await screen.findByRole('listitem', { name: title }))
}

// Una riga dei tentativi dentro la scheda, come le query della scheda stessa.
function rowAt(rows: HTMLElement[], index: number) {
  const row = rows[index]
  if (!row) throw new Error(`Manca la riga ${index}`)
  return within(row)
}

test('mostra lo stato di ogni abilità', async () => {
  const store = createMemoryStore()
  for (let i = 0; i < 3; i++)
    await store.addAttempt(attempt({ skill: 'n.add-sub' }))
  render(<ProgressPage store={store} skills={skills} />)

  expect(
    (await stateOf('Addizioni e sottrazioni')).getByText('acquisita'),
  ).toBeInTheDocument()
  expect(
    (await stateOf('Moltiplicazioni e divisioni')).getByText(
      'in apprendimento',
    ),
  ).toBeInTheDocument()
  expect(
    (await stateOf('Le quattro operazioni insieme')).getByText('bloccata'),
  ).toBeInTheDocument()
})

function chooseFile(text: string) {
  const file = new File([text], 'matita.json', { type: 'application/json' })
  fireEvent.change(screen.getByLabelText('Importa un backup'), {
    target: { files: [file] },
  })
}

test('importa un backup e aggiorna lo stato', async () => {
  const backup = createMemoryStore()
  for (let i = 0; i < 3; i++)
    await backup.addAttempt(attempt({ skill: 'n.mul-div' }))
  const store = createMemoryStore()
  render(<ProgressPage store={store} skills={skills} />)
  await stateOf('Moltiplicazioni e divisioni')

  chooseFile(await exportBackup(backup))

  expect(await screen.findByRole('status')).toHaveTextContent(
    'Importati 3 tentativi.',
  )
  expect(
    (await stateOf('Moltiplicazioni e divisioni')).getByText('acquisita'),
  ).toBeInTheDocument()
})

test('un backup senza tentativi né segni dice che non contiene progressi', async () => {
  const store = createMemoryStore()
  render(<ProgressPage store={store} skills={skills} />)

  chooseFile(await exportBackup(createMemoryStore()))

  expect(await screen.findByRole('status')).toHaveTextContent(
    'Il backup non contiene progressi.',
  )
})

test('un file non valido si rifiuta e i progressi restano', async () => {
  const store = createMemoryStore()
  await store.addAttempt(attempt({ id: 'kept' }))
  render(<ProgressPage store={store} skills={skills} />)

  chooseFile('non sono un backup')

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Il file non è un backup di Matita.',
  )
  expect((await store.attempts()).map((a) => a.id)).toEqual(['kept'])
})

// Sei tentativi sulla stessa abilità: l’ultimo esercizio, del seme 100, è il
// primo della fila e il più vecchio, del seme 3, non c’è.
test('nella scheda gli ultimi cinque tentativi, dal più recente', async () => {
  const store = createMemoryStore()
  await store.putAttempts([
    attempt({
      skill: 'n.add-sub',
      seed: 3,
      answer: '40',
      outcome: 'correct',
      answeredAt: Date.UTC(2026, 8, 10, 9),
    }),
    attempt({
      skill: 'n.add-sub',
      seed: 7,
      answer: '2',
      outcome: 'wrong',
      answeredAt: Date.UTC(2026, 8, 11, 9),
    }),
    attempt({
      skill: 'n.add-sub',
      seed: 11,
      answer: 'x',
      outcome: 'invalid',
      answeredAt: Date.UTC(2026, 8, 12, 9),
    }),
    attempt({
      skill: 'n.add-sub',
      seed: 27,
      answer: '99',
      outcome: 'correct',
      answeredAt: Date.UTC(2026, 8, 13, 9),
    }),
    attempt({
      skill: 'n.add-sub',
      seed: 42,
      answer: '66',
      outcome: 'misconception',
      misconception: 'add-sub-right-to-left',
      answeredAt: Date.UTC(2026, 8, 14, 9),
    }),
    attempt({
      skill: 'n.add-sub',
      seed: 100,
      answer: '50',
      outcome: 'correct',
      answeredAt: Date.UTC(2026, 8, 15, 9),
    }),
  ])
  render(<ProgressPage store={store} skills={skills} />)

  const card = await stateOf('Addizioni e sottrazioni')
  const rows = card.getAllByRole('listitem')
  expect(rows).toHaveLength(5)

  const newest = rowAt(rows, 0)
  expect(newest.getByRole('math', { name: '16 − 15 − 1' })).toBeInTheDocument()
  expect(newest.getByText('50')).toBeInTheDocument()
  expect(newest.getByText('corretto')).toBeInTheDocument()
  expect(newest.getByText('15 settembre')).toBeInTheDocument()
  expect(newest.queryByText(/partendo da destra/)).toBeNull()

  const errored = rowAt(rows, 1)
  expect(
    errored.getByRole('math', { name: '23 − 16 + 27 + 32' }),
  ).toBeInTheDocument()
  expect(errored.getByText('66')).toBeInTheDocument()
  expect(errored.getByText('errore tipico')).toBeInTheDocument()
  expect(errored.getByText('14 settembre')).toBeInTheDocument()
  expect(
    errored.getByText(
      'Hai svolto addizioni e sottrazioni partendo da destra. + e − hanno la stessa priorità: si svolgono nell’ordine in cui compaiono, da sinistra a destra.',
    ),
  ).toBeInTheDocument()

  expect(
    rowAt(rows, 2).getByRole('math', { name: '2 + 9 − 3 + 5' }),
  ).toBeInTheDocument()
  expect(rowAt(rows, 2).getByText('99')).toBeInTheDocument()
  expect(rowAt(rows, 3).getByText('non valido')).toBeInTheDocument()
  expect(rowAt(rows, 4).getByText('sbagliato')).toBeInTheDocument()
  expect(rowAt(rows, 4).getByText('11 settembre')).toBeInTheDocument()
  expect(card.queryByRole('math', { name: '2 + 4 − 3 + 9 + 28' })).toBeNull()
})

// Il generatore di pow.basics oggi è alla versione 2: un tentativo della 1 non
// si può ricostruire fedelmente, e l’esercizio non si mostra.
test('un tentativo che non si può ricostruire mostra risposta, esito e data', async () => {
  const store = createMemoryStore()
  await store.putAttempts([
    attempt({
      skill: 'pow.basics',
      seed: 5,
      generatorVersion: 1,
      answer: '7',
      outcome: 'wrong',
      answeredAt: Date.UTC(2026, 8, 14, 9),
    }),
  ])
  render(<ProgressPage store={store} skills={skills} chapter="pow" />)

  const card = await stateOf('La potenza')
  const rows = card.getAllByRole('listitem')
  expect(rows).toHaveLength(1)
  const row = rowAt(rows, 0)
  expect(row.queryByRole('math')).toBeNull()
  expect(row.getByText('7')).toBeInTheDocument()
  expect(row.getByText('sbagliato')).toBeInTheDocument()
  expect(row.getByText('14 settembre')).toBeInTheDocument()
})

// Vedi SPEC.md, "Il blocco è un consiglio".
test('un’abilità bloccata si allena lo stesso, e la scheda dice cosa manca', async () => {
  const onPractise = vi.fn()
  render(
    <ProgressPage
      store={createMemoryStore()}
      skills={skills}
      onPractise={onPractise}
    />,
  )
  const order = await stateOf('Le quattro operazioni insieme')
  expect(order.getByText('bloccata')).toBeInTheDocument()
  expect(
    order.getByText(
      'Prima: Addizioni e sottrazioni, Moltiplicazioni e divisioni',
    ),
  ).toBeInTheDocument()
  fireEvent.click(order.getByRole('button', { name: 'Allena lo stesso' }))
  expect(onPractise).toHaveBeenCalledWith('n.order')

  const addSub = await stateOf('Addizioni e sottrazioni')
  expect(addSub.getByRole('button', { name: 'Allena' })).toBeInTheDocument()
})
