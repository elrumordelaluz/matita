import { ArrowRight, Check, Lightbulb } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  answerForm,
  checkStep,
  literal,
  operationStep,
  operationStepAt,
  parseExpression,
  parseOperationLine,
  solve,
  toText,
  verify,
  visibleOperation,
  type Exercise,
  type Expression,
  type Outcome,
  type Path,
  type Rational,
  type StepCheck,
} from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import { ExpressionFormula, Formula } from './Formula.tsx'
import { Button, Eyebrow, Note, Panel, Sheet } from './kit.tsx'
import {
  MisconceptionNote,
  NextLine,
  SolutionLines,
} from './practice/Notebook.tsx'
import { OutcomeCard, RunState } from './practice/OutcomeCard.tsx'
import { TappableLine } from './practice/TappableLine.tsx'
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

// Il numero dentro parentesi tonde, se la riga è solo quello: (14).
function bareNumber(e: Expression): Expression | null {
  return e.kind === 'group' && !e.negated && e.inner.kind === 'number'
    ? e.inner
    : null
}

// Il risultato scritto per un conto toccato: un numero, anche fra parentesi.
function writtenResult(text: string): Rational | null {
  try {
    const parsed = parseExpression(text)
    const value = bareNumber(parsed) ?? parsed
    return value.kind === 'number' ? value.value : null
  } catch {
    return null
  }
}

const samePath = (a: Path, b: Path) => a.join() === b.join()

// Il prossimo passo da scrivere sulla riga dello studente, come lo farebbe
// il risolutore. Null se la riga non ha passaggi o se il passo dà il
// risultato: quello resta allo studente.
function nextHint(line: Expression): string | null {
  try {
    const step = solve(line).lines[0]?.steps[0]
    if (!step || step.expression.kind === 'number') return null
    return `${toText(step.operation)} = ${toText(step.outcome)}`
  } catch {
    return null
  }
}

// Cosa dire di una riga rifiutata: l'ordine o il valore, col conto da
// controllare.
function refusalMessage(check: StepCheck): string {
  const operation = check.ok ? null : check.operation
  const named = operation ? `: controlla ${toText(operation)}.` : '.'
  switch (check.ok ? 'copy' : check.reason) {
    case 'order':
      return `Ordine sbagliato${named}`
    case 'value':
      return `Valore sbagliato${named}`
    case 'zero-divisor':
      return 'Il divisore non può essere zero.'
    case 'copy':
      return 'Hai riscritto la stessa riga.'
  }
}

// La posizione dell'interruttore "Passo passo" è del dispositivo, non dei
// progressi: sta in localStorage, fuori dall'archivio e dal backup. Senza
// storage, o se lo storage protesta, l'interruttore parte spento.
const stepSwitchKey = 'matita.stepSwitch'

function readStepSwitch(): boolean {
  try {
    return localStorage.getItem(stepSwitchKey) === 'on'
  } catch {
    return false
  }
}

