// I modelli di frase dei problemi, scritti a mano per ogni ambientazione.
// Vedi SPEC.md, "Insiemi", "Problemi": le parole "solo", "almeno",
// "entrambi", "nessuno" vengono da qui, mai composte dal generatore. I
// modelli fanno parte del generatore: cambiarne uno cambia cosa produce un
// seme, e alza la sua versione.

/**
 * Il ruolo di una quantità nel testo. `inside` e `sets` sono gli indici
 * degli insiemi: una regione [0] è "solo il primo", [] è "nessuno".
 */
export type Role =
  | { readonly kind: 'region'; readonly inside: readonly number[] }
  | { readonly kind: 'at-least'; readonly sets: readonly number[] }
  | {
      readonly kind: 'either-but-not'
      readonly sets: readonly number[]
      readonly not: number
    }
  | { readonly kind: 'union' }
  | { readonly kind: 'total' }
  | { readonly kind: 'exactly-one' }

export interface Setting {
  /** Gli insiemi, con le parole dei nomi delle righe: "solo inglese". */
  readonly words: readonly string[]
  /**
   * L'apertura, punteggiatura compresa, con il totale quando il testo lo
   * dà.
   */
  opening(total: bigint | null): string
  /** La frase di un dato, o null se il modello non c'è. */
  sentence(role: Role, n: bigint): string | null
  /** La domanda, o null se il modello non c'è. */
  question(role: Role): string | null
}

const is = (role: Role, kind: Role['kind'], ...indices: number[]) => {
  if (role.kind !== kind) return false
  const list =
    role.kind === 'region'
      ? role.inside
      : role.kind === 'at-least' || role.kind === 'either-but-not'
        ? role.sets
        : []
  return list.join() === indices.join()
}

const languages: Setting = {
  words: ['inglese', 'francese'],
  opening: (t) => `In una classe di ${t} studenti,`,
  sentence(role, n) {
    if (is(role, 'at-least', 0)) return `${n} studiano inglese`
    if (is(role, 'at-least', 1)) return `${n} studiano francese`
    if (is(role, 'region', 0)) return `${n} studiano solo inglese`
    if (is(role, 'region', 1)) return `${n} studiano solo francese`
    if (is(role, 'region', 0, 1)) return `${n} studiano entrambe le lingue`
    if (is(role, 'region')) return `${n} non studiano nessuna delle due lingue`
    if (role.kind === 'union') return `${n} studiano almeno una lingua`
    return null
  },
  question(role) {
    if (is(role, 'region', 0)) return 'Quanti studiano solo inglese?'
    if (is(role, 'region', 1)) return 'Quanti studiano solo francese?'
    if (is(role, 'region', 0, 1)) return 'Quanti studiano entrambe le lingue?'
    if (is(role, 'region'))
      return 'Quanti non studiano nessuna delle due lingue?'
    if (role.kind === 'union') return 'Quanti studiano almeno una lingua?'
    if (role.kind === 'exactly-one') return 'Quanti studiano una sola lingua?'
    return null
  },
}

const sports: Setting = {
  words: ['tennis', 'nuoto'],
  opening: (t) => `Un club sportivo ha ${t} soci:`,
  sentence(role, n) {
    if (is(role, 'at-least', 0)) return `${n} fanno tennis`
    if (is(role, 'at-least', 1)) return `${n} fanno nuoto`
    if (is(role, 'region', 0)) return `${n} fanno solo tennis`
    if (is(role, 'region', 1)) return `${n} fanno solo nuoto`
    if (is(role, 'region', 0, 1)) return `${n} fanno entrambi gli sport`
    if (is(role, 'region')) return `${n} non fanno nessuno dei due sport`
    if (role.kind === 'union') return `${n} fanno almeno uno dei due sport`
    return null
  },
  question(role) {
    if (is(role, 'region', 0)) return 'Quanti soci fanno solo tennis?'
    if (is(role, 'region', 1)) return 'Quanti soci fanno solo nuoto?'
    if (is(role, 'region', 0, 1)) return 'Quanti soci fanno entrambi gli sport?'
    if (is(role, 'region'))
      return 'Quanti soci non fanno nessuno dei due sport?'
    if (role.kind === 'union')
      return 'Quanti soci fanno almeno uno dei due sport?'
    if (role.kind === 'exactly-one') return 'Quanti soci fanno un solo sport?'
    return null
  },
}

