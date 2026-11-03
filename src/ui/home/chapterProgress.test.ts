import { expect, test } from 'vitest'
import { chapterById, chapters } from '../../content/chapters.ts'
import { skills } from '../../content/skills.ts'
import { attempt } from '../../progress/fixtures.ts'
import { skillStates } from '../../progress/skillState.ts'
import {
  missingPrerequisitesText,
  chapterStatus,
  practiceSkill,
  summarize,
  waitingChaptersText,
  workingChapter,
} from './chapterProgress.ts'

const monday = Date.UTC(2026, 8, 14, 9)
const known = (ids: readonly string[]) =>
  ids.map((skill) => ({ skill, markedAt: monday }))
const idsOf = (chapter: 'n' | 'z' | 'q' | 'pow') =>
  chapterById(chapter).skills.map((s) => s.id)

test('all’inizio è aperto solo il primo capitolo', () => {
  const states = skillStates(skills, [])
  expect(chapterStatus(chapterById('n'), states)).toBe('open')
  expect(chapterStatus(chapterById('z'), states)).toBe('locked')
  expect(chapterStatus(chapterById('pow'), states)).toBe('locked')
  expect(workingChapter(states).id).toBe('n')
})

test('un capitolo si apre appena una sua abilità si sblocca', () => {
  // z.add-sub chiede solo n.add-sub.
  const attempts = [1, 2, 3].map(() => attempt({ skill: 'n.add-sub' }))
  const states = skillStates(skills, attempts)
  expect(chapterStatus(chapterById('z'), states)).toBe('open')
  expect(workingChapter(states).id).toBe('n')
})

test('con il primo capitolo già saputo si lavora sul secondo', () => {
  const marks = known(idsOf('n'))
  const states = skillStates(skills, [], marks)
  expect(summarize(chapterById('n'), states, marks)).toEqual({
    status: 'mastered',
    mastered: 5,
    total: 5,
    knownSince: monday,
  })
  expect(summarize(chapterById('z'), states, marks)).toMatchObject({
    status: 'open',
    mastered: 0,
    knownSince: null,
  })
  expect(workingChapter(states).id).toBe('z')
})

test('con tutto acquisito si resta sull’ultimo capitolo', () => {
  const states = skillStates(skills, [], known(skills.map((s) => s.id)))
  expect(workingChapter(states).id).toBe(chapters.at(-1)?.id)
})

// Un grafo finto con un'abilità senza generatore, così il test non dipende
// da quali generatori il motore ha già.
const graph = [
  { id: 'n.add-sub', title: 'Addizioni e sottrazioni', prerequisites: [] },
  { id: 'x.none', title: 'Senza generatore', prerequisites: [] },
  { id: 'n.mul-div', title: 'Moltiplicazioni e divisioni', prerequisites: [] },
]

test('la pratica parte dall’abilità già iniziata', () => {
  const attempts = [attempt({ skill: 'n.mul-div', outcome: 'wrong' })]
  const states = skillStates(graph, attempts)
  expect(practiceSkill(graph, states, attempts)).toBe('n.mul-div')
})

test('la pratica salta le abilità senza generatore', () => {
  const states = skillStates(graph, [], known(['n.add-sub']))
  expect(practiceSkill(graph, states, [])).toBe('n.mul-div')
})

test('senza progressi letti, o senza nulla in apprendimento, la prima abilità che si allena', () => {
  expect(practiceSkill(graph, null, [])).toBe('n.add-sub')
  const states = skillStates(graph, [], known(graph.map((s) => s.id)))
  expect(practiceSkill(graph, states, [])).toBe('n.add-sub')
})

// Vedi SPEC.md, "Pagina iniziale": una scheda bloccata dice da quali capitoli
// dipende ciò che manca.

test('un capitolo bloccato aspetta i capitoli dei suoi prerequisiti diretti', () => {
  const states = skillStates(skills, [])
  expect(waitingChaptersText(chapterById('poly'), states)).toBe(
    'Prima: capitolo 6, Monomi',
  )
  expect(waitingChaptersText(chapterById('mono'), states)).toBe(
    'Prima: capitolo 2, Espressioni in Z; capitolo 3, Espressioni in Q; capitolo 4, Potenze',
  )
})

test('un capitolo smette di aspettare quelli già acquisiti', () => {
  const marks = known([...idsOf('n'), ...idsOf('z')])
  const states = skillStates(skills, [], marks)
  expect(waitingChaptersText(chapterById('mono'), states)).toBe(
    'Prima: capitolo 3, Espressioni in Q; capitolo 4, Potenze',
  )
  expect(waitingChaptersText(chapterById('n'), states)).toBe('')
})

test('un’abilità bloccata nomina i prerequisiti che mancano, con il capitolo se è un altro', () => {
  const states = skillStates(skills, [])
  const skill = (id: string) => {
    const found = skills.find((s) => s.id === id)
    if (!found) throw new Error(id)
    return found
  }
  expect(missingPrerequisitesText(skill('n.order'), states)).toBe(
    'Prima: Addizioni e sottrazioni, Moltiplicazioni e divisioni',
  )
  expect(missingPrerequisitesText(skill('mono.value'), states)).toBe(
    'Prima: La potenza (cap. 4), Le quattro operazioni con le frazioni (cap. 3)',
  )
  expect(missingPrerequisitesText(skill('n.add-sub'), states)).toBe('')
})
