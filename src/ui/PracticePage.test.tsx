import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { parseExpression, type Exercise } from '../engine/index.ts'
import { PracticePage } from './PracticePage.tsx'

function exercise(source: string): Exercise {
  return {
    skill: 'n.add-sub',
    seed: 1,
    generatorVersion: 1,
    expression: parseExpression(source),
  }
}

afterEach(() => {
  vi.useRealTimers()
})

function type(text: string) {
  fireEvent.change(screen.getByLabelText('Risultato'), {
    target: { value: text },
  })
}

function answer(text: string) {
  type(text)
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
}

test('mostra l’espressione da calcolare', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  expect(
    screen.getByRole('math', { name: '12 − 5 + 3 − 4' }),
  ).toBeInTheDocument()
})

test('l’anteprima mostra la risposta scritta, sotto il campo', () => {
  render(<PracticePage createExercise={() => exercise('1/2 + 1/6')} />)
  type('4/6')
  const preview = screen.getByRole('math', { name: '4/6' })
  expect(
    screen.getByLabelText('Risultato').compareDocumentPosition(preview) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
})

test('l’anteprima mostra il segno davanti all’intero', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  type('-6')
  expect(screen.getByRole('math', { name: '−6' })).toBeInTheDocument()
  type('+5')
  expect(screen.getByRole('math', { name: '+5' })).toBeInTheDocument()
})

test('l’anteprima tiene il segno al denominatore', () => {
  render(<PracticePage createExercise={() => exercise('1/2 + 1/6')} />)
  type('2/-3')
  expect(screen.getByRole('math', { name: '2/−3' })).toBeInTheDocument()
})

test('l’anteprima mostra il decimale con il separatore scritto', () => {
  render(<PracticePage createExercise={() => exercise('1/2 + 1/6')} />)
  type('0,5')
  expect(screen.getByRole('math', { name: '0,5' })).toBeInTheDocument()
})

test('ciò che non si legge non ha anteprima né messaggio', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  type('sei')
  // Resta solo la formula dell'espressione.
  expect(screen.getAllByRole('math')).toHaveLength(1)
  expect(screen.queryByRole('status')).toBeNull()
})

test('l’anteprima non giudica: il verdetto arriva a Verifica', () => {
  render(<PracticePage createExercise={() => exercise('1/2 + 1/6')} />)
  type('4/6')
  expect(screen.queryByRole('status')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
  expect(screen.getByRole('status')).toHaveTextContent(
    'Riduci ai minimi termini.',
  )
})

test('risposta giusta', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  answer('6')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  expect(screen.getByRole('region', { name: 'Soluzione' })).toBeInTheDocument()
})

test('risposta sbagliata con soluzione per righe', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  answer('14')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Non è corretto: il risultato è 6.',
  )
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(within(solution).getByRole('math', { name: '6' })).toBeInTheDocument()
  expect(within(solution).getByText('12 − 5 = 7')).toBeInTheDocument()
  expect(within(solution).getByText('10 − 4 = 6')).toBeInTheDocument()
})

test('un errore tipico mostra la spiegazione prima della soluzione', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  answer('20')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Non è corretto: il risultato è 14.',
  )
  const explanation = screen.getByText(/Senza parentesi si fanno prima × e :/)
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(
    explanation.compareDocumentPosition(solution) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(within(solution).getByText('3 × 4 = 12')).toBeInTheDocument()
  expect(screen.getByLabelText('Risultato')).toHaveAttribute('readonly')
})

test('una risposta illeggibile non chiude l’esercizio', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  answer('sei')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Scrivi il risultato come numero.',
  )
  expect(screen.queryByRole('region', { name: 'Soluzione' })).toBeNull()
  answer('6')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
})

