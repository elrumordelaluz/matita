import { ChevronsDown, Eraser, Plus, RotateCcw } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import {
  toText,
  unknownKind,
  type Bracket,
  type Exercise,
  type Line,
  type LiteralExpression,
  type NumberExercise,
  type PolynomialExercise,
  type Rule,
} from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import {
  ExercisePrompt,
  promptText,
  expressionLines,
  SolutionFigure,
  solutionOf,
} from './exerciseView.tsx'
import { ExpressionFormula, Formula } from './Formula.tsx'
import { Button, Eyebrow, Note, Sheet } from './kit.tsx'
import { markedSteps, type MarkedStep } from './lesson/steps.ts'
import { useSeen } from './lesson/useSeen.ts'

// Un esempio svolto sul quaderno: l'esercizio risolto dal motore, riga per
// riga. Le righe si scrivono quando il foglio entra in vista; ogni riga si
// apre un passaggio alla volta, con l'operazione evidenziata e la regola a
// margine.

// Una riga dopo l'altra, come a matita. Le classi sono scritte per intero
// perché Tailwind le veda.
const delays = [
  '[animation-delay:350ms]',
  '[animation-delay:750ms]',
  '[animation-delay:1150ms]',
  '[animation-delay:1550ms]',
  '[animation-delay:1950ms]',
  '[animation-delay:2350ms]',
]
const delay = (i: number) => delays[Math.min(i, delays.length - 1)]

const ruleNote: Record<Rule, string> = {
  'mul-div-left-to-right': 'prima × e :',
  'add-sub-left-to-right': 'poi + e −',
  'change-sign': 'il meno cambia il segno',
  'minus-power': 'prima la potenza, il meno resta fuori',
  power: 'prima le potenze',
  substitution: 'al posto della lettera, il suo valore',
  'normal-form': 'forma normale: un solo coefficiente, lettere diverse',
  'monomial-product': 'coefficienti per coefficienti, esponenti sommati',
  'monomial-quotient': 'coefficienti divisi, esponenti sottratti',
  'monomial-power': 'si eleva il coefficiente, gli esponenti si moltiplicano',
  'like-terms': 'i simili: si sommano i coefficienti, le lettere restano',
  'minus-group': 'il meno cambia il segno di ogni termine',
  distributive: 'ogni termine per ogni termine',
  'polynomial-quotient': 'ogni termine diviso per il monomio',
  'square-of-binomial': 'quadrato di un binomio: si scrive la formula',
  'sum-times-difference': 'somma per differenza: si scrive la formula',
  'square-of-trinomial': 'quadrato di un trinomio: si scrive la formula',
  'cube-of-binomial': 'cubo di un binomio: si scrive la formula',
  'same-base-product': 'stessa base: si sommano gli esponenti',
  'same-base-quotient': 'stessa base: si sottraggono gli esponenti',
  'power-of-power': 'potenza di potenza: si moltiplicano gli esponenti',
  'same-exponent-product': 'stesso esponente: si moltiplicano le basi',
  'same-exponent-quotient': 'stesso esponente: si dividono le basi',
}

const bracketName: Record<Bracket, string> = {
  round: 'tonde',
  square: 'quadre',
  curly: 'graffe',
}

export function WorkedExample({ exercise }: { exercise: Exercise }) {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return <NotebookExample exercise={exercise} />
    case 'polynomial':
      return <NotebookExample exercise={exercise} />
    case 'set':
    case 'symbols':
    case 'count':
      return <LinesWorkedExample exercise={exercise} />
    case 'problem':
      return (
        <LinesWorkedExample exercise={exercise}>
          <SolutionFigure
            exercise={exercise}
            shown={solutionOf(exercise).length}
          />
        </LinesWorkedExample>
      )
    default:
      return unknownKind(exercise)
  }
}

