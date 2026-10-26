import { expect, test } from 'vitest'
import { exportBackup, importBackup } from './backup.ts'
import { attempt } from './fixtures.ts'
import { knownSince, markKnown } from './known.ts'
import { dueReviews, reviewCards } from './review.ts'
import { composeSession } from './session.ts'
import { skillStates } from './skillState.ts'
import { createMemoryStore } from './store.ts'

// Le regole di SPEC.md, "Già saputo": il segno rende acquisite le abilità,
// fa nascere la loro carta FSRS e si può togliere.

const graph = [
  { id: 'n.add-sub', prerequisites: [] },
  { id: 'n.mul-div', prerequisites: [] },
  { id: 'n.order', prerequisites: ['n.add-sub', 'n.mul-div'] },
  { id: 'n.parens', prerequisites: ['n.order'] },
  { id: 'n.brackets', prerequisites: ['n.parens'] },
]

const minute = 60_000
const day = 86_400_000
const monday = Date.UTC(2026, 8, 14, 9)

const marked = (skill: string, at = monday) => ({ skill, markedAt: at })

function mastery(skill: string, at: number) {
  return [0, 1, 2].map((i) => attempt({ skill, answeredAt: at + i * minute }))
}

test('segnare un gruppo di abilità dà a tutte la stessa data', () => {
  expect(markKnown(['n.add-sub', 'n.mul-div'], monday)).toEqual([
    marked('n.add-sub'),
    marked('n.mul-div'),
  ])
})

test('un gruppo è saputo solo se tutte le sue abilità hanno il segno', () => {
  const chapter = ['n.add-sub', 'n.mul-div']
  expect(knownSince(chapter, [marked('n.add-sub')])).toBeNull()
  expect(
    knownSince(chapter, [
      marked('n.add-sub', monday),
      marked('n.mul-div', monday + day),
    ]),
  ).toBe(monday + day)
  expect(knownSince([], [marked('n.add-sub')])).toBeNull()
})

test('un’abilità già saputa è acquisita e sblocca quelle che la richiedono', () => {
  const known = [marked('n.add-sub'), marked('n.mul-div')]
  expect(skillStates(graph, [], known)).toEqual({
    'n.add-sub': 'mastered',
    'n.mul-div': 'mastered',
    'n.order': 'learning',
    'n.parens': 'locked',
    'n.brackets': 'locked',
  })
})

test('il segno vale anche sopra tentativi sbagliati', () => {
  const attempts = [attempt({ skill: 'n.add-sub', outcome: 'wrong' })]
  expect(skillStates(graph, attempts, [marked('n.add-sub')])['n.add-sub']).toBe(
    'mastered',
  )
})

test('tolto il segno, lo stato torna quello dei tentativi', () => {
  const attempts = [
    attempt({ skill: 'n.add-sub' }),
    attempt({ skill: 'n.add-sub' }),
    ...mastery('n.mul-div', monday),
  ]
  const known = [marked('n.add-sub'), marked('n.mul-div')]
  expect(skillStates(graph, attempts, known)['n.order']).toBe('learning')
  expect(skillStates(graph, attempts, [])).toMatchObject({
    'n.add-sub': 'learning',
    'n.mul-div': 'mastered',
    'n.order': 'locked',
  })
})

test('un’abilità acquisita con i tentativi resta acquisita se il suo prerequisito perde il segno', () => {
  const known = [marked('n.add-sub'), marked('n.mul-div')]
  const attempts = mastery('n.order', monday + day)
  expect(skillStates(graph, attempts, known)['n.parens']).toBe('learning')
  expect(skillStates(graph, attempts, [])).toMatchObject({
    'n.add-sub': 'learning',
    'n.order': 'mastered',
    'n.parens': 'learning',
  })
})

test('la carta di un’abilità già saputa nasce il giorno del segno', () => {
  const known = [marked('n.add-sub')]
  expect(
    reviewCards([], known).get('n.add-sub')?.due.getTime(),
  ).toBeGreaterThan(monday + day)
  expect(dueReviews([], new Date(monday + day), known)).toEqual([])
  expect(dueReviews([], new Date(monday + 30 * day), known)).toEqual([
    'n.add-sub',
  ])
})

