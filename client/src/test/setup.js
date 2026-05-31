import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock import.meta.env
vi.mock('import.meta.env', () => ({
  VITE_API_URL: 'http://localhost:5000',
}))

// Mock fetch globally
globalThis.fetch = vi.fn()
