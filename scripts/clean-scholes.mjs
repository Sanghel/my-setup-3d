// Scholes sin el reflejo de quien tomó la foto (ajustes visuales 3, D4). La textura del mock
// (jersey_scholes_mock.jpg, recorte de la foto del usuario) tiene una silueta oscura y un brillo curvo
// sobre la tela, debajo del número. Dentro de una máscara suave que no toca el nombre, el número ni las
// mangas, la tela se reconstruye por separación de frecuencias:
//   - baja frecuencia: el rojo parejo de la tela sana (con un poco de grano),
//   - alta frecuencia: el detalle fino de la foto (trama y arrugas chicas), que no trae la silueta.
// Uso: npm run textures:scholes  →  blender/textures/photos/jersey_scholes.jpg
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SRC = 'blender/textures/photos/jersey_scholes_mock.jpg'
const OUT = 'blender/textures/photos/jersey_scholes.jpg'
/** Zona del reflejo en la textura de 1056×1200: debajo del número, de manga a manga; sube a la izquierda del "1". */
const REFLECTION = 'polygon 165,600 335,600 345,712 705,712 715,980 690,1050 200,1055 160,980'
/** Rojo de la tela sana, medido a la derecha de la camiseta (x 780, y 760–980). */
const CLOTH = 'rgb(140,27,15)'

const tmp = mkdtempSync(join(tmpdir(), 'scholes-'))
const file = (name) => join(tmp, name)
const magick = (...args) => execFileSync('magick', args)
try {
  const [width, height] = execFileSync('magick', ['identify', '-format', '%w %h', SRC]).toString().split(' ')
  const size = `${width}x${height}`
  magick('-size', size, 'xc:black', '-fill', 'white', '-draw', REFLECTION, '-alpha', 'off', '-colorspace', 'gray', '-blur', '0x18', file('mask.png'))
  // Alta frecuencia: foto menos su versión desenfocada (valores negativos: hace falta IM con HDRI, en memoria)
  magick(SRC, '(', SRC, '-blur', '0x3', ')', '-compose', 'Minus_Dst', '-composite', file('high.miff'))
  magick('-size', size, `xc:${CLOTH}`, '-attenuate', '0.35', '+noise', 'Gaussian', file('high.miff'), '-compose', 'Plus', '-composite', file('cloth.miff'))
  magick(SRC, file('cloth.miff'), file('mask.png'), '-compose', 'over', '-composite', '-quality', '92', OUT)
  console.log(`[scholes] ${OUT} (${size}, sin reflejo)`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
