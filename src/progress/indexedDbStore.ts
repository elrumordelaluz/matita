import { openDB, type DBSchema } from 'idb'
import { chronological, type Attempt } from './attempt.ts'
import type { Known } from './known.ts'
import type { ProgressStore } from './store.ts'

// ProgressStore su IndexedDB, attraverso `idb`. Due archivi: i tentativi per
// id e i segni di già saputo per abilità. Tutto il resto si ricalcola.

interface ProgressDb extends DBSchema {
  attempts: { key: string; value: Attempt }
  known: { key: string; value: Known }
}

// La versione 1 aveva solo i tentativi; la 2 aggiunge i segni. L'upgrade
// crea solo gli archivi che mancano, così i tentativi già salvati restano.
const schemaVersion = 2

export async function openIndexedDbStore(
  name = 'matita',
): Promise<ProgressStore> {
  const db = await openDB<ProgressDb>(name, schemaVersion, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) db.createObjectStore('attempts', { keyPath: 'id' })
      if (oldVersion < 2) db.createObjectStore('known', { keyPath: 'skill' })
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
    async known() {
      return db.getAll('known')
    },
    async putKnown(known) {
      const tx = db.transaction('known', 'readwrite')
      await Promise.all([...known.map((k) => tx.store.put(k)), tx.done])
    },
    async removeKnown(skills) {
      const tx = db.transaction('known', 'readwrite')
      await Promise.all([...skills.map((s) => tx.store.delete(s)), tx.done])
    },
  }
}