function writeStepSwitch(on: boolean) {
  try {
    localStorage.setItem(stepSwitchKey, on ? 'on' : 'off')
  } catch {
    // La scelta vale per questa pagina e basta.
  }
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
  // La modalità "Passo passo": la posizione dell'interruttore, le righe
  // accettate, il messaggio sulla riga e il suggerimento scritto.
  // L'interruttore tiene la sua posizione da un esercizio all'altro.
  const [stepSwitch, setStepSwitch] = useState(readStepSwitch)
  const [stepLines, setStepLines] = useState<readonly Expression[]>([])
  const [lineMessage, setLineMessage] = useState<string | null>(null)
  const [stepHint, setStepHint] = useState<string | null>(null)
  // La riga per cui vale il suggerimento: ripeterlo su di essa non conta.
  const [hintLine, setHintLine] = useState<Expression | null>(null)
  // L'operatore toccato sulla riga corrente: il campo chiede il suo risultato.
  const [selected, setSelected] = useState<Path | null>(null)
  const answerId = useId()
  const input = useRef<HTMLInputElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)

  const solution = solve(exercise.expression)
  // L'anteprima è una funzione del solo campo: uguale anche a esercizio chiuso.
  const form = answerForm(answer)
  const done = closes(outcome)
  const wrong = outcome?.kind === 'wrong' || outcome?.kind === 'misconception'
  const stepAvailable = exercise.skill.startsWith('n.')
  // Dove il passo passo non c'è, l'interruttore acceso aspetta il prossimo
  // esercizio che lo ha.
  const stepMode = stepAvailable && stepSwitch
  const currentLine =
    stepLines.length > 0
      ? (stepLines[stepLines.length - 1] as Expression)
      : exercise.expression
  // Si tocca solo la riga ancora da svolgere, e solo a esercizio aperto.
  const tapping = stepMode && !done
  const selection = tapping ? selected : null
  const shownLines = stepMode
    ? done
      ? solution.lines
      : []
    : done
      ? solution.lines
      : solution.lines.slice(0, hints)

  // A esercizio chiuso, Invio porta al successivo.
  useEffect(() => {
    if (done) nextButton.current?.focus()
  }, [done])

  // Giudica una risposta finale: è la verifica della pagina, quella che
  // chiude l'esercizio o chiede di riscrivere.
  function grade(text: string) {
    const result = verify(text, exercise)
    setLineMessage(null)
    setOutcome(result)
    setTries((t) => t + 1)
    if (result.kind === 'rewrite') setRewrites((r) => r + 1)
    if (closes(result))
      onAttempt?.({
        exercise,
        answer: text,
        outcome: result,
        hints,
        rewrites,
        durationMs: Date.now() - startedAt,
      })
  }

  // Una riga rifiutata resta da scrivere: il messaggio dice dove guardare e
  // il tentativo diventa aiutato, tranne quando la riga è una copia.
  function refuse(check: StepCheck) {
    setLineMessage(refusalMessage(check))
    if (!check.ok && check.reason !== 'copy') setRewrites((r) => r + 1)
  }

  function accept(line: Expression) {
    setStepLines((lines) => [...lines, line])
    setAnswer('')
    setSelected(null)
    setLineMessage(null)
    setStepHint(null)
    setHintLine(null)
  }

  function unreadableLine() {
    setLineMessage(
      'Scrivi la riga come espressione, per esempio 2 × 3 + 20, o un conto come 3 × 4 = 12.',
    )
  }

  // Il risultato del conto toccato: diventa la riga nuova, giudicata come una
  // riga scritta. Se la riga è il risultato, alla verifica va così com'è
  // scritto.
  function submitTapped(path: Path, result: Rational, text: string) {
    const step = operationStepAt(currentLine, path, result)
    if (!step.ok) return refuse(step)
    if (step.line.kind === 'number') return grade(text)
    accept(step.line)
  }

  // La riga in modalità "Passo passo": il risultato del conto toccato, la
  // risposta finale, o la prossima riga del quaderno, per intero o come
  // singolo conto. Con un operatore acceso, ciò che non è un numero si legge
  // come una riga scritta.
  function submitLine() {
    const text = answer.trim()
    if (selection) {
      const result = writtenResult(text)
      if (result) return submitTapped(selection, result, text)
    }
    if (answerForm(text)) return grade(text)
    if (text.includes('=')) {
      const written = parseOperationLine(text)
      if (!written) return unreadableLine()
      const result = operationStep(currentLine, written)
      if (!result.ok) return refuse(result)
      // Il conto che dà il risultato chiude l'esercizio: alla verifica va il
      // risultato così come è scritto, 14/1 compreso.
      if (result.line.kind === 'number') return grade(written.written)
      return accept(result.line)
    }
    let parsed: Expression
    try {
      parsed = parseExpression(text)
    } catch {
      return unreadableLine()
    }
    const bare = bareNumber(parsed)
    // Un numero, anche fra parentesi, è la risposta finale.
    if (parsed.kind === 'number' || bare) return grade(toText(bare ?? parsed))
    const result = checkStep(currentLine, parsed)
    if (result.ok) return accept(parsed)
    refuse(result)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (done) return
    if (stepMode) return submitLine()
    grade(answer)
  }

  // Il suggerimento: fuori dal passo passo svela una riga della soluzione,
  // dentro scrive il prossimo passo della riga dello studente.
  function askHint() {
    if (!stepMode) {
      setHints((h) => h + 1)
      return
    }
    if (hintLine === currentLine) return
    const hint = nextHint(currentLine)
    if (hint === null) return
    setStepHint(hint)
    setHintLine(currentLine)
    setHints((h) => h + 1)
  }

  // Toccare l'operatore acceso lo spegne; toccarne un altro sposta la scelta.
  // L'ordine non si giudica qui: solo alla verifica della riga.
  function tapOperator(path: Path) {
    setSelected(selection && samePath(selection, path) ? null : path)
    input.current?.focus()
  }

  function toggleStep() {
    const next = !stepSwitch
    setStepSwitch(next)
    writeStepSwitch(next)
    // A finestra spenta il quaderno torna quello dell'esercizio.
    if (!next) {
      setSelected(null)
      setStepLines([])
      setLineMessage(null)
      setStepHint(null)
      setHintLine(null)
    }
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
    setStepLines([])
    setLineMessage(null)
    setStepHint(null)
    setHintLine(null)
    setSelected(null)
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
          {tapping && stepLines.length === 0 ? (
            <TappableLine
              expression={exercise.expression}
              selected={selection}
              onTap={tapOperator}
              className="text-3xl sm:text-4xl lg:text-5xl"
            />
          ) : (
            <ExpressionFormula
              expression={exercise.expression}
              className="text-3xl sm:text-4xl lg:text-5xl"
            />
          )}
        </div>

        {outcome?.kind === 'misconception' && (
          <MisconceptionNote explanation={outcome.explanation} />
        )}
        {/* Le righe dello studente, una sotto l'altra, come sul quaderno:
            l'esercizio è la riga zero. */}
        {stepMode && stepLines.length > 0 && (
          <ol className="mt-6 space-y-4">
            {stepLines.map((line, i) => (
              <li
                key={i}
                className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-3"
              >
                <Note aria-hidden="true" className="text-5xl text-pencil-ink">
                  =
                </Note>
                <span className="max-w-full overflow-x-auto py-1">
                  {tapping && i === stepLines.length - 1 ? (
                    <TappableLine
                      expression={line}
                      selected={selection}
                      onTap={tapOperator}
                      className="text-2xl sm:text-3xl"
                    />
                  ) : (
                    <ExpressionFormula
                      expression={line}
                      className="text-2xl sm:text-3xl"
                    />
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
        <SolutionLines
          lines={shownLines}
          total={solution.lines.length}
          written={hints}
          pause={outcome?.kind === 'misconception' ? 1 : 0}
          checked={outcome?.kind === 'correct'}
          titleId={`${answerId}-solution`}
        />
        {!done && (stepMode || hints < solution.lines.length) && <NextLine />}
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

        {/* Il passo passo ha una riga sua, sotto il titolo: solo per le
            abilità del capitolo 1, quelle dei numeri naturali. */}
        {stepAvailable && (
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-sm font-semibold text-dim">
              Passo passo
              <input
                type="checkbox"
                role="switch"
                checked={stepMode}
                onChange={toggleStep}
                className="size-4 accent-pencil"
              />
            </label>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor={answerId}
              className="block text-sm font-semibold text-dim"
            >
              Risultato
            </label>
            {/* Con un operatore acceso il campo chiede solo il risultato:
                l'operazione sta davanti, 3 × 7 = ▢. */}
            <div className="flex items-center gap-3">
              {selection && (
                <span
                  id={`${answerId}-operation`}
                  className="shrink-0 font-display text-2xl font-bold text-pencil-ink"
                >
                  {`${toText(visibleOperation(currentLine, selection))} =`}
                </span>
              )}
              <input
                ref={input}
                id={answerId}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && selection) {
                    e.preventDefault()
                    setSelected(null)
                  }
                }}
                aria-describedby={
                  selection ? `${answerId}-operation` : undefined
                }
                readOnly={done}
                inputMode="text"
                autoComplete="off"
                placeholder="?"
                className={cn(
                  'w-full min-w-0 rounded-2xl border-2 border-hair bg-paper px-4 text-center font-display font-bold text-ink transition outline-none',
                  // Nel passo passo il campo tiene una riga intera: la
                  // misura del solo risultato non gli basta.
                  stepMode ? 'h-14 text-2xl' : 'h-16 text-4xl',
                  'placeholder:text-dim/30 focus:border-pencil focus:ring-4 focus:ring-pencil/25',
                  outcome?.kind === 'correct' &&
                    'border-ok bg-ok-soft text-ok focus:border-ok focus:ring-ok/20',
                  wrong &&
                    'animate-shake border-err bg-err-soft text-err focus:border-err focus:ring-err/20',
                  (outcome?.kind === 'invalid' ||
                    outcome?.kind === 'rewrite') &&
                    'border-warn focus:border-warn focus:ring-warn/20',
                )}
              />
            </div>
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

          {/* Il prossimo passo scritto dal suggerimento, a matita. */}
          {stepMode && stepHint && (
            <p className="text-center">
              <Note className="text-2xl text-pencil-ink">{stepHint}</Note>
            </p>
          )}

          {/* Il giudizio sulla riga scritta: l'esercizio resta aperto. */}
          {stepMode && lineMessage && (
            <p
              role="alert"
              className="rounded-2xl border border-warn/25 bg-warn-soft px-4 py-3 text-sm font-semibold text-warn"
            >
              {lineMessage}
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
                onClick={askHint}
                disabled={
                  stepMode
                    ? nextHint(currentLine) === null
                    : hints >= solution.lines.length
                }
                icon={<Lightbulb aria-hidden="true" className="size-4" />}
              >
                Suggerimento
              </Button>
            </div>
          )}

          {!done && !stepMode && hints > 0 && (
            <p className="text-center text-sm text-dim">
              {`Righe svelate sul quaderno: ${hints} di ${solution.lines.length}`}
            </p>
          )}
        </form>
      </Panel>
    </section>
  )
}
