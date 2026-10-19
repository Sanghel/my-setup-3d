/// <reference types="vitest/config" />
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Huella del contenido de public/models/: el modelo y los lightmaps no pasan por el bundler (no
 * llevan hash en el nombre), así que se piden como `room.glb?v=<huella>`. Si cambia un archivo,
 * cambia la URL y el navegador no puede reusar la versión vieja; si no cambia, el caché largo sirve.
 */
function modelsVersion(dir = 'public/models') {
  const hash = createHash('sha256')
  for (const file of readdirSync(dir).sort()) hash.update(file).update(readFileSync(join(dir, file)))
  return hash.digest('hex').slice(0, 10)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { __MODELS_VERSION__: JSON.stringify(modelsVersion()) },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
  },
})
