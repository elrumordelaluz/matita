import { ArrowRight, Check, Lightbulb } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  answerForm,
  checkLine,
  literal,
  nextStepHint,
  parseExpression,
  solve,
  toText,
  verify,
  type Exercise,
  type Expression,
  type Outcome,
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
  // La modalità "Passo passo": le righe scritte dallo studente, l'ultima è
  // quella da cui partire; il messaggio di una riga rifiutata.
  const [step, setStep] = useState(false)
  const [lines, setLines] = useState<readonly Expression[]>([])
  const [lineMessage, setLineMessage] = useState<string | null>(null)
  // Il suggerimento di "Passo passo": il prossimo passaggio sulla riga dello
  // studente.
  const [hintText, setHintText] = useState<string | null>(null)
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
  const stepByStep = step && exercise.skill.startsWith('n.')
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
    let parsed: Expression
    try {
      parsed = parseExpression(answer)
    } catch {
      setOutcome({
        kind: 'invalid',
        message: 'Scrivi la riga come espressione.',
      })
      setTries((t) => t + 1)
      return
    }
    // Una riga che è un solo numero è la risposta finale: va alla verifica
    // così com'è scritta.
    if (parsed.kind === 'number') return judge()
    const check = checkLine(currentLine, parsed)
    setTries((t) => t + 1)
    if (check.accepted) {
      setLines((l) => [...l, parsed])
      setAnswer('')
      setOutcome(null)
      return
    }
    setOutcome(null)
    // La riga rifiutata lascia l'esercizio aperto e conta come aiutata.
    setRewrites((r) => r + 1)
    setLineMessage(
      check.wrong === 'order'
        ? `Ordine sbagliato: svolgi prima ${check.operation}.`
        : `Valore sbagliato: controlla ${check.operation}.`,
    )
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
        hints,
        rewrites,
        durationMs: Date.now() - startedAt,
      })
  }

  function next() {
    setExercise(createExercise())
    setAnswer('')
    setOutcome(null)
    setLines([])
    setLineMessage(null)
    setHintText(null)
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
          {exercise.skill.startsWith('n.') && (
            <label className="flex items-center gap-2 text-sm font-semibold text-dim">
              <input
                type="checkbox"
                role="switch"
                checked={step}
                onChange={(e) => setStep(e.target.checked)}
                className="size-4 accent-pencil"
              />
              Passo passo
            </label>
          )}
          <RunState outcome={outcome} />
        </div>

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
                outcome?.kind === 'correct' &&
                  'border-ok bg-ok-soft text-ok focus:border-ok focus:ring-ok/20',
                wrong &&
                  'animate-shake border-err bg-err-soft text-err focus:border-err focus:ring-err/20',
                (outcome?.kind === 'invalid' || outcome?.kind === 'rewrite') &&
                  'border-warn focus:border-warn focus:ring-warn/20',
              )}
            />
          </div>

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
                onClick={() => {
                  setHints((h) => h + 1)
                  if (stepHint)
                    setHintText(
                      stepHint.result === null
                        ? `Ultimo passaggio: svolgi ${stepHint.operation}.`
                        : `Prossimo passaggio: ${stepHint.operation} = ${stepHint.result}.`,
                    )
                }}
                disabled={
                  !stepByStep ? hints >= solution.lines.length : !stepHint
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
