import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { openIndexedDbStore } from './progress/indexedDbStore.ts'
import { createMemoryStore } from './progress/store.ts'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

// Se IndexedDB non si apre (alcune finestre private) si lavora in memoria:
// la pratica funziona, i progressi si perdono alla chiusura.
const store = await openIndexedDbStore().catch((error: unknown) => {
  console.warn('IndexedDB unavailable, progress kept in memory only', error)
  return createMemoryStore()
})

createRoot(root).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
)
