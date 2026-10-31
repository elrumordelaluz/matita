import { ArrowRight, Check, Lightbulb } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  answerForm,
  applyOperation,
  checkLine,
  literal,
  nextStepHint,
  parseExpression,
  parseStepEntry,
  readsAsNumber,
  solve,
  toText,
  verify,
  type Exercise,
  type Expression,
  type LineRefusal,
  type Outcome,
  type StepEntry,
} from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import { ExpressionFormula, Formula } from './Formula.tsx'
import { Button, Eyebrow, Panel, Sheet } from './kit.tsx'
import {
  MisconceptionNote,
  NextLine,
  SolutionLines,
  StudentLines,
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
//
// Con l'interruttore "Passo passo" (solo per le abilità del primo capitolo)
// lo studente scrive ogni riga della soluzione e il motore la controlla.

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

// Le due forme che accetta il campo in "Passo passo".
const lineFormMessage =
  'Scrivi la riga come espressione, o solo il conto: 3 × 4 = 12.'

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
  // "Passo passo": le righe accettate, l'ultima è quella da cui si riparte;
  // il rifiuto della riga scritta e il suo suggerimento.
  const [step, setStep] = useState(false)
  const [lines, setLines] = useState<readonly Expression[]>([])
  const [lineMessage, setLineMessage] = useState<string | null>(null)
  const [hintText, setHintText] = useState<string | null>(null)
  // Il suggerimento di "Passo passo" conta una volta per riga e non svela
  // le righe della soluzione sul quaderno.
  const [countedHint, setCountedHint] = useState<string | null>(null)
  const [stepHints, setStepHints] = useState(0)
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
  const stepWanted = exercise.skill.startsWith('n.')
  const stepByStep = step && stepWanted
  const currentLine = lines[lines.length - 1] ?? exercise.expression
  const shownLines = done ? solution.lines : solution.lines.slice(0, hints)
  const stepHint = stepByStep && !done ? nextStepHint(currentLine) : null

  // A esercizio chiuso, Invio porta al successivo.
  useEffect(() => {
    if (done) nextButton.current?.focus()
  }, [done])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (done) return
    if (!stepByStep) return judge()
    setLineMessage(null)
    setHintText(null)
    // Con l'uguale il campo è un conto solo: `3 × 4 = 12`.
    if (answer.includes('=')) {
      const entry = parseStepEntry(answer)
      return entry ? judgeOperation(entry) : unreadableLine()
    }
    // Ciò che si legge come un numero è la risposta finale: va alla verifica
    // così com'è scritta, (14) come 14.
    if (answerForm(answer) !== null) return judge()
    let line: Expression
    try {
      line = parseExpression(answer)
    } catch {
      return unreadableLine()
    }
    if (readsAsNumber(line)) return judge()
    const check = checkLine(currentLine, line)
    setTries((t) => t + 1)
    if (check.accepted) return acceptLine(line)
    if (check.wrong === 'unchanged') {
      setOutcome(null)
      setLineMessage('È la stessa riga: svolgi un’operazione.')
      return
    }
    refuse(check)
  }

  function acceptLine(line: Expression) {
    setLines((l) => [...l, line])
    setAnswer('')
    setOutcome(null)
  }

  function judgeOperation(entry: StepEntry) {
    const check = applyOperation(currentLine, entry)
    setTries((t) => t + 1)
    if (check.accepted) return acceptLine(check.line)
    refuse(check)
  }

  // La riga rifiutata lascia l'esercizio aperto e conta come aiutata.
  function refuse(check: LineRefusal) {
    setOutcome(null)
    setRewrites((r) => r + 1)
    setLineMessage(
      check.wrong === 'order'
        ? `Ordine sbagliato: svolgi prima ${check.operation}.`
        : `Valore sbagliato: controlla ${check.operation}.`,
    )
  }

  function unreadableLine() {
    setTries((t) => t + 1)
    setOutcome({ kind: 'invalid', message: lineFormMessage })
  }

  function judge() {
    const result = verify(answer, exercise)
    setOutcome(result)
    setTries((t) => t + 1)
    if (result.kind === 'rewrite') setRewrites((r) => r + 1)
    if (closes(result))
      onAttempt?.({
        exercise,
        answer,
        outcome: result,
        hints: hints + stepHints,
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

  // Il suggerimento di "Passo passo" è il prossimo passaggio dalla riga
  // dello studente; chiederlo di nuovo sulla stessa riga non è un aiuto nuovo.
  function askHint() {
    if (!stepByStep) {
      setHints((h) => h + 1)
      return
    }
    if (!stepHint) return
    const text =
      stepHint.result === null
        ? `Ultimo passaggio: svolgi ${stepHint.operation}.`
        : `Prossimo passaggio: ${stepHint.operation} = ${stepHint.result}.`
    setHintText(text)
    if (text === countedHint) return
    setCountedHint(text)
    setStepHints((h) => h + 1)
  }

  // Ciò che "Passo passo" ha scritto non resta sul banco quando si torna al
  // solo risultato.
  function toggleStep(on: boolean) {
    setStep(on)
    setLines([])
    setLineMessage(null)
    setHintText(null)
  }

  function next() {
    setExercise(createExercise())
    setAnswer('')
    setOutcome(null)
    setLines([])
    setLineMessage(null)
    setHintText(null)
    setCountedHint(null)
    setStepHints(0)
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
        {stepByStep && !done && (
          <StudentLines lines={lines} titleId={`${answerId}-lines`} />
        )}
        {(!stepByStep || done) && (
          <SolutionLines
            lines={shownLines}
            total={solution.lines.length}
            written={hints}
            pause={outcome?.kind === 'misconception' ? 1 : 0}
            checked={outcome?.kind === 'correct'}
            titleId={`${answerId}-solution`}
          />
        )}
        {!done && (stepByStep || hints < solution.lines.length) && <NextLine />}
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

        {/* L'interruttore nella sua riga: nella riga del titolo, con la spia
            dell'esito, andrebbe a capo. */}
        {stepWanted && (
          <label className="flex w-fit items-center gap-2 text-sm font-semibold text-dim">
            <input
              type="checkbox"
              role="switch"
              checked={step}
              onChange={(e) => toggleStep(e.target.checked)}
              className="size-4 accent-pencil"
            />
            Passo passo
          </label>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor={answerId}
              className="block text-sm font-semibold text-dim"
            >
              {stepByStep ? 'Riga' : 'Risultato'}
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
                stepByStep && 'text-2xl',
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

          {lineMessage && (
            <div
              role="status"
              className="animate-pop rounded-2xl border border-warn/25 bg-warn-soft px-4 py-3 text-warn"
            >
              <p className="font-display text-lg leading-snug font-bold text-pretty">
                {lineMessage}
              </p>
            </div>
          )}

          {hintText && (
            <p
              role="status"
              className="animate-pop rounded-2xl border border-hair bg-paper px-4 py-3 text-sm text-ink"
            >
              {hintText}
            </p>
          )}

          {outcome && (
            <OutcomeCard
              key={tries}
              outcome={outcome}
              result={toText(literal(solution.result))}
              hints={hints + stepHints}
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
                onClick={askHint}
                disabled={
                  stepByStep ? !stepHint : hints >= solution.lines.length
                }
                icon={<Lightbulb aria-hidden="true" className="size-4" />}
              >
                Suggerimento
              </Button>
            </div>
          )}

          {!done && !stepByStep && hints > 0 && (
            <p className="text-center text-sm text-dim">
              {`Righe svelate sul quaderno: ${hints} di ${solution.lines.length}`}
            </p>
          )}
        </form>
      </Panel>
    </section>
  )
}
