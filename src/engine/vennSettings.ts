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

/** Le ambientazioni, per id: l'id finisce nel problema. */
export const settings: Readonly<Record<string, Setting>> = {
  languages,
  sports,
  workshops,
}

/** Le ambientazioni con due insiemi. */
export const twoSetSettings = ['languages', 'sports', 'workshops'] as const

export function settingOf(id: string): Setting {
  const setting = settings[id]
  if (!setting) throw new RangeError(`Ambientazione sconosciuta: ${id}`)
  return setting
}
