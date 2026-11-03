import {
  answerForm,
  literal,
  readSetAnswer,
  setToText,
  solveSet,
  polynomialExpression,
  readPolynomialAnswer,
  solveLiteral,
  solveWithValues,
  substitute,
  toKatex,
  toText,
  unknownKind,
  type AnswerForm,
  type Assignment,
  type Exercise,
  type Expression,
  type Line,
  type LiteralExpression,
  type NumberExercise,
  type PolynomialExercise,
} from '../engine/index.ts'
import {
  CountConsegna,
  countConsegnaText,
  countLines,
  countResultText,
} from './countView.tsx'
import { ExpressionFormula, Formula } from './Formula.tsx'
import {
  relationLines,
  RelationsConsegna,
  relationsConsegnaText,
  relationsResultText,
  SymbolsAnswer,
  symbolsComplete,
} from './relationsView.tsx'
import {
  SetConsegna,
  setConsegnaText,
  setLines,
  setWording,
} from './setView.tsx'
import { setSymbolKeys, symbolKeys, type SymbolKey } from './symbolRow.ts'
import {
  ProblemConsegna,
  problemConsegnaText,
  problemLines,
  problemResultText,
  VennDiagram,
} from './vennView.tsx'

// Ciò che le pagine mostrano di un esercizio, secondo il suo tipo di risposta
// (SPEC.md, "Tipi di risposta"): la consegna, le parole che la presentano, la
// soluzione per righe e il risultato. Un tipo nuovo si tratta qui; il
// compilatore indica ogni `switch` che lo aspetta.

/** Le parole della consegna: il compito sul quaderno, la domanda in lezione. */
export function wordingOf(exercise: Exercise): {
  readonly task: string
  readonly question: string
} {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return {
        task: 'Calcola il valore dell’espressione',
        question: 'Quanto vale?',
      }
    case 'set':
      return setWording(exercise)
    case 'symbols':
      return {
        task: 'Completa con ∈, ∉, ⊂, ⊆, ⊄ o =',
        question: 'Quale simbolo va in ogni scrittura?',
      }
    case 'count':
      return { task: 'Conta gli elementi', question: 'Quanti elementi ha?' }
    case 'problem':
      return { task: 'Risolvi il problema', question: 'Quanti sono?' }
    case 'polynomial':
      return {
        task: 'Svolgi e scrivi il risultato in forma normale',
        question: 'Che cosa diventa?',
      }
    default:
      return unknownKind(exercise)
  }
}

/**
 * Una riga della soluzione come la scrive il quaderno, qualunque sia il
 * tipo: la formula, e a margine i passaggi.
 */
export interface ShownLine {
  readonly tex: string
  readonly text: string
  /** La riga continua quella sopra, e a margine porta il segno =. */
  readonly continues: boolean
  /** I passaggi, uno per conto, scritti a margine. */
  readonly notes: readonly string[]
}

/** Una riga del risolutore dei numeri: l'espressione e i suoi conti. */
export function numberLine(line: Line): ShownLine {
  return {
    tex: toKatex(line.expression),
    text: toText(line.expression),
    continues: true,
    notes: line.steps.map(
      (step) => `${toText(step.operation)} = ${toText(step.outcome)}`,
    ),
  }
}

export function solutionOf(exercise: Exercise): readonly ShownLine[] {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return solveWithValues(
        exercise.expression,
        exercise.substitution ?? [],
      ).lines.map(numberLine)
    case 'polynomial':
      return solveLiteral(exercise.expression).lines.map(numberLine)
    case 'set':
      return setLines(exercise)
    case 'symbols':
      return relationLines(exercise)
    case 'count':
      return countLines(exercise)
    case 'problem':
      return problemLines(exercise)
    default:
      return unknownKind(exercise)
  }
}

/**
 * Le righe del risolutore per i tipi che si svolgono su un'espressione: la
 * lezione le apre un passaggio alla volta.
 */
export function expressionLines(
  exercise: NumberExercise<LiteralExpression> | PolynomialExercise,
): readonly Line[] {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return solveWithValues(exercise.expression, exercise.substitution ?? [])
        .lines
    case 'polynomial':
      return solveLiteral(exercise.expression).lines
    default:
      return unknownKind(exercise)
  }
}

/** Il risultato come lo scrive la soluzione, in testo semplice. */
export function resultText(exercise: Exercise): string {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return toText(
        literal(
          solveWithValues(exercise.expression, exercise.substitution ?? [])
            .result,
        ),
      )
    case 'polynomial':
      return toText(
        polynomialExpression(solveLiteral(exercise.expression).result),
      )
    case 'set':
      return setToText(solveSet(exercise).result)
    case 'symbols':
      return relationsResultText(exercise)
    case 'count':
      return countResultText(exercise)
    case 'problem':
      return problemResultText(exercise)
    default:
      return unknownKind(exercise)
  }
}

// I valori delle lettere come li dà la consegna: per a = −2, b = 3.
function valuesText(substitution: readonly Assignment[]): string {
  return substitution
    .map(({ letter, value }) => `${letter} = ${toText(literal(value))}`)
    .join(', ')
}

