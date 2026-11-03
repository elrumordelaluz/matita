import { expect, test } from 'vitest'
import { skills } from './skills.ts'

test('gli id delle abilità sono unici', () => {
  const ids = skills.map((skill) => skill.id)

  expect(ids).toHaveLength(new Set(ids).size)
})

test('ogni prerequisito è un’abilità del percorso', () => {
  const ids = new Set(skills.map((skill) => skill.id))
  const unknownPrerequisites = skills.flatMap((skill) =>
    skill.prerequisites.filter((prerequisite) => !ids.has(prerequisite)),
  )

  expect(unknownPrerequisites).toEqual([])
})

test('i prerequisiti non formano cicli', () => {
  const skillsById = new Map(skills.map((skill) => [skill.id, skill]))
  const visited = new Set<string>()

  const findCycle = (
    skill: (typeof skills)[number],
    path: readonly string[] = [],
  ): readonly string[] | null => {
    if (visited.has(skill.id)) {
      return null
    }

    if (path.includes(skill.id)) {
      return [...path.slice(path.indexOf(skill.id)), skill.id]
    }

    for (const prerequisite of skill.prerequisites) {
      const prerequisiteSkill = skillsById.get(prerequisite)
      const cycle = prerequisiteSkill
        ? findCycle(prerequisiteSkill, [...path, skill.id])
        : null
      if (cycle) {
        return cycle
      }
    }

    visited.add(skill.id)
    return null
  }

  let cycle: readonly string[] | null = null
  for (const skill of skills) {
    cycle = findCycle(skill)
    if (cycle) {
      break
    }
  }

  expect(cycle).toBeNull()
})
