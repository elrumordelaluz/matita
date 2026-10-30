import { ArrowRight, Check, Lightbulb } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  answerForm,
  literal,
  solve,
  toText,
  verify,
  type Exercise,
  type Outcome,
} from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import { ExpressionFormula, Formula } from './Formula.tsx'
import { Button, Eyebrow, Panel, Sheet } from './kit.tsx'
import {
  MisconceptionNote,
  NextLine,
  SolutionLines,
} from './practice/Notebook.tsx'
import { OutcomeCard, RunState } from './practice/OutcomeCard.tsx'
import { insertAtCursor, symbolKeys } from './symbolRow.ts'

// La pagina di pratica: espressione, risposta, esito, soluzione per righe.
// La pagina non salva nulla: quando un esercizio si chiude lo riferisce con
// `onAttempt`, e chi la usa decide cosa farne.
//
// Sul banco: il quaderno a quadretti al centro, con l'espressione e le righe
// che si scrivono da sole; accanto il pannello "Prova tu" con la risposta.
// Sul telefono il pannello scende sotto il quaderno.

export interface PracticeAttempt {
  readonly exercise: Exercise
  readonly answer: string
  readonly outcome: Outcome
  readonly hints: number
  readonly rewrites: number
  readonly durationMs: number
}

// Una risposta illeggibile o da riscrivere lascia l'esercizio aperto.
function closes(outcome: Outcome | null): boolean {
  return (
    outcome !== null && outcome.kind !== 'invalid' && outcome.kind !== 'rewrite'
  )
}

