import {
  propertyToKatex,
  propertyToText,
  setExpressionToKatex,
  setExpressionToText,
  setToKatex,
  setToText,
  solveSet,
  type SetExercise,
  type SetExpression,
  type SetLine,
  type SetTask,
} from '../engine/index.ts'
import { cn } from '../lib/cn.ts'
import type { ShownLine } from './shownLine.ts'
import { Formula } from './Formula.tsx'

// Come le pagine mostrano un esercizio che chiede un insieme: la consegna,
// le parole, le righe della soluzione. Vedi SPEC.md, "Insiemi".

export function setWording({ task }: SetExercise) {
  switch (task.kind) {
    case 'roster':
      return {
        task: 'Scrivi l’insieme per elencazione',
        question: 'Quali elementi ha?',
      }
    case 'operations':
      return {
        task: 'Calcola e scrivi il risultato per elencazione',
        question: 'Quale insieme è?',
      }
  }
}

// Un operando dentro la frase del passaggio: fra parentesi se è
// un'operazione, perché la frase lo mette accanto a un'altra.
function operand(e: SetExpression): string {
  const text = setExpressionToText(e)
  return e.kind === 'binary' ? `(${text})` : text
}

function elementsText(elements: readonly bigint[]): string {
  return elements.length === 0 ? 'nessuno' : elements.join(', ')
}

// Il passaggio di una riga, a parole: dove stanno gli elementi che entrano.
function why(line: SetLine): string[] {
  if (line.kind === 'roster') return []
  const entering = elementsText(line.entering.elements)
  const { label } = line
  if (label.kind === 'complement')
    return [`in U ma non in ${operand(label.operand)}: ${entering}`]
  if (label.kind !== 'binary') return []
  const left = operand(label.left)
  const right = operand(label.right)
  switch (label.op) {
    case '∪':
      return [`in ${left} o in ${right}: ${entering}`]
    case '∩':
      return [`in ${left} e in ${right}: ${entering}`]
    case '−':
      return [`in ${left} ma non in ${right}: ${entering}`]
  }
}

export function setLines(exercise: SetExercise): ShownLine[] {
  return solveSet(exercise).lines.map((line) => {
    const result = {
      tex: setToKatex(line.result),
      text: setToText(line.result),
    }
    if (line.kind === 'roster') return { ...result, continues: true, notes: [] }
    return {
      tex: `${setExpressionToKatex(line.label)} = ${result.tex}`,
      text: `${setExpressionToText(line.label)} = ${result.text}`,
      continues: false,
      notes: why(line),
    }
  })
}

// Gli insiemi dati, e l'universo se c'è: A = {1, 3, 5}.
function givens(task: SetTask) {
  if (task.kind !== 'operations') return []
  return [
    ...task.sets.map(({ name, set }) => ({
      tex: `${name} = ${setToKatex(set)}`,
      text: `${name} = ${setToText(set)}`,
    })),
    ...(task.universe
      ? [
          {
            tex: `U = ${setToKatex(task.universe)}`,
            text: `U = ${setToText(task.universe)}`,
          },
        ]
      : []),
  ]
}

export function setPromptText({ task }: SetExercise): string {
  switch (task.kind) {
    case 'roster':
      return propertyToText(task.property)
    case 'operations':
      return `${givens(task)
        .map((g) => g.text)
        .join(', ')}: ${setExpressionToText(task.expression)}`
  }
}

export function SetPrompt({
  exercise: { task },
  className,
}: {
  exercise: SetExercise
  className?: string
}) {
  switch (task.kind) {
    case 'roster':
      return (
        <Formula
          tex={propertyToKatex(task.property)}
          text={propertyToText(task.property)}
          {...(className === undefined ? {} : { className })}
        />
      )
    case 'operations':
      return (
        <span className="inline-flex flex-col items-start gap-3">
          <span className="flex flex-wrap gap-x-5 gap-y-1 text-lg sm:text-xl">
            {givens(task).map((g) => (
              <Formula key={g.text} tex={g.tex} text={g.text} />
            ))}
          </span>
          <Formula
            tex={setExpressionToKatex(task.expression)}
            text={setExpressionToText(task.expression)}
            className={cn(className)}
          />
        </span>
      )
  }
}
