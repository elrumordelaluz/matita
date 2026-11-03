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

// La modalità "Passo passo": lo studente scrive ogni riga e il motore la
// controlla. Vedi SPEC.md, "Pratica / Passo passo".

function switchOn() {
  fireEvent.click(screen.getByRole('switch', { name: 'Passo passo' }))
}

function line(text: string) {
  type(text)
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
}

test('l’interruttore passo passo è spento e su una riga sua', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  const step = screen.getByRole('switch', { name: 'Passo passo' })
  expect(step).not.toBeChecked()
  // Riga propria: il titolo "Prova tu" con la sua spia resta sulla sua.
  expect(step.closest('div')?.querySelector('h3')).toBeNull()
})

test('senza abilità n l’interruttore non c’è', () => {
  render(
    <PracticePage
      createExercise={() => ({
        skill: 'z.add-sub',
        seed: 1,
        generatorVersion: 1,
        expression: parseExpression('−8 − (3 − (−6))'),
      })}
    />,
  )
  expect(screen.queryByRole('switch', { name: 'Passo passo' })).toBeNull()
})

test('una riga fuori ordine è rifiutata, resta aperta e conta come aiutata', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('2 + 3 × 4')}
      onAttempt={onAttempt}
    />,
  )
  switchOn()
  line('5 × 1')
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Ordine sbagliato: controlla 3 × 4.',
  )
  expect(screen.getByLabelText('Risultato')).not.toHaveAttribute('readonly')
  line('2 + 12')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('math', { name: '2 + 12' })).toBeInTheDocument()
  line('14')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ rewrites: 1 }),
  )
})

test('una riga con un valore sbagliato nomina il conto da controllare', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  switchOn()
  line('2 + 13')
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Valore sbagliato: controlla 3 × 4.',
  )
})

test('la copia della riga precedente è rifiutata senza contare', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('2 + 3 × 4')}
      onAttempt={onAttempt}
    />,
  )
  switchOn()
  line('2 + 3 × 4')
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Hai riscritto la stessa riga.',
  )
  line('14')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ rewrites: 0 }),
  )
})

test('la riga illeggibile dice come scriverla, in entrambe le forme', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  switchOn()
  line('boh')
  const alert = screen.getByRole('alert')
  expect(alert).toHaveTextContent('Scrivi la riga come espressione')
  expect(alert).toHaveTextContent('2 × 3 + 20')
  expect(alert).toHaveTextContent('3 × 4 = 12')
})

test('il campo in passo passo non è una riga sola a text-4xl', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  expect(screen.getByLabelText('Risultato').className).toContain('text-4xl')
  switchOn()
  expect(screen.getByLabelText('Risultato').className).not.toContain('text-4xl')
})

test('un conto scritto come operazione sostituisce la riga', () => {
  render(
    <PracticePage
      createExercise={() =>
        exercise('14 − (3 × 7 + 5) : 13 + (13 + 12 : 2) × 3')
      }
    />,
  )
  switchOn()
  line('3 × 7 = 21')
  expect(
    screen.getByRole('math', {
      name: '14 − (21 + 5) : 13 + (13 + 12 : 2) × 3',
    }),
  ).toBeInTheDocument()
})

test('un conto scritto come operazione può usare il segno della tastiera', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  switchOn()
  line('3*4=12')
  expect(screen.getByRole('math', { name: '2 + 12' })).toBeInTheDocument()
})

test('un conto fuori ordine scritto come operazione è rifiutato', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('2 + 3 × 4')}
      onAttempt={onAttempt}
    />,
  )
  switchOn()
  line('2 + 3 = 5')
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Ordine sbagliato: controlla 3 × 4.',
  )
  line('3 × 4 = 13')
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Valore sbagliato: controlla 3 × 4.',
  )
  line('14')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ rewrites: 2 }),
  )
})

test('ciò che si legge come un numero va alla verifica così com’è', () => {
  render(<PracticePage createExercise={() => exercise('14 : 1')} />)
  switchOn()
  line('14/1')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Il risultato è un numero intero.',
  )
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByLabelText('Risultato')).not.toHaveAttribute('readonly')
})

test('decimali e segno al denominatore arrivano alla verifica', () => {
  render(<PracticePage createExercise={() => exercise('2 × 7')} />)
  switchOn()
  line('14,0')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Il risultato è un numero intero.',
  )
  expect(screen.queryByRole('alert')).toBeNull()
  line('2,5')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Non è corretto: il risultato è 14.',
  )
  expect(screen.queryByRole('alert')).toBeNull()
})

test('il segno al denominatore arriva alla verifica e si riscrive', () => {
  render(<PracticePage createExercise={() => exercise('2 × (−3)')} />)
  switchOn()
  line('6/-1')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Il segno va davanti alla frazione.',
  )
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByLabelText('Risultato')).not.toHaveAttribute('readonly')
})

test('un numero fra parentesi è la risposta finale, non una riga', () => {
  render(<PracticePage createExercise={() => exercise('2 × 7')} />)
  switchOn()
  line('(14)')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  expect(screen.queryByRole('button', { name: 'Suggerimento' })).toBeNull()
})

test('lo suggerimento scrive il prossimo passo, mai quello che dà il risultato', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  switchOn()
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  expect(screen.getByText('3 × 4 = 12')).toBeInTheDocument()
  line('2 + 12')
  expect(screen.getByRole('button', { name: 'Suggerimento' })).toBeDisabled()
})

test('lo suggerimento ripetuto sulla stessa riga non conta due volte', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('12 − 5 + 3 − 4')}
      onAttempt={onAttempt}
    />,
  )
  switchOn()
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  line('6')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ hints: 1 }),
  )
})

test('spegnere l’interruttore pulisce riga e suggerimento', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  switchOn()
  line('5 × 1')
  expect(screen.getByRole('alert')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Suggerimento' }))
  fireEvent.click(screen.getByRole('switch', { name: 'Passo passo' }))
  expect(screen.queryByRole('alert')).toBeNull()
  // Il suggerimento scritto nel pannello sparisce: sul quaderno restano
  // le righe svelate, come fuori dal passo passo.
  expect(
    within(screen.getByRole('region', { name: 'Prova tu' })).queryByText(
      '3 × 4 = 12',
    ),
  ).toBeNull()
  line('14')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  expect(screen.queryByRole('alert')).toBeNull()
})

test('il conto che dà il risultato scritto come operazione è la risposta finale', () => {
  const onAttempt = vi.fn()
  render(
    <PracticePage
      createExercise={() => exercise('2 + 3 × 4')}
      onAttempt={onAttempt}
    />,
  )
  switchOn()
  line('3 × 4 = 12')
  line('2 + 12 = 14')
  expect(screen.getByRole('status')).toHaveTextContent('Corretto!')
  expect(onAttempt).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ answer: '14' }),
  )
})

test('il risultato di un conto finale va alla verifica così com’è scritto', () => {
  render(<PracticePage createExercise={() => exercise('2 + 3 × 4')} />)
  switchOn()
  line('3 × 4 = 12')
  line('2 + 12 = 14/1')
  expect(screen.getByRole('status')).not.toHaveTextContent('Corretto!')
  expect(screen.getByLabelText('Risultato')).not.toHaveAttribute('readonly')
  expect(screen.queryByRole('alert')).toBeNull()
})