export function PracticePage({
  createExercise,
  onAttempt,
  title,
}: {
  createExercise: () => Exercise
  onAttempt?: (attempt: PracticeAttempt) => void
  /** L'abilità che si allena, in testa al quaderno. */
  title?: string
}) {
  const [exercise, setExercise] = useState(createExercise)
  const [answer, setAnswer] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [hints, setHints] = useState(0)
  // Le risposte col valore giusto da riscrivere: rendono il tentativo aiutato.
  const [rewrites, setRewrites] = useState(0)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  // Conta le risposte date: rifà comparire la scheda dell'esito ogni volta.
  const [tries, setTries] = useState(0)
  const answerId = useId()
  const input = useRef<HTMLInputElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)

  const solution = solve(exercise.expression)
  // L'anteprima è una funzione del solo campo: uguale anche a esercizio chiuso.
  const form = answerForm(answer)
  const done = closes(outcome)
  const wrong = outcome?.kind === 'wrong' || outcome?.kind === 'misconception'
  const shownLines = done ? solution.lines : solution.lines.slice(0, hints)

  // A esercizio chiuso, Invio porta al successivo.
  useEffect(() => {
    if (done) nextButton.current?.focus()
  }, [done])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (done) return
    const result = verify(answer, exercise)
    setOutcome(result)
    setTries((t) => t + 1)
    if (result.kind === 'rewrite') setRewrites((r) => r + 1)
    if (closes(result))
      onAttempt?.({
        exercise,
        answer,
        outcome: result,
        hints,
        rewrites,
        durationMs: Date.now() - startedAt,
      })
  }

  // Un tasto della riga simboli: scrive nel campo e ci riporta il cursore.
  function insertSymbol(symbol: string) {
    const field = input.current
    if (!field) return
    const next = insertAtCursor(
      answer,
      symbol,
      field.selectionStart,
      field.selectionEnd,
    )
    setAnswer(next.value)
    // Il valore si scrive subito sul campo: la selezione che segue non deve
    // aspettare il rendering.
    field.value = next.value
    field.focus()
    field.setSelectionRange(next.caret, next.caret)
  }

  function next() {
    setExercise(createExercise())
    setAnswer('')
    setOutcome(null)
    setHints(0)
    setRewrites(0)
    setTries(0)
    setStartedAt(Date.now())
    input.current?.focus()
  }

  return (
    <section
      aria-labelledby={`${answerId}-title`}
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start"
    >
      <Sheet className="min-w-0 px-5 py-6 sm:px-10 sm:py-9 lg:min-h-[30rem]">
        {title && <Eyebrow>{title}</Eyebrow>}
        <h2 id={`${answerId}-title`} className="font-hand text-2xl text-lead">
          Calcola il valore dell’espressione
        </h2>
        <div className="overflow-x-auto py-6 sm:py-8">
          <ExpressionFormula
            expression={exercise.expression}
            className="text-3xl sm:text-4xl lg:text-5xl"
          />
        </div>

        {outcome?.kind === 'misconception' && (
          <MisconceptionNote explanation={outcome.explanation} />
        )}
        <SolutionLines
          lines={shownLines}
          total={solution.lines.length}
          written={hints}
          pause={outcome?.kind === 'misconception' ? 1 : 0}
          checked={outcome?.kind === 'correct'}
          titleId={`${answerId}-solution`}
        />
        {!done && hints < solution.lines.length && <NextLine />}
      </Sheet>

      <Panel
        aria-labelledby={`${answerId}-try`}
        className="space-y-4 lg:sticky lg:top-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 id={`${answerId}-try`} className="font-display text-xl font-bold">
            Prova tu
          </h3>
          <RunState outcome={outcome} />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor={answerId}
              className="block text-sm font-semibold text-dim"
            >
              Risultato
            </label>
            <input
              ref={input}
              id={answerId}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              readOnly={done}
              inputMode="text"
              autoComplete="off"
              placeholder="?"
              className={cn(
                'h-16 w-full rounded-2xl border-2 border-hair bg-paper px-4 text-center font-display text-4xl font-bold text-ink transition outline-none',
                'placeholder:text-dim/30 focus:border-pencil focus:ring-4 focus:ring-pencil/25',
                outcome?.kind === 'correct' &&
                  'border-ok bg-ok-soft text-ok focus:border-ok focus:ring-ok/20',
                wrong &&
                  'animate-shake border-err bg-err-soft text-err focus:border-err focus:ring-err/20',
                (outcome?.kind === 'invalid' || outcome?.kind === 'rewrite') &&
                  'border-warn focus:border-warn focus:ring-warn/20',
              )}
            />
          </div>

          {/* Sul telefono, sotto il campo: i simboli che la tastiera di
              sistema nasconde. Da sm in su la riga non c'è. */}
          {!done && (
            <div className="flex justify-center gap-2 sm:hidden">
              {symbolKeys.map(({ symbol, label }) => (
                <button
                  key={symbol}
                  type="button"
                  aria-label={label}
                  onClick={() => insertSymbol(symbol)}
                  className="h-12 w-12 rounded-xl border border-hair bg-panel font-display text-lg font-bold text-ink hover:bg-paper"
                >
                  {symbol}
                </button>
              ))}
            </div>
          )}

          {/* L'anteprima della risposta: la forma scritta, senza giudizio.
              Il posto è fisso, così il pannello non si sposta mentre si
              scrive; ciò che non si legge non mostra niente. */}
          <div className="flex h-24 items-center justify-center">
            {form && (
              <Formula tex={form.tex} text={form.text} className="text-3xl" />
            )}
          </div>

          {outcome && (
            <OutcomeCard
              key={tries}
              outcome={outcome}
              result={toText(literal(solution.result))}
              hints={hints}
            />
          )}

          {done ? (
            <Button
              ref={nextButton}
              variant="pencil"
              onClick={next}
              className="w-full py-3.5 text-lg"
            >
              Esercizio successivo
              <ArrowRight aria-hidden="true" className="size-5" />
            </Button>
          ) : (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button
                type="submit"
                icon={<Check aria-hidden="true" className="size-5" />}
                className="py-3.5 text-lg"
              >
                Verifica
              </Button>
              <Button
                variant="ghost"
                onClick={() => setHints((h) => h + 1)}
                disabled={hints >= solution.lines.length}
                icon={<Lightbulb aria-hidden="true" className="size-4" />}
              >
                Suggerimento
              </Button>
            </div>
          )}

          {!done && hints > 0 && (
            <p className="text-center text-sm text-dim">
              {`Righe svelate sul quaderno: ${hints} di ${solution.lines.length}`}
            </p>
          )}
        </form>
      </Panel>
    </section>
  )
}
