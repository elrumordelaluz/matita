import {
  problemText,
  quantities,
  quantityName,
  regionsKnownAfter,
  setCount,
  settingOf,
  solveVenn,
  toKatex,
  toText,
  vennAnswer,
  type ProblemExercise,
  type VennProblem,
} from '../engine/index.ts'
import { numberLine, type ShownLine } from './exerciseView.tsx'

// Come le pagine mostrano un problema con il diagramma di Eulero-Venn: il
// testo, le righe della soluzione e, dopo l'esito, il diagramma con le
// regioni riempite fino alla riga mostrata. Vedi SPEC.md, "Insiemi",
// "Problemi": prima di rispondere lo studente vede solo il testo.

export function problemLines({ problem }: ProblemExercise): ShownLine[] {
  return solveVenn(problem).map((row) => {
    const rows = row.solution.lines.map(numberLine)
    return {
      tex: [
        `\\text{${row.name}}`,
        toKatex(row.expression),
        ...rows.map((r) => r.tex),
      ].join(' = '),
      text: [row.name, toText(row.expression), ...rows.map((r) => r.text)].join(
        ' = ',
      ),
      continues: false,
      notes: [
        ...(row.backwards ? [`all’indietro, dal dato «${row.backwards}»`] : []),
        ...rows.flatMap((r) => r.notes),
      ],
    }
  })
}

export function problemResultText({ problem }: ProblemExercise): string {
  return String(vennAnswer(problem))
}

export function problemConsegnaText({ problem }: ProblemExercise): string {
  return problemText(problem) ?? ''
}

export function ProblemConsegna({ exercise }: { exercise: ProblemExercise }) {
  return (
    <p className="max-w-prose text-lg leading-relaxed text-ink sm:text-xl">
      {problemConsegnaText(exercise)}
    </p>
  )
}

interface Point {
  readonly x: number
  readonly y: number
}

// Il disegno: l'universo, i cerchi degli insiemi con il loro nome, e per ogni
// regione il punto dove si scrive il suo numero.
const layouts: Record<
  2 | 3,
  {
    readonly height: number
    readonly circles: readonly (Point & { readonly label: Point })[]
    readonly regions: readonly Point[]
  }
> = {
  2: {
    height: 210,
    circles: [
      { x: 122, y: 112, label: { x: 72, y: 30 } },
      { x: 198, y: 112, label: { x: 248, y: 30 } },
    ],
    // Nessuno, solo A, solo B, entrambi.
    regions: [
      { x: 28, y: 192 },
      { x: 86, y: 116 },
      { x: 234, y: 116 },
      { x: 160, y: 116 },
    ],
  },
  3: {
    height: 290,
    circles: [
      { x: 125, y: 110, label: { x: 52, y: 34 } },
      { x: 195, y: 110, label: { x: 268, y: 34 } },
      { x: 160, y: 170, label: { x: 268, y: 262 } },
    ],
    // Il bit i della regione dice se sta nell'insieme i.
    regions: [
      { x: 28, y: 272 },
      { x: 98, y: 92 },
      { x: 222, y: 92 },
      { x: 160, y: 80 },
      { x: 160, y: 218 },
      { x: 120, y: 156 },
      { x: 200, y: 156 },
      { x: 160, y: 132 },
    ],
  },
}

/**
 * Il diagramma di Eulero-Venn del problema, con i numeri delle regioni note
 * dopo `shown` righe. Ogni regione ha il suo nome come testo accessibile.
 */
export function VennDiagram({
  problem,
  shown,
}: {
  problem: VennProblem
  shown: number
}) {
  const k = setCount(problem)
  const { words } = settingOf(problem.setting)
  const layout = layouts[k]
  const known = new Set(regionsKnownAfter(problem, shown))
  const named = quantities(k)
  return (
    <svg
      role="group"
      aria-label="Diagramma di Eulero-Venn"
      viewBox={`0 0 320 ${layout.height}`}
      className="mx-auto w-full max-w-sm"
    >
      <rect
        x="4"
        y="4"
        width="312"
        height={layout.height - 8}
        rx="16"
        className="fill-paper stroke-hair"
        strokeWidth="2"
      />
      {layout.circles.map((c, i) => (
        <g key={i} aria-hidden="true">
          <circle
            cx={c.x}
            cy={c.y}
            r={k === 2 ? 76 : 70}
            className="fill-pencil/10 stroke-pencil"
            strokeWidth="2.5"
          />
          <text
            x={c.label.x}
            y={c.label.y}
            textAnchor="middle"
            className="fill-pencil-ink font-hand text-[20px]"
          >
            {words[i]}
          </text>
        </g>
      ))}
      {layout.regions.map((p, r) => {
        const name = quantityName(named.region(r), k, words)
        const value = known.has(r) ? problem.regions[r] : undefined
        return (
          <g
            key={r}
            role="img"
            aria-label={value === undefined ? name : `${name}: ${value}`}
          >
            {value !== undefined && (
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="animate-write fill-ink font-display text-[22px] font-bold"
              >
                {String(value)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