function valuesKatex(substitution: readonly Assignment[]): string {
  return substitution
    .map(({ letter, value }) => `${letter} = ${toKatex(literal(value))}`)
    .join(',\\; ')
}

/** La consegna in testo semplice, per i nomi accessibili. */
export function consegnaText(exercise: Exercise): string {
  switch (exercise.kind) {
    case undefined:
    case 'number': {
      const text = toText(exercise.expression)
      const { substitution = [] } = exercise
      return substitution.length > 0
        ? `${text}, per ${valuesText(substitution)}`
        : text
    }
    case 'polynomial':
      return toText(exercise.expression)
    case 'set':
      return setConsegnaText(exercise)
    case 'symbols':
      return relationsConsegnaText(exercise)
    case 'count':
      return countConsegnaText(exercise)
    case 'problem':
      return problemConsegnaText(exercise)
    default:
      return unknownKind(exercise)
  }
}

/**
 * L'espressione da svolgere passo passo, se l'esercizio la ha. Il passo
 * passo c'è solo per le abilità del capitolo 1, quelle dei numeri naturali.
 */
export function stepExpression(exercise: Exercise): Expression | null {
  switch (exercise.kind) {
    case undefined:
    case 'number':
      return exercise.skill.startsWith('n.')
        ? substitute(exercise.expression, [])
        : null
    case 'polynomial':
    case 'set':
    case 'symbols':
    case 'count':
    case 'problem':
      return null
    default:
      return unknownKind(exercise)
  }
}

/** La risposta come scritta, per l'anteprima, o nulla se non si legge. */
export function answerPreview(
  exercise: Exercise,
  answer: string,
): AnswerForm | null {
  switch (exercise.kind) {
    case undefined:
    case 'number':
    case 'count':
    case 'problem':
      return answerForm(answer)
    case 'polynomial': {
      const reading = readPolynomialAnswer(answer)
      return reading.ok ? reading.form : null
    }
    case 'set': {
      const reading = readSetAnswer(answer)
      return reading.ok ? reading.form : null
    }
    case 'symbols':
      return null
    default:
      return unknownKind(exercise)
  }
}

/** I tasti della riga simboli sul telefono, quelli che servono al tipo. */
export function keysOf(exercise: Exercise): readonly SymbolKey[] {
  switch (exercise.kind) {
    case undefined:
    case 'number':
    case 'count':
    case 'problem':
    case 'polynomial':
      return symbolKeys
    case 'set':
      return setSymbolKeys
    case 'symbols':
      return []
    default:
      return unknownKind(exercise)
  }
}

export function Consegna({
  exercise,
  className,
}: {
  exercise: Exercise
  className?: string
}) {
  const size = className === undefined ? {} : { className }
  switch (exercise.kind) {
    case undefined:
    case 'number': {
      const { substitution = [] } = exercise
      if (substitution.length === 0)
        return <ExpressionFormula expression={exercise.expression} {...size} />
      return (
        <Formula
          tex={`${toKatex(exercise.expression)} \\quad \\text{per } ${valuesKatex(substitution)}`}
          text={consegnaText(exercise)}
          {...size}
        />
      )
    }
    case 'polynomial':
      return <ExpressionFormula expression={exercise.expression} {...size} />
    case 'set':
      return <SetConsegna exercise={exercise} {...size} />
    case 'symbols':
      return <RelationsConsegna exercise={exercise} {...size} />
    case 'count':
      return <CountConsegna exercise={exercise} {...size} />
    case 'problem':
      // Il testo ha la sua misura: quella delle formule sarebbe troppa.
      return <ProblemConsegna exercise={exercise} />
    default:
      return unknownKind(exercise)
  }
}

/**
 * Come si risponde: scrivendo nel campo, o scegliendo un simbolo per ogni
 * scrittura con i tasti.
 */
export function answerMode(exercise: Exercise): 'text' | 'symbols' {
  switch (exercise.kind) {
    case undefined:
    case 'number':
    case 'polynomial':
    case 'set':
    case 'count':
    case 'problem':
      return 'text'
    case 'symbols':
      return 'symbols'
    default:
      return unknownKind(exercise)
  }
}

/** Vero quando la risposta si può verificare: ogni scrittura ha un simbolo. */
export function answerReady(exercise: Exercise, answer: string): boolean {
  return exercise.kind === 'symbols'
    ? symbolsComplete(answer, exercise.objects.length)
    : true
}

/** I tasti con cui si risponde, per i tipi che non si scrivono nel campo. */
export function AnswerChoices({
  exercise,
  answer,
  onChange,
  disabled,
}: {
  exercise: Exercise
  answer: string
  onChange: (answer: string) => void
  disabled: boolean
}) {
  if (exercise.kind !== 'symbols') return null
  return (
    <SymbolsAnswer
      exercise={exercise}
      answer={answer}
      onChange={onChange}
      disabled={disabled}
    />
  )
}

/**
 * Ciò che accompagna la soluzione dopo l'esito, se il tipo lo ha: per un
 * problema il diagramma, con le regioni riempite fino alla riga `shown`.
 */
export function SolutionFigure({
  exercise,
  shown,
}: {
  exercise: Exercise
  shown: number
}) {
  if (exercise.kind !== 'problem') return null
  return <VennDiagram problem={exercise.problem} shown={shown} />
}
