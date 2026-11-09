import type { ChapterId } from './chapters.ts'
import { chapters } from './chapters.ts'
import type { Skill } from './skills.ts'

// Le flashcard: quello che si sa a memoria e non si fa con un esercizio. Vedi
// SPEC.md, "Ripasso e tracking". Davanti la consegna, dietro cosa ricordare;
// i pezzi fra `$…$` sono formule, il resto è testo.
//
// L'id è `<capitolo>.<nome>` ed è stabile: finisce nelle introduzioni e nei
// ripassi salvati. Non si cambia e non si riusa, nemmeno dopo aver tolto la
// carta. `skill` è l'abilità che la carta richiama, se ce n'è una dello
// stesso capitolo: dice quale lezione rileggere.

export interface Flashcard {
  readonly id: string
  readonly chapter: ChapterId
  readonly skill?: string
  readonly front: string
  readonly back: string
}

const minPerChapter = 5

/**
 * Cosa non va nel mazzo, un messaggio per problema; vuoto se va bene. Le
 * abilità si passano a parte perché i test provano anche mazzi sbagliati.
 */
export function flashcardProblems(
  cards: readonly Flashcard[],
  skills: readonly Skill[],
): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const card of cards) {
    if (seen.has(card.id)) problems.push(`Duplicate flashcard id: ${card.id}`)
    seen.add(card.id)
    if (!card.id.startsWith(`${card.chapter}.`))
      problems.push(
        `Flashcard ${card.id} does not start with its chapter id: ${card.chapter}.`,
      )
    if (card.skill === undefined) continue
    if (!skills.some((s) => s.id === card.skill))
      problems.push(
        `Flashcard ${card.id} names an unknown skill: ${card.skill}`,
      )
    else if (!card.skill.startsWith(`${card.chapter}.`))
      problems.push(
        `Flashcard ${card.id} names a skill of another chapter: ${card.skill}`,
      )
  }
  for (const { id } of chapters) {
    const count = cards.filter((c) => c.chapter === id).length
    if (count < minPerChapter)
      problems.push(
        `Chapter ${id} has ${count} flashcards, at least ${minPerChapter} needed`,
      )
  }
  return problems
}

const r = String.raw

