import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library only auto-cleans when Vitest globals are enabled.
afterEach(cleanup)

// Device preferences live in localStorage: every test starts as a first visit.
// Tests in the node environment have no localStorage to clear.
afterEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear()
})
