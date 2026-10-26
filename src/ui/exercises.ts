import {
  generate,
  type Exercise,
  type GeneratedSkill,
} from '../engine/index.ts'

// Il ponte fra le abilità del percorso e i generatori del motore. Non tutte
// le abilità hanno già un generatore: quelle senza restano fuori dalla
// sessione finché il motore non lo aggiunge.

export function exerciseFor(skill: string, seed: number): Exercise | null {
  try {
    return generate(skill as GeneratedSkill, seed)
  } catch {
    return null
  }
}

export function canPractise(skill: string): skill is GeneratedSkill {
  return exerciseFor(skill, 0) !== null
}

export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
}