const workshops: Setting = {
  words: ['teatro', 'fotografia'],
  opening: (t) => `In una classe di ${t} alunni,`,
  sentence(role, n) {
    if (is(role, 'at-least', 0)) return `${n} seguono il laboratorio di teatro`
    if (is(role, 'at-least', 1))
      return `${n} seguono il laboratorio di fotografia`
    if (is(role, 'region', 0)) return `${n} seguono solo teatro`
    if (is(role, 'region', 1)) return `${n} seguono solo fotografia`
    if (is(role, 'region', 0, 1)) return `${n} seguono entrambi i laboratori`
    if (is(role, 'region')) return `${n} non seguono nessun laboratorio`
    if (role.kind === 'union') return `${n} seguono almeno un laboratorio`
    return null
  },
  question(role) {
    if (is(role, 'region', 0)) return 'Quanti seguono solo teatro?'
    if (is(role, 'region', 1)) return 'Quanti seguono solo fotografia?'
    if (is(role, 'region', 0, 1)) return 'Quanti seguono entrambi i laboratori?'
    if (is(role, 'region')) return 'Quanti non seguono nessun laboratorio?'
    if (role.kind === 'union') return 'Quanti seguono almeno un laboratorio?'
    if (role.kind === 'exactly-one')
      return 'Quanti seguono un solo laboratorio?'
    return null
  },
}

// Con tre insiemi l'apertura dice che ognuno sta in almeno un insieme, con
// il numero di chi c'è quando il testo lo dà: è l'unione, e fuori non resta
// nessuno.

const courses = ['Salsa', 'Hip Hop', 'Break']

const dance: Setting = {
  words: courses,
  opening: (u) =>
    u === null
      ? 'In una scuola di danza ognuno segue almeno un corso fra Salsa, Hip Hop e Break:'
      : `Una scuola di danza ha ${u} iscritti, ognuno a uno o più corsi fra Salsa, Hip Hop e Break:`,
  sentence(role, n) {
    const w = (i: number) => courses[i] ?? ''
    if (role.kind === 'at-least')
      return `${n} seguono almeno ${role.sets.map(w).join(' e ')}`
    if (role.kind === 'region' && role.inside.length === 3)
      return `${n} seguono tutti e tre i corsi`
    if (role.kind === 'region' && role.inside.length > 0)
      return `${n} seguono solo ${role.inside.map(w).join(' e ')}`
    if (role.kind === 'either-but-not')
      return `${n} seguono ${role.sets.map(w).join(' o ')} ma non ${w(role.not)}`
    return null
  },
  question(role) {
    const w = (i: number) => courses[i] ?? ''
    if (role.kind === 'region' && role.inside.length === 3)
      return 'Quanti seguono tutti e tre i corsi?'
    if (role.kind === 'region' && role.inside.length > 0)
      return `Quanti seguono solo ${role.inside.map(w).join(' e ')}?`
    if (role.kind === 'union') return 'Quanti sono gli iscritti?'
    if (role.kind === 'exactly-one') return 'Quanti seguono un solo corso?'
    return null
  },
}

// C3 5.81 scrive "hanno almeno ballato": il testo usa i verbi, le righe i
// nomi, "solo ballo e canto".
const done = ['ballato', 'cantato', 'recitato']

const company: Setting = {
  words: ['ballo', 'canto', 'recitazione'],
  opening: (u) =>
    u === null
      ? 'In una compagnia teatrale ognuno balla, canta o recita:'
      : `Una compagnia teatrale ha ${u} componenti, e ognuno balla, canta o recita:`,
  sentence(role, n) {
    const w = (i: number) => done[i] ?? ''
    if (role.kind === 'at-least')
      return `${n} hanno almeno ${role.sets.map(w).join(' e ')}`
    if (role.kind === 'region' && role.inside.length === 3)
      return `${n} hanno fatto tutte e tre le cose`
    if (role.kind === 'region' && role.inside.length > 0)
      return `${n} hanno solo ${role.inside.map(w).join(' e ')}`
    if (role.kind === 'either-but-not')
      return `${n} hanno ${role.sets.map(w).join(' o ')} ma non ${w(role.not)}`
    return null
  },
  question(role) {
    const w = (i: number) => done[i] ?? ''
    if (role.kind === 'region' && role.inside.length === 3)
      return 'Quanti hanno fatto tutte e tre le cose?'
    if (role.kind === 'region' && role.inside.length > 0)
      return `Quanti hanno solo ${role.inside.map(w).join(' e ')}?`
    if (role.kind === 'union')
      return 'Quanti sono i componenti della compagnia?'
    if (role.kind === 'exactly-one') return 'Quanti hanno fatto una cosa sola?'
    return null
  },
}

/** Le ambientazioni, per id: l'id finisce nel problema. */
export const settings: Readonly<Record<string, Setting>> = {
  languages,
  sports,
  workshops,
  dance,
  company,
}

/** Le ambientazioni con due insiemi. */
export const twoSetSettings = ['languages', 'sports', 'workshops'] as const

/** Le ambientazioni con tre insiemi. */
export const threeSetSettings = ['dance', 'company'] as const

export function settingOf(id: string): Setting {
  const setting = settings[id]
  if (!setting) throw new RangeError(`Ambientazione sconosciuta: ${id}`)
  return setting
}
