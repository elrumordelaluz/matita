import { expect, test } from 'vitest'
import { skills } from './skills.ts'

// Il grafo dei prerequisiti è dati dichiarativi: un typo o un ciclo lì dentro
// romperebbe il percorso senza alcun errore. Questi test lo bloccano alla
// fonte.

test('gli id delle abilità sono unici', () => {
  const ids = skills.map((s) => s.id)
  const duplicated = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
  expect(duplicated, `id duplicati: ${duplicated.join(', ')}`).toEqual([])
})

test('ogni prerequisito è l’id di un’abilità dell’elenco', () => {
  const ids = new Set(skills.map((s) => s.id))
  const unknown = [...new Set(skills.flatMap((s) => s.prerequisites))].filter(
    (p) => !ids.has(p),
  )
  expect(unknown, `prerequisiti sconosciuti: ${unknown.join(', ')}`).toEqual([])
})

test('il grafo dei prerequisiti non ha cicli', () => {
  // Kahn: gli id rimasti con un archio in entrata dopo lo svuotamento sono
  // dentro un ciclo o raggiungibili da uno.
  const incoming = new Map(skills.map((s) => [s.id, new Set(s.prerequisites)]))
  const ready = skills.map((s) => s.id).filter((id) => !incoming.get(id)!.size)
  for (const id of ready) incoming.delete(id)
  while (ready.length > 0) {
    const current = ready.pop()!
    for (const [id, prereqs] of incoming) {
      prereqs.delete(current)
      if (prereqs.size === 0) {
        incoming.delete(id)
        ready.push(id)
      }
    }
  }
  const cyclic = skills.map((s) => s.id).filter((id) => incoming.has(id))
  expect(
    cyclic,
    `abilità in un ciclo o raggiungibili da un ciclo: ${cyclic.join(', ')}`,
  ).toEqual([])
})
