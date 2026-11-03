import { expect, test } from 'vitest'
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