test('il suggerimento mostra la prossima riga', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  expect(screen.queryByRole('region', { name: 'Soluzione' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(within(solution).getByRole('math', { name: '6' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Suggerimento' })).toBeDisabled()
})

test('l’esercizio successivo riparte da capo', () => {
  const sources = ['12 − 5 + 3 − 4', '20 + 8 − 15']
  let i = 0
  render(<PracticePage createExercise={() => exercise(sources[i++] ?? '')} />)
  answer('6')
  fireEvent.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
  expect(screen.getByRole('math', { name: '20 + 8 − 15' })).toBeInTheDocument()
  expect(screen.getByLabelText('Risultato')).toHaveValue('')
  expect(screen.queryByRole('status')).toBeNull()
})

test('a esercizio chiuso riferisce il tentativo', () => {
  vi.useFakeTimers({ toFake: ['Date'], now: 1_000 })
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('12 − 5 + 3 − 4')}
      onAttempt={onAttempt}
    />,
  )
  vi.setSystemTime(26_000)
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  answer('sei')
  expect(onAttempt).not.toHaveBeenCalled()
  answer('6')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith({
    exercise: exercise('12 − 5 + 3 − 4'),
    answer: '6',
    outcome: { kind: 'correct' },
    hints: 1,
    rewrites: 0,
    durationMs: 25_000,
  })
})

test('la durata riparte con l’esercizio successivo', () => {
  vi.useFakeTimers({ toFake: ['Date'], now: 1_000 })
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('12 − 5 + 3 − 4')}
      onAttempt={onAttempt}
    />,
  )
  vi.setSystemTime(11_000)
  answer('14')
  fireEvent.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
  vi.setSystemTime(18_000)
  answer('6')
  expect(onAttempt).toHaveBeenLastCalledWith(
    expect.objectContaining({
      outcome: { kind: 'correct' },
      durationMs: 7_000,
    }),
  )
})

test('anche un errore tipico chiude l’esercizio e riferisce il tentativo', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('2 + 3 × 4')}
      onAttempt={onAttempt}
    />,
  )
  answer('20')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      answer: '20',
      outcome: expect.objectContaining({
        kind: 'misconception',
        misconception: 'add-before-mul',
      }),
    }),
  )
})

test('in Z il risultato e i conti hanno il meno tipografico', () => {
  render(<PracticePage createExercise={() => exercise('−8 − (3 − (−6))')} />)
  answer('-1')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Non è corretto: il risultato è −17.',
  )
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(within(solution).getByText('3 − (−6) = 9')).toBeInTheDocument()
  expect(within(solution).getByText('−8 − 9 = −17')).toBeInTheDocument()
})

test('una risposta da riscrivere mostra il motivo e lascia aperto l’esercizio', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('1/2 + 1/6')}
      onAttempt={onAttempt}
    />,
  )
  answer('4/6')
  const status = screen.getByRole('status')
  expect(status).toHaveTextContent('Riduci ai minimi termini.')
  expect(status).toHaveTextContent('Il valore è giusto')
  expect(screen.queryByRole('region', { name: 'Soluzione' })).toBeNull()
  expect(screen.getByLabelText('Risultato')).not.toHaveAttribute('readonly')
  expect(onAttempt).not.toHaveBeenCalled()
})

test('dopo una riscrittura il tentativo conta le riscritture', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('1/2 + 1/6')}
      onAttempt={onAttempt}
    />,
  )
  answer('4/6')
  answer('-2/-3')
  answer('2/3')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      answer: '2/3',
      outcome: { kind: 'correct' },
      rewrites: 2,
    }),
  )
})

test('le riscritture ripartono con l’esercizio successivo', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('1/2 + 1/6')}
      onAttempt={onAttempt}
    />,
  )
  answer('-2/-3')
  answer('2/3')
  fireEvent.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
  answer('2/3')
  expect(onAttempt).toHaveBeenLastCalledWith(
    expect.objectContaining({ rewrites: 0 }),
  )
})

test('ogni tasto scrive il suo simbolo al cursore nel campo', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  const field = screen.getByLabelText('Risultato') as HTMLInputElement
  for (const [label, symbol] of [
    ['meno', '−'],
    ['linea di frazione', '/'],
    ['elevato a', '^'],
    ['apri tonda', '('],
    ['chiudi tonda', ')'],
  ] as const) {
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(field.value?.endsWith(symbol)).toBe(true)
  }
  expect(field).toHaveValue('−/^()')
})

test('la riga sostituisce la selezione con il simbolo', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  type('4/6')
  const field = screen.getByLabelText('Risultato') as HTMLInputElement
  fireEvent.select(field, { target: { selectionStart: 1, selectionEnd: 3 } })
  fireEvent.click(screen.getByRole('button', { name: 'linea di frazione' }))
  expect(field).toHaveValue('4/')
})

test('dopo il tocco il campo è di nuovo focalizzato, cursore dopo il simbolo', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  type('4')
  const field = screen.getByLabelText('Risultato') as HTMLInputElement
  fireEvent.select(field, { target: { selectionStart: 1, selectionEnd: 1 } })
  fireEvent.click(screen.getByRole('button', { name: 'meno' }))
  expect(document.activeElement).toBe(field)
  expect(field.selectionStart).toBe(2)
  expect(field.selectionEnd).toBe(2)
})

