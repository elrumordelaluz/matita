import {
  objectToKatex,
  objectToText,
  relationSetKatex,
  relationSetText,
  relationSymbols,
  solveRelations,
  symbolKatex,
  type RelationLine,
  type RelationSymbol,
  type SymbolsExercise,
} from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import type { ShownLine } from './exerciseView.tsx'
import { Formula } from './Formula.tsx'

// Come le pagine mostrano le scritture da completare con ∈ ∉ ⊂ ⊆ ⊄ =. Vedi
// SPEC.md, "Insiemi", "Appartenenza e inclusione": i simboli si scelgono
// con dei tasti, non si scrivono, e la risposta è la fila dei quattro
// simboli nell'ordine degli oggetti, `∈,∉,⊂,=`.

function reasonText({ object, reason, witness }: RelationLine): string {
  const name = objectToText(object)
  switch (reason) {
    case 'element':
      return `${name} è un elemento di A`
    case 'not-element':
      return `${name} non è un elemento di A`
    case 'proper':
      return 'ogni suo elemento sta in A, e A ne ha altri'
    case 'equal':
      return 'ha gli stessi elementi di A'
    case 'outside':
      return `${String(witness)} non sta in A`
  }
}

export function relationLines(exercise: SymbolsExercise): ShownLine[] {
  return solveRelations(exercise).map((line) => ({
    tex: `${objectToKatex(line.object)} ${symbolKatex[line.symbol]} A`,
    text: `${objectToText(line.object)} ${line.symbol} A`,
    continues: false,
    notes: [reasonText(line)],
  }))
}

export function relationsResultText(exercise: SymbolsExercise): string {
  return relationLines(exercise)
    .map((l) => l.text)
    .join(', ')
}

export function relationsConsegnaText(exercise: SymbolsExercise): string {
  const blanks = exercise.objects.map((o) => `${objectToText(o)} … A`)
  return `${relationSetText(exercise.set)}: ${blanks.join(', ')}`
}

export function RelationsConsegna({
  exercise,
  className,
}: {
  exercise: SymbolsExercise
  className?: string
}) {
  return (
    <Formula
      tex={relationSetKatex(exercise.set)}
      text={relationSetText(exercise.set)}
      {...(className === undefined ? {} : { className })}
    />
  )
}

/** I simboli scelti, uno per scrittura; una scrittura senza simbolo è vuota. */
export function chosenSymbols(answer: string, count: number): string[] {
  const parts = answer === '' ? [] : answer.split(',')
  return Array.from({ length: count }, (_, i) => parts[i] ?? '')
}

/** Vero quando ogni scrittura ha il suo simbolo: "Verifica" si attiva. */
export function symbolsComplete(answer: string, count: number): boolean {
  return chosenSymbols(answer, count).every((s) => s !== '')
}

export function SymbolsAnswer({
  exercise,
  answer,
  onChange,
  disabled = false,
}: {
  exercise: SymbolsExercise
  answer: string
  onChange: (answer: string) => void
  disabled?: boolean
}) {
  const chosen = chosenSymbols(answer, exercise.objects.length)
  const choose = (i: number, symbol: string) =>
    onChange(chosen.map((s, j) => (j === i ? symbol : s)).join(','))
  return (
    <ol className="space-y-3">
      {exercise.objects.map((object, i) => {
        const symbol = chosen[i] ?? ''
        const text = objectToText(object)
        return (
          <li
            key={i}
            role="group"
            aria-label={`Scrittura ${i + 1}: ${text} … A`}
            className="space-y-2"
          >
            <p className="text-center font-display text-2xl font-bold">
              <Formula
                tex={`${objectToKatex(object)} \\; ${symbol === '' ? '\\square' : symbolKatex[symbol as RelationSymbol]} \\; A`}
                text={`${text} ${symbol === '' ? '…' : symbol} A`}
              />
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {relationSymbols.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  aria-pressed={symbol === s}
                  onClick={() => choose(i, s)}
                  className={cn(
                    'h-11 rounded-xl border font-display text-lg font-bold transition',
                    symbol === s
                      ? 'border-pencil bg-pencil text-on-pencil'
                      : 'border-hair bg-panel text-ink hover:bg-paper',
                    'disabled:opacity-60',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