// L'esercizio sul quaderno con le righe della sua soluzione, uguale per ogni
// tipo che si svolge per righe.
function NotebookExample({
  exercise,
}: {
  exercise: NumberExercise<LiteralExpression> | PolynomialExercise
}) {
  const { lines, marked } = useMemo(() => {
    const lines = expressionLines(exercise)
    return { lines, marked: markedSteps(exercise.expression, lines) }
  }, [exercise])
  const [open, setOpen] = useState(() => lines.map(() => 0))
  // Cambia a ogni "Riscrivi": le righe si rimontano e si riscrivono.
  const [take, setTake] = useState(0)
  const [ref, seen] = useSeen<HTMLElement>()
  const allOpen = lines.every((line, i) => open[i] === line.steps.length)

  return (
    <Sheet className="h-full p-4 sm:p-6">
      <figure
        ref={ref}
        aria-label={`Esempio: ${promptText(exercise)}`}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-pencil"
            />
            Esempio svolto
          </Eyebrow>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              disabled={allOpen}
              onClick={() => setOpen(lines.map((line) => line.steps.length))}
              icon={<ChevronsDown aria-hidden="true" className="size-4" />}
              className="rounded-xl px-3 py-1.5 text-sm"
            >
              Apri tutto
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(lines.map(() => 0))
                setTake((t) => t + 1)
              }}
              icon={<RotateCcw aria-hidden="true" className="size-4" />}
              className="rounded-xl px-3 py-1.5 text-sm"
            >
              Riscrivi
            </Button>
          </div>
        </div>

        <div key={take} className="flex flex-col gap-3">
          <div className="grid grid-cols-[1.75rem_minmax(0,1fr)]">
            <div
              className={cn(
                'col-start-2 p-1',
                seen ? 'animate-write' : 'opacity-0',
              )}
            >
              <ExercisePrompt
                exercise={exercise}
                className="text-xl sm:text-2xl"
              />
            </div>
          </div>
          <ol className="flex flex-col gap-3">
            {lines.map((line, i) => (
              <ExampleLine
                key={i}
                line={line}
                steps={marked[i] ?? []}
                index={i + 1}
                last={i === lines.length - 1}
                open={open[i] ?? 0}
                seen={seen}
                onOpen={() =>
                  setOpen((counts) =>
                    counts.map((n, j) => (j === i ? n + 1 : n)),
                  )
                }
              />
            ))}
          </ol>
        </div>
      </figure>
    </Sheet>
  )
}

function ExampleLine({
  line,
  steps,
  index,
  last,
  open,
  seen,
  onOpen,
}: {
  line: Line
  steps: readonly MarkedStep[]
  index: number
  last: boolean
  open: number
  seen: boolean
  onOpen: () => void
}) {
  return (
    <li
      aria-label={`Riga ${index}`}
      className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start"
    >
      <span
        className={cn(
          'pt-1.5 text-xl text-dim sm:text-2xl',
          seen ? ['animate-rise', delay(index - 1)] : 'opacity-0',
        )}
      >
        =
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div
            className={cn(
              'flex items-center gap-3 p-1',
              seen ? ['animate-write', delay(index - 1)] : 'opacity-0',
            )}
          >
            <ExpressionFormula
              expression={line.expression}
              className={cn(
                'text-xl sm:text-2xl',
                last && 'rounded-full px-3 py-0.5 ring-2 ring-pencil',
              )}
            />
            {last && <Note className="text-pencil-ink">risultato</Note>}
          </div>
          {open < line.steps.length && (
            <div
              className={cn(
                'ml-auto flex items-center gap-2',
                seen ? ['animate-rise', delay(index)] : 'opacity-0',
              )}
            >
              {line.steps.length > 1 && (
                <span aria-hidden="true" className="flex gap-1">
                  {line.steps.map((_, j) => (
                    <span
                      key={j}
                      className={cn(
                        'size-1.5 rounded-full transition-colors',
                        j < open ? 'bg-pencil' : 'bg-dim/30',
                      )}
                    />
                  ))}
                </span>
              )}
              <Button
                variant="ghost"
                onClick={onOpen}
                icon={<Plus aria-hidden="true" className="size-4" />}
                className="rounded-xl px-3 py-1.5 text-sm"
              >
                Mostra un passaggio
              </Button>
            </div>
          )}
        </div>
        {open > 0 && (
          <ol className="mt-2 mb-1 flex flex-col gap-2.5 border-l-2 border-pencil/70 pl-3 sm:pl-4">
            {steps.slice(0, open).map((marked, j) => (
              <StepRow key={j} marked={marked} />
            ))}
          </ol>
        )}
      </div>
    </li>
  )
}