export const flashcards: readonly Flashcard[] = [
  // Capitolo 1, Espressioni in N
  {
    id: 'n.order',
    chapter: 'n',
    skill: 'n.order',
    front: r`In che ordine si fanno le operazioni di un’espressione senza parentesi?`,
    back: r`Prima $\times$ e $:$, poi $+$ e $-$; a parità, da sinistra a destra.`,
  },
  {
    id: 'n.parens-order',
    chapter: 'n',
    skill: 'n.brackets',
    front: r`In che ordine si svolgono tonde, quadre e graffe?`,
    back: r`Dalle più interne alle più esterne: prima le tonde, poi le quadre, poi le graffe.`,
  },
  {
    id: 'n.div-zero',
    chapter: 'n',
    skill: 'n.mul-div',
    front: r`Che cosa vale $5 : 0$?`,
    back: r`Niente: la divisione per zero non si può fare.`,
  },
  {
    id: 'n.zero-div',
    chapter: 'n',
    skill: 'n.mul-div',
    front: r`Che cosa vale $0 : 5$?`,
    back: r`$0$: lo zero diviso per un numero diverso da zero dà zero.`,
  },
  {
    id: 'n.div-exact',
    chapter: 'n',
    skill: 'n.mul-div',
    front: r`Quando la divisione $a : b$ si può fare in N?`,
    back: r`Quando $b$ è diverso da zero e $a$ è multiplo di $b$.`,
  },
  {
    id: 'n.sub-possible',
    chapter: 'n',
    skill: 'n.add-sub',
    front: r`Quando la sottrazione $a - b$ si può fare in N?`,
    back: r`Quando $a \ge b$: altrimenti il risultato non è un naturale.`,
  },

  // Capitolo 2, Espressioni in Z
  {
    id: 'z.sign-product',
    chapter: 'z',
    skill: 'z.mul-div',
    front: r`Qual è la regola dei segni per il prodotto?`,
    back: r`Segni uguali danno $+$, segni diversi danno $-$.`,
  },
  {
    id: 'z.minus-minus',
    chapter: 'z',
    skill: 'z.add-sub',
    front: r`Che cosa vale $-(-a)$?`,
    back: r`$+a$: due meno di seguito fanno un più.`,
  },
  {
    id: 'z.minus-group',
    chapter: 'z',
    skill: 'z.minus-group',
    front: r`Che cosa succede ai segni togliendo una parentesi preceduta da $-$?`,
    back: r`Tutti i termini dentro cambiano segno.`,
  },
  {
    id: 'z.plus-group',
    chapter: 'z',
    skill: 'z.minus-group',
    front: r`Che cosa succede ai segni togliendo una parentesi preceduta da $+$?`,
    back: r`Restano come sono.`,
  },
  {
    id: 'z.opposite',
    chapter: 'z',
    skill: 'z.add-sub',
    front: r`Che cosa vale $a + (-a)$?`,
    back: r`$0$: un numero e il suo opposto si annullano.`,
  },

  // Capitolo 3, Espressioni in Q
  {
    id: 'q.reciprocal',
    chapter: 'q',
    skill: 'q.mul-div',
    front: r`Qual è il reciproco di $\frac{a}{b}$?`,
    back: r`$\frac{b}{a}$, con $a \ne 0$. Il prodotto di un numero per il suo reciproco è $1$.`,
  },
  {
    id: 'q.division',
    chapter: 'q',
    skill: 'q.mul-div',
    front: r`Come si divide per una frazione: $\frac{a}{b} : \frac{c}{d}$?`,
    back: r`Si moltiplica per il reciproco: $\frac{a}{b} \times \frac{d}{c}$.`,
  },
  {
    id: 'q.sum-lcm',
    chapter: 'q',
    skill: 'q.add-sub',
    front: r`Come si sommano due frazioni con denominatori diversi?`,
    back: r`Si portano al minimo comune multiplo dei denominatori, poi si sommano i numeratori.`,
  },
  {
    id: 'q.lowest-terms',
    chapter: 'q',
    front: r`Quando una frazione è ridotta ai minimi termini?`,
    back: r`Quando numeratore e denominatore non hanno divisori comuni oltre a $1$.`,
  },
  {
    id: 'q.product',
    chapter: 'q',
    skill: 'q.mul-div',
    front: r`Che cosa vale $\frac{a}{b} \times \frac{c}{d}$?`,
    back: r`$\frac{a \times c}{b \times d}$: numeratore per numeratore, denominatore per denominatore.`,
  },

  // Capitolo 4, Potenze
  {
    id: 'pow.same-base-product',
    chapter: 'pow',
    skill: 'pow.properties',
    front: r`$a^m \times a^n = {}$?`,
    back: r`$a^{m+n}$: stessa base, si sommano gli esponenti.`,
  },
  {
    id: 'pow.same-base-quotient',
    chapter: 'pow',
    skill: 'pow.properties',
    front: r`$a^m : a^n = {}$?`,
    back: r`$a^{m-n}$: stessa base, si sottraggono gli esponenti.`,
  },
  {
    id: 'pow.power-of-power',
    chapter: 'pow',
    skill: 'pow.properties',
    front: r`$(a^m)^n = {}$?`,
    back: r`$a^{m \times n}$: si moltiplicano gli esponenti.`,
  },
  {
    id: 'pow.same-exponent',
    chapter: 'pow',
    skill: 'pow.properties',
    front: r`$a^n \times b^n = {}$?`,
    back: r`$(a \times b)^n$: stesso esponente, si moltiplicano le basi.`,
  },
  {
    id: 'pow.zero',
    chapter: 'pow',
    skill: 'pow.zero-negative',
    front: r`Che cosa vale $a^0$, con $a \ne 0$?`,
    back: r`$1$.`,
  },
  {
    id: 'pow.negative',
    chapter: 'pow',
    skill: 'pow.zero-negative',
    front: r`Che cosa vale $a^{-n}$, con $a \ne 0$?`,
    back: r`$\frac{1}{a^n}$: la potenza del reciproco.`,
  },
  {
    id: 'pow.minus-base',
    chapter: 'pow',
    skill: 'pow.basics',
    front: r`Che differenza c’è fra $-3^2$ e $(-3)^2$?`,
    back: r`$-3^2 = -9$, il meno sta fuori dalla potenza; $(-3)^2 = 9$, la base è $-3$.`,
  },

  // Capitolo 5, Insiemi
  {
    id: 'set.belongs',
    chapter: 'set',
    skill: 'set.relations',
    front: r`Che differenza c’è fra $\in$ e $\subset$?`,
    back: r`$\in$ lega un elemento a un insieme; $\subset$ lega un insieme a un altro insieme che lo contiene.`,
  },
  {
    id: 'set.union',
    chapter: 'set',
    skill: 'set.operations',
    front: r`Che cos’è $A \cup B$?`,
    back: r`L’unione: gli elementi che stanno in $A$ o in $B$ (o in tutti e due).`,
  },
  {
    id: 'set.intersection',
    chapter: 'set',
    skill: 'set.operations',
    front: r`Che cos’è $A \cap B$?`,
    back: r`L’intersezione: gli elementi che stanno sia in $A$ sia in $B$.`,
  },
  {
    id: 'set.difference',
    chapter: 'set',
    skill: 'set.operations',
    front: r`Che cos’è $A - B$?`,
    back: r`La differenza: gli elementi di $A$ che non stanno in $B$.`,
  },
  {
    id: 'set.empty',
    chapter: 'set',
    skill: 'set.relations',
    front: r`Come si scrive l’insieme vuoto, e di chi è sottoinsieme?`,
    back: r`$\emptyset$; è sottoinsieme di ogni insieme.`,
  },
  {
    id: 'set.parts-count',
    chapter: 'set',
    skill: 'set.parts-product',
    front: r`Quanti elementi ha l’insieme delle parti di un insieme di $n$ elementi?`,
    back: r`$2^n$.`,
  },
  {
    id: 'set.product-count',
    chapter: 'set',
    skill: 'set.parts-product',
    front: r`Quanti elementi ha $A \times B$, se $A$ ne ha $m$ e $B$ ne ha $n$?`,
    back: r`$m \times n$: tutte le coppie ordinate $(a, b)$.`,
  },

  // Capitolo 6, Monomi
  {
    id: 'mono.degree',
    chapter: 'mono',
    skill: 'mono.normal-form',
    front: r`Qual è il grado di un monomio in forma normale?`,
    back: r`La somma degli esponenti delle sue lettere. Il grado rispetto a una lettera è l’esponente di quella lettera.`,
  },
  {
    id: 'mono.like',
    chapter: 'mono',
    skill: 'mono.add-sub',
    front: r`Quando due monomi sono simili?`,
    back: r`Quando hanno la stessa parte letterale. Solo i simili si sommano.`,
  },
  {
    id: 'mono.product',
    chapter: 'mono',
    skill: 'mono.mul-div',
    front: r`Come si moltiplicano due monomi?`,
    back: r`Si moltiplicano i coefficienti e si sommano gli esponenti delle lettere uguali.`,
  },
  {
    id: 'mono.power',
    chapter: 'mono',
    skill: 'mono.power',
    front: r`Come si calcola $(3a^2b)^3$?`,
    back: r`Si eleva alla potenza ogni fattore: $27a^6b^3$.`,
  },
  {
    id: 'mono.normal-form',
    chapter: 'mono',
    skill: 'mono.normal-form',
    front: r`Quando un monomio è in forma normale?`,
    back: r`Quando ha un solo coefficiente e ogni lettera compare una volta sola.`,
  },
  {
    id: 'mono.quotient',
    chapter: 'mono',
    skill: 'mono.mul-div',
    front: r`Come si divide $a^m$ per $a^n$ nei monomi?`,
    back: r`Si sottraggono gli esponenti: $a^{m-n}$.`,
  },

  // Capitolo 7, Polinomi
  {
    id: 'poly.square',
    chapter: 'poly',
    skill: 'poly.square',
    front: r`$(A + B)^2 = {}$?`,
    back: r`$A^2 + 2AB + B^2$.`,
  },
  {
    id: 'poly.square-diff',
    chapter: 'poly',
    skill: 'poly.square',
    front: r`$(A - B)^2 = {}$?`,
    back: r`$A^2 - 2AB + B^2$.`,
  },
  {
    id: 'poly.sum-diff',
    chapter: 'poly',
    skill: 'poly.sum-diff',
    front: r`$(A + B)(A - B) = {}$?`,
    back: r`$A^2 - B^2$.`,
  },
  {
    id: 'poly.cube',
    chapter: 'poly',
    skill: 'poly.more-notable',
    front: r`$(A + B)^3 = {}$?`,
    back: r`$A^3 + 3A^2B + 3AB^2 + B^3$.`,
  },
  {
    id: 'poly.trinomial-square',
    chapter: 'poly',
    skill: 'poly.more-notable',
    front: r`$(A + B + C)^2 = {}$?`,
    back: r`$A^2 + B^2 + C^2 + 2AB + 2AC + 2BC$.`,
  },
  {
    id: 'poly.degree',
    chapter: 'poly',
    front: r`Qual è il grado di un polinomio?`,
    back: r`Il più alto fra i gradi dei suoi termini, una volta ridotto in forma normale.`,
  },
]
