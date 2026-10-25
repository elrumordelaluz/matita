import { binary, num, type Expression } from './expression.ts'
import { seededRandom, type Random } from './random.ts'

// Un generatore per abilità: dal seme all'esercizio, con i vincoli del
// capitolo dentro. Cambiare cosa produce un seme richiede di alzare la
// versione, perché i tentativi salvati ricostruiscono l'esercizio dal seme.

export interface Exercise {
  readonly skill: GeneratedSkill
  readonly seed: number
  readonly generatorVersion: number
  readonly expression: Expression
}

interface Generator {
  readonly version: number
  build(random: Random): Expression
}

const generators = {
  'n.add-sub': {
    version: 1,
    build(random) {
      const count = Number(random.int(3n, 5n))
      let total = random.int(1n, 50n)
      let tree = num(total)
      for (let i = 1; i < count; i++) {
        const op = total === 0n ? '+' : random.pick(['+', '-'] as const)
        const n =
          op === '+' ? random.int(1n, 50n) : random.int(1n, min(total, 50n))
        total = op === '+' ? total + n : total - n
        tree = binary(op, tree, num(n))
      }
      return tree
    },
  },
} satisfies Record<string, Generator>

export type GeneratedSkill = keyof typeof generators

function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}

export function generate(skill: GeneratedSkill, seed: number): Exercise {
  const generator: Generator = generators[skill]
  return {
    skill,
    seed,
    generatorVersion: generator.version,
    expression: generator.build(seededRandom(seed)),
  }
}
