import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { skills } from '../content/skills.ts'
import { exportBackup } from '../progress/backup.ts'
import { attempt } from '../progress/fixtures.ts'
import { createMemoryStore } from '../progress/store.ts'
import { ProgressPage } from './ProgressPage.tsx'

async function stateOf(title: string) {
  return within(await screen.findByRole('listitem', { name: title }))
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
