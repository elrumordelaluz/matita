import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { chapterById, chapters, type ChapterId } from '../content/chapters.ts'
import { lessons } from '../content/lessons/index.ts'
import type { Flashcard } from '../content/flashcards.ts'
import type { Skill } from '../content/skills.ts'
import type { GeneratedSkill } from '../engine/index.ts'
import { skillStates } from '../progress/skillState.ts'
import type { ProgressStore } from '../progress/store.ts'
import { ChapterPicker } from './ChapterPicker.tsx'
import {
  chapterStatus,
  introduceChapter,
  markChapterKnown,
  summarize,
  unmarkChapterKnown,
} from './home/chapterProgress.ts'
import { useSeen } from './lesson/useSeen.ts'
import { KnownChapter } from './KnownChapter.tsx'
import { Button, Eyebrow, Note, Panel } from './kit.tsx'
import { useProgress } from './useProgress.ts'

// La vista "Lezione": la fila dei capitoli in alto, con accanto il segno di
// già saputo del capitolo scelto, e sotto la sua lezione. Un capitolo senza
// lezione registrata lo dice in una nota. Arrivati in fondo alla lezione, o
// segnando il capitolo come saputo, le sue flashcard entrano nel ripasso.

export function LessonPage({
  store,
  skills,
  flashcards,
  chapter: chapterId,
  onChapter,
  onPractise,
  onChange,
  onBackToSession,
}: {
  store: ProgressStore
  skills: readonly Skill[]
  flashcards: readonly Flashcard[]
  chapter: ChapterId
  onChapter: (chapter: ChapterId) => void
  onPractise: (skill: GeneratedSkill) => void
  /** Dopo ogni scrittura nel ProgressStore. */
  onChange?: () => void
  /** Riporta alla sessione sospesa, quando la lezione si apre da lì. */
  onBackToSession?: (() => void) | undefined
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
      {onBackToSession && (
        <Button
          variant="ghost"
          onClick={onBackToSession}
          icon={<ArrowLeft aria-hidden="true" className="size-4" />}
          className="self-start"
        >
          Torna alla sessione
        </Button>
      )}
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
        {progress && states && (
          <KnownChapter
            summary={summarize(chapter, states, progress.known)}
            onMark={() =>
              void write(
                markChapterKnown(store, chapter, flashcards, Date.now()),
              )
            }
            onUnmark={() => void write(unmarkChapterKnown(store, chapter))}
            className="lg:max-w-sm"
          />
        )}
      </div>

      {ChapterLesson ? (
        <>
          <ChapterLesson key={chapterId} onPractise={onPractise} />
          <LessonEnd
            key={chapterId}
            onSeen={() =>
              void write(
                introduceChapter(store, chapter, flashcards, Date.now()),
              )
            }
          />
        </>
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

// La sentinella in fondo alla lezione: quando entra in vista la lezione è
// finita. Non c'è altro modo di saperlo: la lezione non ha un'ultima pagina.
function LessonEnd({ onSeen }: { onSeen: () => void }) {
  const [ref, seen] = useSeen<HTMLDivElement>()
  useEffect(() => {
    if (seen) onSeen()
    // Una volta sola per capitolo: la sentinella si rimonta con la chiave.
  }, [seen])
  return <div ref={ref} aria-hidden="true" className="h-px" />
}
