import { openDB, type DBSchema } from 'idb'
import { chronological, type Attempt } from './attempt.ts'
import type { ProgressStore } from './store.ts'

// ProgressStore su IndexedDB, attraverso `idb`. Un solo archivio, i tentativi
// per id: tutto il resto si ricalcola.

interface ProgressDb extends DBSchema {
  attempts: { key: string; value: Attempt }
}

export async function openIndexedDbStore(
  name = 'matita',
): Promise<ProgressStore> {
  const db = await openDB<ProgressDb>(name, 1, {
    upgrade(db) {
      db.createObjectStore('attempts', { keyPath: 'id' })
    },
  })
  return {
    async attempts() {
      return chronological(await db.getAll('attempts'))
    },
    async addAttempt(attempt) {
      await db.put('attempts', attempt)
    },
    async putAttempts(attempts) {
      const tx = db.transaction('attempts', 'readwrite')
      await Promise.all([...attempts.map((a) => tx.store.put(a)), tx.done])
    },
  }
}
