import { describe, expect, test } from 'vitest'
import { chapterOf, chapters } from './chapters.ts'
import { skills } from './skills.ts'

test('gli id delle abilità sono unici', () => {
  const duplicates = skills
    .map((s) => s.id)
    .filter((id, i, all) => all.indexOf(id) !== i)
  expect(duplicates).toEqual([])
})

test('ogni prerequisito è l’id di un’abilità dell’elenco', () => {
  const ids = new Set(skills.map((s) => s.id))
  expect(
    skills.flatMap((s) =>
      s.prerequisites.filter((p) => !ids.has(p)).map((p) => `${s.id} → ${p}`),
    ),
  ).toEqual([])
})

test('il grafo dei prerequisiti non ha cicli', () => {
  // Visita in profondità: un prerequisito già aperto chiude un ciclo.
  const prerequisitesOf = new Map(skills.map((s) => [s.id, s.prerequisites]))
  const open = new Set<string>()
  const closed = new Set<string>()
  const stack: string[] = []
  const cycles: string[] = []

  const visit = (id: string) => {
    if (closed.has(id)) return
    if (open.has(id)) {
      cycles.push([...stack.slice(stack.indexOf(id)), id].join(' → '))
      return
    }
    open.add(id)
    stack.push(id)
    for (const prerequisite of prerequisitesOf.get(id) ?? []) {
      visit(prerequisite)
    }
    stack.pop()
    open.delete(id)
    closed.add(id)
  }

  for (const skill of skills) {
    visit(skill.id)
  }
  expect(cycles).toEqual([])
})

test('ogni abilità sta in un capitolo', () => {
  const inChapter = new Set(chapters.flatMap((c) => c.skills.map((s) => s.id)))
  expect(skills.filter((s) => !inChapter.has(s.id)).map((s) => s.id)).toEqual(
    [],
  )
})

test('l’id di ogni abilità inizia con l’id del suo capitolo', () => {
  expect(
    skills.flatMap((s) => {
      const chapter = chapterOf(s.id)
      return !chapter || s.id.startsWith(`${chapter.id}.`) ? [] : [s.id]
    }),
  ).toEqual([])
})

// Le coppie `abilità → prerequisito` il cui prerequisito sta in un capitolo
// successivo. Ignora gli id senza capitolo: li segnalano gli altri test.
function forwardReferences(
  items: readonly { id: string; prerequisites: readonly string[] }[],
  chapterIndexOf: (id: string) => number | undefined,
): string[] {
  return items.flatMap((s) =>
    s.prerequisites
      .filter(
        (p) => (chapterIndexOf(p) ?? -1) > (chapterIndexOf(s.id) ?? Infinity),
      )
      .map((p) => `${s.id} → ${p}`),
  )
}

test('ogni prerequisito sta nel capitolo dell’abilità o in uno precedente', () => {
  const order = chapters.map((c) => c.id)
  const indexOf = (id: string) => {
    const chapter = chapterOf(id)
    return chapter && order.indexOf(chapter.id)
  }
  expect(forwardReferences(skills, indexOf)).toEqual([])
})

describe('forwardReferences', () => {
  const chapterIndexes: Record<string, number> = {
    'a.1': 0,
    'a.2': 0,
    'b.1': 1,
    'c.1': 2,
    'c.2': 2,
  }
  const indexOf = (id: string) => chapterIndexes[id]

  test.each([
    [
      'un prerequisito di un capitolo successivo',
      [['a.1', ['c.1']]],
      ['a.1 → c.1'],
    ],
    [
      'solo il prerequisito in avanti tra più prerequisiti',
      [['b.1', ['a.1', 'c.1']]],
      ['b.1 → c.1'],
    ],
    [
      'due abilità con riferimenti in avanti, nell’ordine delle abilità',
      [
        ['a.1', ['b.1']],
        ['b.1', ['c.2']],
      ],
      ['a.1 → b.1', 'b.1 → c.2'],
    ],
    ['un prerequisito dello stesso capitolo', [['a.2', ['a.1']]], []],
    ['un prerequisito di un capitolo precedente', [['c.1', ['a.1']]], []],
    ['un’abilità senza prerequisiti', [['c.1', []]], []],
    [
      'un’abilità o un prerequisito senza capitolo',
      [
        ['x.1', ['c.1']],
        ['a.1', ['x.2']],
      ],
      [],
    ],
  ] as [string, [string, string[]][], string[]][])(
    '%s',
    (_, rows, expected) => {
      const input = rows.map(([id, prerequisites]) => ({ id, prerequisites }))
      expect(forwardReferences(input, indexOf)).toEqual(expected)
    },
  )
})
