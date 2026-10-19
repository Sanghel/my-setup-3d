// Cielo de atardecer para la ventana (ambiente Tarde), generado por código como en el mock de Claude
// Design: gradiente vertical, resplandor del sol y siluetas de cerros y edificios. Sin fotos (privacidad).
// Uso: npm run textures:sky  →  blender/textures/photos/window_tarde.jpg (512×768, proporción del vano)
import { execFileSync } from 'node:child_process'

const W = 512
const H = 768
const out = 'blender/textures/photos/window_tarde.jpg'

// Generador determinista (misma semilla → mismo cielo en cada build)
let seed = 11
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

const hills = [`M 0,${H}`]
for (let x = 0; x <= W; x += 8) hills.push(`L ${x},${(560 + Math.sin(x * 0.02) * 18 + Math.sin(x * 0.07) * 8).toFixed(1)}`)
hills.push(`L ${W},${H} Z`)

const buildings = []
for (let i = 0; i < 26; i++) {
  const w = 20 + rnd() * 50
  const h = 20 + rnd() * 80
  const x = rnd() * W
  const y = H - 120 - h * 0.5 + rnd() * 60
  buildings.push(`rectangle ${x.toFixed(0)},${y.toFixed(0)} ${(x + w).toFixed(0)},${H}`)
}

execFileSync('magick', [
  '-size', `${W}x${H}`,
  // Gradiente en tres tramos: azul grisáceo arriba → durazno → naranja en el horizonte
  'gradient:#a8b6c8-#f3c08c', '(', '-size', `${W}x${H}`, 'gradient:#f3c08c-#ff8a46', ')',
  '(', '-size', `${W}x${H}`, 'gradient:black-white', '-level', '35%,72%', ')',
  '-compose', 'over', '-composite',
  // Resplandor del sol (radial aditivo)
  '(', '-size', '360x360', 'radial-gradient:#fff0c8-none', ')', '-geometry', '+150+320', '-compose', 'screen', '-composite',
  // Cerros y edificios en silueta
  '-fill', '#4a302a', '-draw', `path '${hills.join(' ')}'`,
  '-fill', '#3a2420', '-draw', buildings.join(' '),
  '-quality', '92', out,
])
// La web lo mezcla con la ciudad de noche en la ventana (ambience.ts)
execFileSync('magick', [out, '-quality', '88', 'public/models/window-tarde.webp'])
console.log(`[sky] ${out} (${W}×${H}) + public/models/window-tarde.webp`)
