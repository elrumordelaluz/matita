import {
  countAsked,
  countGivens,
  countResult,
  solveCount,
  toKatex,
  toText,
  type CountExercise,
} from '../engine/index.ts'
import { numberLine, type ShownLine } from './shownLine.ts'
import { Formula } from './Formula.tsx'

// Come le pagine mostrano un conto del capitolo 5: gli insiemi dati per
// elencazione e ciò che si conta, card(℘(A)) o card(A × B). La soluzione
// conta gli elementi, poi fa la potenza o il prodotto come nel capitolo 4.

const katexName = { '℘(A)': '\\wp(A)', 'A × B': 'A \\times B' } as const

export function countLines(exercise: CountExercise): ShownLine[] {
  return solveCount(exercise).map((line) => {
    if (line.kind === 'card')
      return {
        tex: `\\operatorname{card}(${line.name}) = ${line.value}`,
        text: `card(${line.name}) = ${line.value}`,
        continues: false,
        notes: [`${line.name} ha ${line.value} elementi`],
      }
    const rows = line.solution.lines.map(numberLine)
    return {
      tex: [
        `\\operatorname{card}(${katexName[line.name]})`,
        toKatex(line.expression),
        ...rows.map((r) => r.tex),
      ].join(' = '),
      text: [
        `card(${line.name})`,
        toText(line.expression),
        ...rows.map((r) => r.text),
      ].join(' = '),
      continues: false,
      notes: rows.flatMap((r) => r.notes),
    }
  })
}

export function countResultText(exercise: CountExercise): string {
  return String(countResult(exercise))
}

export function countPromptText(exercise: CountExercise): string {
  const givens = countGivens(exercise).map((g) => g.text)
  return `${givens.join(', ')}: ${countAsked(exercise).text}`
}

export function CountPrompt({
  exercise,
  className,
}: {
  exercise: CountExercise
  className?: string
}) {
  const asked = countAsked(exercise)
  return (
    <span className="inline-flex flex-col items-start gap-3">
      <span className="flex flex-wrap gap-x-5 gap-y-1 text-lg sm:text-xl">
        {countGivens(exercise).map((g) => (
          <Formula key={g.text} tex={g.tex} text={g.text} />
        ))}
      </span>
      <Formula
        tex={asked.tex}
        text={asked.text}
        {...(className === undefined ? {} : { className })}
      />
    </span>
  )
}