test('la riga sta solo sul telefono: da sm in su non c’è', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  const row = screen.getByRole('button', { name: 'meno' }).closest('div')
  expect(row?.className).toContain('sm:hidden')
})

test('a esercizio chiuso la riga sparisce, poi torna col successivo', () => {
  render(<PracticePage createExercise={() => exercise('12 − 5 + 3 − 4')} />)
  answer('6')
  for (const label of [
    'meno',
    'linea di frazione',
    'elevato a',
    'apri tonda',
    'chiudi tonda',
  ]) {
    expect(screen.queryByRole('button', { name: label })).toBeNull()
  }
  fireEvent.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
  expect(screen.getByRole('button', { name: 'meno' })).toBeInTheDocument()
})

// "Passo passo": lo studente scrive ogni riga e il motore la controlla.

function exerciseOf(skill: Exercise['skill'], source: string): Exercise {
  return {
    skill,
    seed: 1,
    generatorVersion: 1,
    expression: parseExpression(source),
  }
}

function stepSwitch() {
  return screen.getByRole('switch', { name: 'Passo passo' })
}

function turnOnStepByStep() {
  fireEvent.click(stepSwitch())
}

function submitLine(text: string) {
  fireEvent.change(screen.getByLabelText('Riga'), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
}

test('l’interruttore Passo passo è spento e ha la sua riga sotto Prova tu', () => {
  render(<PracticePage createExercise={() => exercise('2 × 3 + 4 × 5')} />)
  const step = stepSwitch()
  expect(step).not.toBeChecked()
  // La sua riga: non sta in quella del titolo, che con la spia dell’esito
  // andrebbe a capo.
  const heading = screen.getByRole('heading', { name: 'Prova tu' })
  expect(heading.closest('div')).not.toContainElement(step)
  expect(screen.getByLabelText('Risultato')).toBeInTheDocument()
  fireEvent.click(step)
  expect(step).toBeChecked()
  expect(screen.getByLabelText('Riga')).toBeInTheDocument()
})

test('fuori dal capitolo 1 l’interruttore non c’è', () => {
  render(
    <PracticePage createExercise={() => exerciseOf('z.add-sub', '−8 − 3')} />,
  )
  expect(screen.queryByRole('switch', { name: 'Passo passo' })).toBeNull()
  expect(screen.getByLabelText('Risultato')).toBeInTheDocument()
})

test('una riga accettata si scrive sul quaderno, una alla volta', () => {
  render(<PracticePage createExercise={() => exercise('2 × 3 + 4 × 5')} />)
  turnOnStepByStep()
  submitLine('2 × 3 + 20')
  const lines = screen.getByRole('region', { name: 'Le tue righe' })
  expect(
    within(lines).getByRole('math', { name: '2 × 3 + 20' }),
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Riga')).toHaveValue('')
  submitLine('6 + 20')
  expect(
    within(lines).getByRole('math', { name: '6 + 20' }),
  ).toBeInTheDocument()
})

test('il conto svolto con l’uguale scrive la riga nuova', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  turnOnStepByStep()
  submitLine('3 × 4 = 12')
  expect(
    within(screen.getByRole('region', { name: 'Le tue righe' })).getByRole(
      'math',
      { name: '2 + 12' },
    ),
  ).toBeInTheDocument()
})

test('una riga rifiutata dice ordine o valore e lascia l’esercizio aperto', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('2 + 3 × 4')}
      onAttempt={onAttempt}
    />,
  )
  turnOnStepByStep()
  submitLine('2 + 3 = 5')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Ordine sbagliato: svolgi prima 3 × 4.',
  )
  submitLine('3 × 4 = 13')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Valore sbagliato: controlla 3 × 4.',
  )
  expect(screen.getByLabelText('Riga')).not.toHaveAttribute('readonly')
  expect(screen.queryByRole('region', { name: 'Le tue righe' })).toBeNull()
  expect(onAttempt).not.toHaveBeenCalled()
  // Le righe rifiutate contano come aiutate.
  submitLine('2 + 12')
  submitLine('14')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ outcome: { kind: 'correct' }, rewrites: 2 }),
  )
})

test('la riga copiata non si aggiunge e non conta come riscrittura', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('2 + 3 × 4')}
      onAttempt={onAttempt}
    />,
  )
  turnOnStepByStep()
  submitLine('2 + 3 × 4')
  expect(screen.getByRole('status')).toHaveTextContent(
    'È la stessa riga: svolgi un’operazione.',
  )
  expect(screen.queryByRole('region', { name: 'Le tue righe' })).toBeNull()
  submitLine('14')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ outcome: { kind: 'correct' }, rewrites: 0 }),
  )
})

