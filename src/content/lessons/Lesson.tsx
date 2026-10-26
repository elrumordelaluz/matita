import { ArrowRight, Check } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import type { Exercise, GeneratedSkill } from '../../engine/index.ts'
import { cn } from '../../lib/cn.ts'
import { CheckQuestion } from '../../ui/CheckQuestion.tsx'
import { Button, Eyebrow, Note, Panel, Ring } from '../../ui/kit.tsx'
import { WorkedExample } from '../../ui/WorkedExample.tsx'
import type { Chapter } from '../chapters.ts'

// Il banco di una lezione, uguale per ogni capitolo. Vedi SPEC.md, "Lezioni".
// La testata del capitolo con il percorso della lezione, poi una postazione
// per regola, con la spiegazione e la domanda a sinistra e il quaderno al
// centro, infine l'invito alla pratica. Esempi e domande vengono dai
// generatori con un seme fisso, così la lezione mostra le stesse righe che lo
// studente vedrà nella soluzione di un esercizio.

export interface LessonPart {
  readonly id: string
  readonly title: string
  /** La regola da ricordare, scritta a margine. */
  readonly note: string
  readonly text: ReactNode
  readonly example: Exercise
  readonly question: Exercise
}

/** Le props di ogni lezione registrata in `lessons/index.ts`. */
export interface LessonProps {
  readonly onPractise: (skill: GeneratedSkill) => void
}

const practiceId = 'lezione-pratica'

export function Lesson({
  chapter,
  heading,
  intro,
  parts,
  practice,
  onPractise,
}: LessonProps & {
  chapter: Chapter
  /** Il titolo grande in testata. */
  heading: ReactNode
  intro: ReactNode
  parts: readonly LessonPart[]
  /** Da dove parte la pratica, con una frase che lo dice. */
  practice: { readonly skill: GeneratedSkill; readonly text: string }
}) {
  // Le domande di controllo già risolte, per il percorso in testata.
  const [solved, setSolved] = useState<ReadonlySet<string>>(new Set())

  return (
    <article className="flex flex-col gap-8 leading-relaxed sm:gap-10">
      <Panel className="grid animate-rise gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-10">
        <header className="flex flex-col gap-4">
          <Eyebrow>
            Capitolo {chapter.number} <span className="text-pencil">·</span>{' '}
            Lezione
          </Eyebrow>
          <h2 className="font-display text-4xl leading-none font-bold tracking-tight sm:text-5xl">
            {heading}
          </h2>
          <div className="max-w-prose">{intro}</div>
          <div className="mt-1">
            <Eyebrow>Le abilità del capitolo</Eyebrow>
            <ul className="mt-2 flex flex-wrap gap-2">
              {chapter.skills.map((skill) => (
                <li
                  key={skill.id}
                  className="rounded-full border border-hair bg-paper px-3 py-1 text-sm"
                >
                  {skill.title}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <nav
          aria-label="Percorso della lezione"
          className="self-start rounded-2xl border border-hair/70 bg-paper p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow>Percorso</Eyebrow>
              <p className="font-display font-bold">Domande di controllo</p>
            </div>
            <Ring value={solved.size / parts.length}>
              {solved.size}/{parts.length}
            </Ring>
          </div>
          <ol className="mt-3 flex flex-col gap-1">
            {parts.map((part, i) => (
              <li key={part.id}>
                <TrackLink
                  href={`#${part.id}`}
                  index={i + 1}
                  done={solved.has(part.id)}
                >
                  <span className="sr-only">
                    {solved.has(part.id) ? 'Risolta: ' : `${i + 1}. `}
                  </span>
                  {part.title}
                </TrackLink>
              </li>
            ))}
            <li>
              <a
                href={`#${practiceId}`}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm font-semibold text-pencil-ink transition hover:bg-pencil-soft focus-visible:ring-2 focus-visible:ring-pencil focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 place-items-center rounded-lg bg-pencil text-on-pencil"
                >
                  <ArrowRight className="size-4" strokeWidth={2.4} />
                </span>
                La pratica
              </a>
            </li>
          </ol>
        </nav>
      </Panel>

      {parts.map((part, i) => (
        <Part
          key={part.id}
          part={part}
          index={i + 1}
          onSolved={() => setSolved((s) => new Set(s).add(part.id))}
        />
      ))}

      <Panel
        id={practiceId}
        className="flex scroll-mt-6 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"
      >
        <div>
          <Eyebrow>Adesso tocca a te</Eyebrow>
          <p className="mt-1 max-w-prose">{practice.text}</p>
        </div>
        <Button
          variant="pencil"
          onClick={() => onPractise(practice.skill)}
          className="shrink-0 px-5 py-3"
        >
          Inizia la pratica
          <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
        </Button>
      </Panel>
    </article>
  )
}

function TrackLink({
  href,
  index,
  done,
  children,
}: {
  href: string
  index: number
  done: boolean
  children: ReactNode
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition hover:bg-panel focus-visible:ring-2 focus-visible:ring-pencil focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-bold transition-colors',
          done
            ? 'animate-pop border-ok bg-ok-soft text-ok'
            : 'border-hair bg-panel text-dim group-hover:border-pencil',
        )}
      >
        {done ? <Check className="size-4" strokeWidth={3} /> : index}
      </span>
      <span>{children}</span>
    </a>
  )
}

// Una postazione: spiegazione e domanda in colonna, il quaderno accanto. Sul
// telefono si legge in fila: spiegazione, esempio, domanda.
function Part({
  part,
  index,
  onSolved,
}: {
  part: LessonPart
  index: number
  onSolved: () => void
}) {
  const headingId = useId()
  return (
    <section
      id={part.id}
      aria-labelledby={headingId}
      className="grid scroll-mt-6 gap-5 lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] xl:grid-cols-[21rem_minmax(0,1fr)]"
    >
      <Panel className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 -rotate-3 place-items-center rounded-2xl bg-pencil font-display text-lg font-bold text-on-pencil shadow-key"
          >
            {index}
          </span>
          <h3
            id={headingId}
            className="font-display text-xl leading-tight font-bold sm:text-2xl"
          >
            {part.title}
          </h3>
        </div>
        {part.text}
        <Note className="-rotate-1 self-start text-2xl">{part.note}</Note>
      </Panel>
      <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <WorkedExample exercise={part.example} />
      </div>
      <div className="lg:col-start-1 lg:row-start-2">
        <CheckQuestion exercise={part.question} onSolved={onSolved} />
      </div>
    </section>
  )
}