function StepRow({ marked }: { marked: MarkedStep }) {
  const { step, before, tex, bracket, settles } = marked
  return (
    <li className="flex animate-rise flex-wrap items-center gap-x-3 gap-y-1">
      <Formula
        marked
        tex={tex}
        text={toText(before)}
        className="text-base text-lead sm:text-lg"
      />
      <span className="rounded-lg bg-panel px-2 py-0.5 text-sm font-semibold tabular-nums shadow-panel">
        {`${toText(step.operation)} = ${toText(step.outcome)}`}
      </span>
      <Note>
        {bracket && `dentro le ${bracketName[bracket]}: `}
        {ruleNote[step.rule]}
      </Note>
      {settles && bracket && (
        <span className="inline-flex items-center gap-1 text-sm text-dim">
          <Eraser aria-hidden="true" className="size-4" />
          via le {bracketName[bracket]}
        </span>
      )}
      {step.products && (
        <ul
          aria-label={
            step.rule === 'polynomial-quotient'
              ? 'I quozienti termine per termine'
              : 'I prodotti a due a due'
          }
          className="flex w-full flex-wrap gap-x-4 gap-y-1 text-sm text-lead tabular-nums"
        >
          {step.products.map((p, k) => (
            <li key={k}>{`${toText(p.operation)} = ${toText(p.outcome)}`}</li>
          ))}
        </ul>
      )}
      {step.formula && (
        <p className="flex w-full flex-wrap gap-x-4 gap-y-1 text-sm text-lead tabular-nums">
          <span>{step.formula.text}</span>
          <span>
            {step.formula.terms
              .map((t) => `${t.name} = ${toText(t.term)}`)
              .join(', ')}
          </span>
        </p>
      )}
    </li>
  )
}

// Un esempio svolto di un tipo che non è un'espressione di numeri: la
// consegna e le righe della soluzione, ciascuna con i suoi passaggi già
// scritti a margine. Sono le stesse righe del quaderno della pratica.
function LinesWorkedExample({
  exercise,
  children,
}: {
  exercise: Exercise
  /** Ciò che accompagna le righe, come il diagramma di un problema. */
  children?: ReactNode
}) {
  const lines = useMemo(() => solutionOf(exercise), [exercise])
  const [ref, seen] = useSeen<HTMLElement>()
  return (
    <Sheet className="h-full p-4 sm:p-6">
      <figure
        ref={ref}
        aria-label={`Esempio: ${promptText(exercise)}`}
        className="flex flex-col gap-5"
      >
        <Eyebrow className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-pencil" />
          Esempio svolto
        </Eyebrow>
        <div className={cn('p-1', seen ? 'animate-write' : 'opacity-0')}>
          <ExercisePrompt exercise={exercise} className="text-xl sm:text-2xl" />
        </div>
        <ol className="flex flex-col gap-3">
          {lines.map((line, i) => (
            <li
              key={i}
              aria-label={`Riga ${i + 1}`}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'pt-1.5 text-xl text-dim sm:text-2xl',
                  seen ? ['animate-rise', delay(i)] : 'opacity-0',
                )}
              >
                {line.continues ? '=' : ''}
              </span>
              <div
                className={cn(
                  'flex min-w-0 flex-col gap-1.5 p-1',
                  seen ? ['animate-write', delay(i)] : 'opacity-0',
                )}
              >
                <span className="flex flex-wrap items-center gap-3">
                  <Formula
                    tex={line.tex}
                    text={line.text}
                    className={cn(
                      'text-xl sm:text-2xl',
                      i === lines.length - 1 &&
                        'rounded-full px-3 py-0.5 ring-2 ring-pencil',
                    )}
                  />
                  {i === lines.length - 1 && (
                    <Note className="text-pencil-ink">risultato</Note>
                  )}
                </span>
                {line.notes.length > 0 && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 border-l-2 border-pencil/70 pl-3">
                    {line.notes.map((note, j) => (
                      <li key={j}>
                        <Note>{note}</Note>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
        {children}
      </figure>
    </Sheet>
  )
}
