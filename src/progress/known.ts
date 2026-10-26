// Il segno "già saputo". Vedi SPEC.md, "Già saputo". Si salva accanto ai
// tentativi, uno per abilità: progress/ non conosce i capitoli, e segnare un
// capitolo vuol dire segnare tutte le sue abilità con la stessa data.

export interface Known {
  readonly skill: string
  /** Millisecondi dall'epoca Unix. */
  readonly markedAt: number
}

/** I segni per un gruppo di abilità, tutti con la stessa data. */
export function markKnown(skills: readonly string[], at: number): Known[] {
  return skills.map((skill) => ({ skill, markedAt: at }))
}

/**
 * La data del segno se tutte le abilità date sono segnate, la più recente fra
 * quelle dei segni; altrimenti `null`. Un gruppo vuoto non è mai saputo.
 */
export function knownSince(
  skills: readonly string[],
  known: readonly Known[],
): number | null {
  if (skills.length === 0) return null
  const at = new Map(known.map((k) => [k.skill, k.markedAt]))
  let latest = 0
  for (const skill of skills) {
    const markedAt = at.get(skill)
    if (markedAt === undefined) return null
    latest = Math.max(latest, markedAt)
  }
  return latest
}
