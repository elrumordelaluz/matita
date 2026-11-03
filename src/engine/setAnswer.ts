import { finiteSet, type FiniteSet } from './finiteSet.ts'

// La lettura di un insieme scritto dallo studente. Vedi SPEC.md, "Insiemi",
// "Risposte": l'ordine non conta, il vuoto si scrive `∅` o `{}`, le graffe
// mancanti e i doppioni sono forme da riscrivere, nell'ordine in cui le si
// corregge. Senza graffe la risposta si legge comunque, e un numero solo vale
// l'insieme che lo contiene.

/** Perché un insieme con il valore giusto va riscritto. */
export type SetRewriteReason = 'missing-braces' | 'repeated-element'

export const setRewriteMessages: Record<SetRewriteReason, string> = {
  'missing-braces': 'Un insieme si scrive fra graffe.',
  'repeated-element': 'Ogni elemento si scrive una volta sola.',
}

export type SetReading =
  | {
      readonly ok: true
      /** I naturali scritti come elementi. */
      readonly value: FiniteSet
      /**
       * C'è anche `∅` fra gli elementi, come in `{∅}`: un insieme che ha il
       * vuoto come elemento, che nessun esercizio chiede.
       */
      readonly withEmpty: boolean
      readonly rewrite: SetRewriteReason | null
      /** La risposta come scritta, per l'anteprima. */
      readonly form: { readonly tex: string; readonly text: string }
    }
  | { readonly ok: false; readonly message: string }

const unreadable = {
  ok: false,
  message: 'Scrivi l’insieme fra graffe, con gli elementi separati da virgole.',
} as const

const empty = /^(∅|\{\s*\})$/

export function readSetAnswer(answer: string): SetReading {
  const text = answer.trim()
  if (text === '') return { ok: false, message: 'Scrivi il risultato.' }
  if (empty.test(text))
    return {
      ok: true,
      value: finiteSet([]),
      withEmpty: false,
      rewrite: null,
      form: { tex: '\\varnothing', text: '∅' },
    }

  const braced = text.startsWith('{') && text.endsWith('}')
  if (!braced && /[{}]/.test(text)) return unreadable
  const inner = braced ? text.slice(1, -1) : text
  if (/[{}]/.test(inner)) return unreadable

  const items = inner.split(',').map((s) => s.trim())
  if (items.some((s) => s === '')) return unreadable
  const numbers: bigint[] = []
  let withEmpty = false
  for (const item of items) {
    if (item === '∅') withEmpty = true
    else if (/^\d+$/.test(item)) numbers.push(BigInt(item))
    else return { ok: false, message: 'Gli elementi sono numeri naturali.' }
  }

  const repeated =
    new Set(numbers).size < numbers.length ||
    items.filter((s) => s === '∅').length > 1
  const written = items.join(', ')
  const katexItems = items.map((s) => (s === '∅' ? '\\varnothing' : s))
  return {
    ok: true,
    value: finiteSet(numbers),
    withEmpty,
    rewrite: !braced ? 'missing-braces' : repeated ? 'repeated-element' : null,
    form: braced
      ? { tex: `\\{${katexItems.join(', ')}\\}`, text: `{${written}}` }
      : { tex: katexItems.join(', '), text: written },
  }
}
