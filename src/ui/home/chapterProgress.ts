import { chapterOf, chapters, type Chapter } from '../../content/chapters.ts'
import type { Skill } from '../../content/skills.ts'
import type { GeneratedSkill } from '../../engine/index.ts'
import type { Attempt } from '../../progress/attempt.ts'
import { knownSince, markKnown, type Known } from '../../progress/known.ts'
import type { SkillState } from '../../progress/skillState.ts'
import type { ProgressStore } from '../../progress/store.ts'
import { canPractise } from '../exercises.ts'

// I capitoli visti dallo stato delle loro abilità: quanto manca, se sono
// aperti, se lo studente li ha segnati come già saputi, e da dove riparte.

/**
 * `locked`: tutte le abilità bloccate. `open`: almeno una non bloccata.
 * `mastered`: tutte acquisite.
 */
export type ChapterStatus = 'locked' | 'open' | 'mastered'

export interface ChapterSummary {
  readonly status: ChapterStatus
  readonly mastered: number
  readonly total: number
  /** La data del segno di già saputo, se tutto il capitolo lo porta. */
  readonly knownSince: number | null
}

const skillIds = (chapter: Chapter) => chapter.skills.map((s) => s.id)

export function chapterStatus(
  chapter: Chapter,
  states: Record<string, SkillState>,
): ChapterStatus {
  const of = chapter.skills.map((s) => states[s.id] ?? 'locked')
  if (of.length > 0 && of.every((s) => s === 'mastered')) return 'mastered'
  return of.some((s) => s !== 'locked') ? 'open' : 'locked'
}

export function summarize(
  chapter: Chapter,
  states: Record<string, SkillState>,
  known: readonly Known[],
): ChapterSummary {
  return {
    status: chapterStatus(chapter, states),
    mastered: chapter.skills.filter((s) => states[s.id] === 'mastered').length,
    total: chapter.skills.length,
    knownSince: knownSince(skillIds(chapter), known),
  }
}

/**
 * Il capitolo su cui lo studente lavora: il primo con un'abilità in
 * apprendimento. Con tutto acquisito, l'ultimo.
 */
export function workingChapter(states: Record<string, SkillState>): Chapter {
  const first = chapters[0]
  if (!first) throw new RangeError('Nessun capitolo')
  return (
    chapters.find((c) => c.skills.some((s) => states[s.id] === 'learning')) ??
    chapters.at(-1) ??
    first
  )
}

const missing = (skill: Skill, states: Record<string, SkillState>) =>
  skill.prerequisites.filter((p) => states[p] !== 'mastered')

/**
 * "Prima: La potenza (cap. 4), …": i prerequisiti diretti dell'abilità non
 * ancora acquisiti; quelli di un altro capitolo portano il suo numero. Vuoto
 * quando non manca niente.
 */
export function missingPrerequisitesText(
  skill: Skill,
  states: Record<string, SkillState>,
): string {
  const home = chapterOf(skill.id)
  const titleOf = (id: string) => {
    const owner = chapterOf(id)
    const title = owner?.skills.find((s) => s.id === id)?.title ?? id
    return owner && owner !== home ? `${title} (cap. ${owner.number})` : title
  }
  const titles = missing(skill, states).map(titleOf)
  return titles.length ? `Prima: ${titles.join(', ')}` : ''
}

/**
 * "Prima: capitolo 6, Monomi": i capitoli dei prerequisiti diretti non
 * acquisiti che stanno fuori dal capitolo, in ordine di percorso. Vuoto
 * quando il capitolo non aspetta nessuno.
 */
export function waitingChaptersText(
  chapter: Chapter,
  states: Record<string, SkillState>,
): string {
  const owners = new Set(
    chapter.skills.flatMap((s) => missing(s, states)).map(chapterOf),
  )
  const waiting = chapters.filter((c) => c !== chapter && owners.has(c))
  if (waiting.length === 0) return ''
  return `Prima: ${waiting.map((c) => `capitolo ${c.number}, ${c.title}`).join('; ')}`
}

/**
 * L'abilità da allenare quando lo studente apre la pratica senza sceglierla:
 * fra quelle in apprendimento con un generatore, prima una già iniziata, poi
 * la prima del percorso. Senza nessuna, la prima che si può allenare.
 */
export function practiceSkill(
  skills: readonly Skill[],
  states: Record<string, SkillState> | null,
  attempts: readonly Attempt[],
): GeneratedSkill {
  const practised = new Set(attempts.map((a) => a.skill))
  const ids = skills.map((s) => s.id)
  const learning = ids
    .filter((id) => states?.[id] === 'learning')
    .filter(canPractise)
  const skill =
    learning.find((id) => practised.has(id)) ??
    learning[0] ??
    ids.find(canPractise)
  if (!skill) throw new RangeError('Nessuna abilità si può allenare')
  return skill
}

/** Segna tutte le abilità del capitolo come già sapute, con la data di ora. */
export function markChapterKnown(
  store: ProgressStore,
  chapter: Chapter,
  now: number,
): Promise<void> {
  return store.putKnown(markKnown(skillIds(chapter), now))
}

export function unmarkChapterKnown(
  store: ProgressStore,
  chapter: Chapter,
): Promise<void> {
  return store.removeKnown(skillIds(chapter))
}
