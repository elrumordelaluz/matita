import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { chapterById, chapters, type ChapterId } from '../content/chapters.ts'
import { lessons } from '../content/lessons/index.ts'
import type { Skill } from '../content/skills.ts'
import type { GeneratedSkill } from '../engine/index.ts'
import { skillStates } from '../progress/skillState.ts'
import type { ProgressStore } from '../progress/store.ts'
import { ChapterPicker } from './ChapterPicker.tsx'
import {
  chapterStatus,
  markChapterKnown,
  summarize,
  unmarkChapterKnown,
} from './home/chapterProgress.ts'
import { KnownChapter } from './KnownChapter.tsx'
import { Button, Eyebrow, Note, Panel } from './kit.tsx'
import { useProgress } from './useProgress.ts'

// La vista "Lezione": la fila dei capitoli in alto, con accanto il segno di
// già saputo del capitolo scelto, e sotto la sua lezione. Un capitolo senza
// lezione registrata lo dice in una nota.

export function LessonPage({
  store,
  skills,
  chapter: chapterId,
  onChapter,
  onPractise,
  onChange,
  onBack,
}: {
  store: ProgressStore
  skills: readonly Skill[]
  chapter: ChapterId
  onChapter: (chapter: ChapterId) => void
  onPractise: (skill: GeneratedSkill) => void
  /** Dopo ogni scrittura nel ProgressStore. */
  onChange?: () => void
  /** Torna alla sessione sospesa, quando c'è. */
  onBack?: () => void
}) {
  const { progress, reload } = useProgress(store)
  const chapter = chapterById(chapterId)
  const ChapterLesson = lessons[chapterId]

  const states = useMemo(
    () => progress && skillStates(skills, progress.attempts, progress.known),
    [progress, skills],
  )

  async function write(change: Promise<void>) {
    await change
    await reload()
    onChange?.()
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ChapterPicker
          label="Capitoli"
          value={chapterId}
          onChange={onChapter}
          status={
            states
              ? Object.fromEntries(
                  chapters.map((c) => [c.id, chapterStatus(c, states)]),
                )
              : undefined
          }
        />
        {onBack && (
          <Button
            variant="ghost"
            icon={<ArrowLeft aria-hidden="true" className="size-4" />}
            onClick={onBack}
            className="self-start"
          >
            Torna alla sessione
          </Button>
        )}
        {progress && states && (
          <KnownChapter
            summary={summarize(chapter, states, progress.known)}
            onMark={() =>
              void write(markChapterKnown(store, chapter, Date.now()))
            }
            onUnmark={() => void write(unmarkChapterKnown(store, chapter))}
            className="lg:max-w-sm"
          />
        )}
      </div>

      {ChapterLesson ? (
        <ChapterLesson key={chapterId} onPractise={onPractise} />
      ) : (
        <Panel className="animate-rise p-5 sm:p-7">
          <Eyebrow>
            Capitolo {chapter.number} <span className="text-pencil">·</span>{' '}
            Lezione
          </Eyebrow>
          <h2 className="mt-3 font-display text-4xl leading-none font-bold tracking-tight sm:text-5xl">
            {chapter.title}
          </h2>
          <p className="mt-3 max-w-prose text-dim">{chapter.blurb}</p>
          <Note className="mt-5 inline-block -rotate-1 text-2xl">
            lezione ancora da scrivere
          </Note>
          <p className="mt-2 max-w-prose">
            La lezione di questo capitolo non c’è ancora.
          </p>
        </Panel>
      )}
    </div>
  )
}