test('il segno vale come il terzo corretto di una serie', () => {
  const byAttempts = reviewCards(mastery('n.add-sub', monday))
  const byMark = reviewCards([], [marked('n.add-sub', monday + 2 * minute)])
  expect(byMark).toEqual(byAttempts)
})

test('i tentativi prima del segno non contano per la carta', () => {
  const known = [marked('n.add-sub', monday + day)]
  const before = [
    attempt({ outcome: 'wrong', answeredAt: monday }),
    attempt({ answeredAt: monday + minute }),
    attempt({ answeredAt: monday + 2 * minute }),
  ]
  expect(reviewCards(before, known)).toEqual(reviewCards([], known))
})

test('dopo il segno ogni tentativo è un ripasso', () => {
  const known = [marked('n.add-sub')]
  const later = monday + 4 * day
  const good = reviewCards([attempt({ answeredAt: later })], known)
  const again = reviewCards(
    [attempt({ outcome: 'wrong', answeredAt: later })],
    known,
  )
  expect(again.get('n.add-sub')!.due.getTime()).toBeLessThan(
    good.get('n.add-sub')!.due.getTime(),
  )
})

test('un segno dopo l’acquisizione non cambia la carta', () => {
  const attempts = mastery('n.add-sub', monday)
  expect(
    reviewCards(attempts, [marked('n.add-sub', monday + 2 * day)]),
  ).toEqual(reviewCards(attempts))
})

test('tolto il segno, la carta torna a dipendere solo dai tentativi', () => {
  const known = [marked('n.add-sub')]
  const reviews = [
    attempt({ answeredAt: monday + 4 * day }),
    attempt({ outcome: 'wrong', answeredAt: monday + 9 * day }),
  ]
  expect(reviewCards(reviews, known).has('n.add-sub')).toBe(true)
  expect(reviewCards(reviews).has('n.add-sub')).toBe(false)
})

test('con le prime abilità già sapute la sessione parte dalla successiva', () => {
  const known = ['n.add-sub', 'n.mul-div', 'n.order'].map((s) => marked(s))
  const session = composeSession({
    graph,
    attempts: [],
    known,
    now: new Date(monday + minute),
  })
  expect(session).toEqual(Array(10).fill({ skill: 'n.parens', reason: 'new' }))
})

test('le abilità già sapute tornano nella sessione quando scadono', () => {
  const known = [marked('n.add-sub'), marked('n.mul-div')]
  const soon = composeSession({
    graph,
    attempts: [],
    known,
    now: new Date(monday + day),
  })
  expect(soon.some((i) => i.reason === 'review')).toBe(false)
  const later = composeSession({
    graph,
    attempts: [],
    known,
    now: new Date(monday + 60 * day),
  })
  expect(
    later
      .filter((i) => i.reason === 'review')
      .map((i) => i.skill)
      .sort(),
  ).toEqual(['n.add-sub', 'n.mul-div'])
  expect(later.at(-1)).toEqual({ skill: 'n.order', reason: 'new' })
})

test('lo stato con i segni si ricostruisce dal backup', async () => {
  const store = createMemoryStore()
  await store.putKnown([marked('n.mul-div')])
  for (const a of [
    ...mastery('n.add-sub', monday),
    attempt({ skill: 'n.mul-div', answeredAt: monday + 5 * day }),
  ])
    await store.addAttempt(a)

  const restored = createMemoryStore()
  await importBackup(restored, await exportBackup(store))

  const [attempts, known] = [await restored.attempts(), await restored.known()]
  expect(known).toEqual(await store.known())
  expect(reviewCards(attempts, known)).toEqual(
    reviewCards(await store.attempts(), await store.known()),
  )
  expect(skillStates(graph, attempts, known)['n.order']).toBe('learning')
})
