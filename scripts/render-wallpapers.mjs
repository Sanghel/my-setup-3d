// Fondos de las pantallas (ultrawide y vertical) generados por código, con la misma estética del mock:
// ondas suaves rosa / azul / violeta. Reemplazan las fotos de pantalla del mock, que eran de baja
// resolución, mostraban el reloj de la pantalla de bloqueo y el borde del monitor.
// Uso: npm run textures:wallpapers  →  blender/textures/photos/screen_ultrawide.jpg y screen_vertical.jpg
import { execFileSync } from 'node:child_process'

/** Una onda: borde superior y(x) = base + suma de senos (fracciones de la altura); se rellena hacia abajo. */
const LAYERS = [
  { base: 0.3, waves: [[0.07, 1.1, 0.4], [0.03, 2.7, 1.9]], colors: ['#3fd0f4', '#6f7df2'] },
  { base: 0.46, waves: [[0.08, 0.8, 2.2], [0.025, 3.1, 0.3]], colors: ['#f7a6c4', '#ff9d8a'] },
  { base: 0.6, waves: [[0.06, 1.3, 4.0], [0.03, 2.2, 1.1]], colors: ['#8c7cf4', '#5d8ff0'] },
  { base: 0.76, waves: [[0.07, 0.9, 5.3], [0.02, 3.4, 2.6]], colors: ['#f59ac9', '#ffb3a1'] },
]

function wallpaper({ width, height, out, phase, freq }) {
  const edge = (layer) => {
    const points = [`M 0,${height}`]
    for (let x = 0; x <= width; x += Math.max(4, Math.round(width / 400))) {
      const u = x / width
      const y = layer.base + layer.waves.reduce((sum, [amp, k, p]) => sum + amp * Math.sin(u * k * freq * Math.PI * 2 + p + phase), 0)
      points.push(`L ${x},${(y * height).toFixed(1)}`)
    }
    points.push(`L ${width},${height} Z`)
    return points.join(' ')
  }
  const size = `${width}x${height}`
  const soft = Math.round(Math.min(width, height) * 0.006)
  const args = ['-size', size, 'gradient:#5a66d6-#b77ad8']
  for (const layer of LAYERS) {
    const mask = (blur, dy = 0) => [
      '(', '-size', size, 'xc:black', '-fill', 'white', '-draw', `translate 0,${dy} path '${edge(layer)}'`, '-blur', `0x${blur}`, ')',
    ]
    // Sombra suave sobre la capa de atrás (da relieve), luego la capa con su degradado y borde difuminado
    args.push('(', '-size', size, 'xc:#1b1440', ...mask(soft * 6, -soft * 3), '-alpha', 'off', '-compose', 'copy_opacity', '-composite',
      '-channel', 'A', '-evaluate', 'multiply', '0.35', '+channel', ')', '-compose', 'over', '-composite')
    args.push('(', '-size', size, `gradient:${layer.colors[0]}-${layer.colors[1]}`, '-rotate', '-90', '-resize', `${size}!`,
      ...mask(soft), '-alpha', 'off', '-compose', 'copy_opacity', '-composite', ')', '-compose', 'over', '-composite')
  }
  // Grano muy leve para que el degradado no haga bandas en la pantalla.
  // Más saturado que lo que se busca ver: el tone mapping AgX de la escena desatura la emisión
  args.push('-modulate', '100,140', '-attenuate', '0.15', '+noise', 'Gaussian', '-quality', '92', out)
  execFileSync('magick', args)
  console.log(`[wallpapers] ${out} (${width}×${height})`)
}

// Proporciones de cada panel (iguales a las texturas anteriores): 2,39 y 0,56
wallpaper({ width: 2560, height: 1072, out: 'blender/textures/photos/screen_ultrawide.jpg', phase: 0, freq: 1 })
wallpaper({ width: 1024, height: 1832, out: 'blender/textures/photos/screen_vertical.jpg', phase: 1.3, freq: 0.35 })
