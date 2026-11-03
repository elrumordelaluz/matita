import { expect, test } from 'vitest'
import { setToText } from './finiteSet.ts'
import {
  propertyToKatex,
  propertyToText,
  rosterOf,
  rosterWrongResults,
  type Property,
} from './setRoster.ts'

// Dalla proprietà caratteristica all'elencazione (SPEC.md, "Insiemi").

const below5from2: Property = {
  lower: { value: 2n, strict: false },
  upper: { value: 5n, strict: true },
}
const evenBelow7: Property = {
  upper: { value: 7n, strict: true },
  filter: { kind: 'even' },
}
const oddUpTo7: Property = {
  upper: { value: 7n, strict: false },
  filter: { kind: 'odd' },
}

test('la proprietà si scrive con la condizione a parole', () => {
  // C3 5.16b.
  expect(propertyToText(below5from2)).toBe('{x ∈ N | 2 ≤ x < 5}')
  expect(propertyToText(evenBelow7)).toBe('{x ∈ N | x < 7 e x è pari}')
  expect(
    propertyToText({
      upper: { value: 15n, strict: true },
      filter: { kind: 'multiple', of: 3n },
    }),
  ).toBe('{x ∈ N | x < 15 e x è multiplo di 3}')
  expect(propertyToText({ filter: { kind: 'divisor', of: 12n } })).toBe(
    '{x ∈ N | x è divisore di 12}',
  )
  expect(propertyToKatex(evenBelow7)).toBe(
    '\\{x \\in \\mathbb{N} \\mid x < 7 \\text{ e } x \\text{ è pari}\\}',
  )
})

test('gli elementi sono i naturali che rispettano la condizione', () => {
  expect(setToText(rosterOf(below5from2))).toBe('{2, 3, 4}')
  expect(setToText(rosterOf(evenBelow7))).toBe('{0, 2, 4, 6}')
  expect(setToText(rosterOf(oddUpTo7))).toBe('{1, 3, 5, 7}')
  expect(
    setToText(
      rosterOf({
        lower: { value: 3n, strict: true },
        upper: { value: 20n, strict: false },
        filter: { kind: 'multiple', of: 4n },
      }),
    ),
  ).toBe('{4, 8, 12, 16, 20}')
  expect(setToText(rosterOf({ filter: { kind: 'divisor', of: 12n } }))).toBe(
    '{1, 2, 3, 4, 6, 12}',
  )
})

function wrong(property: Property) {
  return rosterWrongResults(property).map(({ id, value }) => [
    id,
    setToText(value),
  ])
}

test('il < letto come ≤ e viceversa, un estremo alla volta', () => {
  expect(wrong(below5from2)).toContainEqual([
    'bound-inclusion-swapped',
    '{2, 3, 4, 5}',
  ])
  expect(wrong(below5from2)).toContainEqual([
    'bound-inclusion-swapped',
    '{3, 4}',
  ])
  expect(wrong(oddUpTo7)).toContainEqual([
    'bound-inclusion-swapped',
    '{1, 3, 5}',
  ])
})

test('N senza lo zero, e lo zero escluso dai pari', () => {
  expect(wrong(evenBelow7)).toContainEqual(['zero-not-even', '{2, 4, 6}'])
  expect(wrong({ upper: { value: 4n, strict: true } })).toContainEqual([
    'natural-without-zero',
    '{1, 2, 3}',
  ])
  // Lo zero escluso dai pari viene prima: è la spiegazione più precisa.
  const ids = wrong(evenBelow7).map(([id]) => id)
  expect(ids.indexOf('zero-not-even')).toBeLessThan(
    ids.indexOf('natural-without-zero'),
  )
})