test('una riga che non si legge dice entrambe le forme', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  turnOnStepByStep()
  for (const written of ['2 +', '= 5', '3 × 4 =']) {
    submitLine(written)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Scrivi la riga come espressione, o solo il conto: 3 × 4 = 12.',
    )
    expect(screen.queryByRole('region', { name: 'Le tue righe' })).toBeNull()
  }
})

test('una riga che si legge come numero è la risposta finale, così com’è', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  turnOnStepByStep()
  submitLine('14/1')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Il risultato è un numero intero.',
  )
  submitLine('14,0')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Il risultato è un numero intero.',
  )
  expect(screen.getByLabelText('Riga')).not.toHaveAttribute('readonly')
  expect(screen.queryByRole('region', { name: 'Soluzione' })).toBeNull()
})

test('anche un decimale o il segno al denominatore vanno alla verifica', () => {
  for (const written of ['2,5', '6/-1']) {
    const { unmount } = render(
      <PracticePage createExercise={() => exercise('2 + 3 × 4')} />,
    )
    turnOnStepByStep()
    submitLine(written)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Non è corretto: il risultato è 14.',
    )
    unmount()
  }
})

test('un numero fra parentesi è la risposta finale, non una riga', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  turnOnStepByStep()
  submitLine('(14)')
  expect(screen.queryByRole('region', { name: 'Le tue righe' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Suggerimento' })).toBeEnabled()
})

test('il suggerimento conta una volta per riga e non svela il quaderno', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('2 × 3 + 4 × 5')}
      onAttempt={onAttempt}
    />,
  )
  turnOnStepByStep()
  for (let i = 0; i < 5; i++)
    fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  expect(screen.getByRole('status')).toHaveTextContent('2 × 3 = 6')
  expect(screen.queryByText(/Righe svelate sul quaderno/)).toBeNull()
  expect(screen.queryByRole('region', { name: 'Soluzione' })).toBeNull()
  // Tornando al solo risultato il suggerimento dato non svela niente.
  fireEvent.click(stepSwitch())
  expect(screen.queryByText(/Righe svelate sul quaderno/)).toBeNull()
  expect(screen.queryByRole('region', { name: 'Soluzione' })).toBeNull()
  answer('26')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ outcome: { kind: 'correct' }, hints: 1 }),
  )
})

test('il suggerimento mostra il prossimo passaggio, senza il risultato finale', () => {
  render(<PracticePage createExercise={() => exercise('2 × 3 + 4 × 5')} />)
  turnOnStepByStep()
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  expect(screen.getByRole('status')).toHaveTextContent('2 × 3 = 6')
  submitLine('6 + 20')
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  expect(screen.getByRole('status')).toHaveTextContent('6 + 20')
  expect(screen.queryByText('6 + 20 = 26')).toBeNull()
})

test('a interruttore spento spariscono righe, rifiuto e suggerimento', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  turnOnStepByStep()
  submitLine('5 × 4')
  expect(screen.getByRole('status')).toHaveTextContent(/Ordine sbagliato/)
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  fireEvent.click(stepSwitch())
  expect(screen.queryByText(/Ordine sbagliato/)).toBeNull()
  expect(screen.queryByRole('region', { name: 'Le tue righe' })).toBeNull()
  answer('14')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  expect(screen.queryByText(/Ordine sbagliato/)).toBeNull()
})

test('a esercizio chiuso la soluzione è quella del quaderno', () => {
  render(<PracticePage createExercise={() => exercise('2 × 3 + 4 × 5')} />)
  turnOnStepByStep()
  submitLine('6 + 20')
  submitLine('26')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  const solution = screen.getByRole('region', { name: 'Soluzione' })
  expect(
    within(solution).getByRole('math', { name: '6 + 20' }),
  ).toBeInTheDocument()
  expect(within(solution).getByText('2 × 3 = 6')).toBeInTheDocument()
})

test('l’esercizio successivo riparte senza righe né messaggi', () => {
  const sources = ['2 + 3 × 4', '2 × 3 + 4 × 5']
  let i = 0
  render(<PracticePage createExercise={() => exercise(sources[i++] ?? '')} />)
  turnOnStepByStep()
  submitLine('2 + 12')
  submitLine('14')
  fireEvent.click(screen.getByRole('button', { name: 'Esercizio successivo' }))
  expect(screen.queryByRole('region', { name: 'Le tue righe' })).toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.getByLabelText('Riga')).toHaveValue('')
})
