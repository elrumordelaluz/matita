// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, test } from 'vitest'

// Regole di architettura scritte in SPEC.md ("Architettura") e fatte
// rispettare qui. Legge i file a runtime: un glob di Vite verrebbe risolto in
// trasformazione e messo in cache, e un file nuovo sfuggirebbe.

const root = join(import.meta.dirname, '..')
const importPattern = /(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]/g

function sourceFiles(dir: string): string[] {
  return readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => join(root, dir, f))
}

test('il motore importa solo dal motore', () => {
  const offenders = sourceFiles('src/engine').flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(importPattern)]
      .map(([, specifier]) => specifier ?? '')
      .filter((s) => !s.startsWith('./'))
      .map((s) => `${relative(root, file)} → ${s}`),
  )
  expect(offenders).toEqual([])
})
