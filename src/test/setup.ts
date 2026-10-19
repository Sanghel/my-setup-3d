import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library solo limpia el DOM entre tests sola si Vitest usa `globals: true`; aquí se hace explícito.
afterEach(cleanup)
