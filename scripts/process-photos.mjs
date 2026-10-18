// Convierte las fotos del usuario (vault, privado) en texturas para Blender (blender/textures/photos/).
// Uso: npm run textures:photos   (requiere ImageMagick y el vault en INSUMOS_DIR)
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const insumos = process.env.INSUMOS_DIR ?? join(homedir(), 'Documents/Obsidian Vault/my-setup-3d/insumos')
const { photos, screens = {}, edits = {}, cutouts = {} } = JSON.parse(readFileSync('blender/textures/sources.json', 'utf8'))
const outDir = 'blender/textures/photos'
mkdirSync(outDir, { recursive: true })

const magick = (...args) => execFileSync('magick', args, { encoding: 'utf8' }).trim()
const source = (file) => {
  const path = join(insumos, file)
  if (!existsSync(path)) throw new Error(`No existe ${path}: ¿está el vault en INSUMOS_DIR?`)
  return path
}

// Fotos: corrección de perspectiva. Cada esquina de la foto va a la esquina del rectángulo de salida.
for (const [name, { file, corners, size, post = [] }] of Object.entries(photos)) {
  const input = source(file)
  const [w, h] = magick(input, '-auto-orient', '-format', '%w %h', 'info:').split(' ').map(Number)
  const [W, H] = size
  const targets = [[0, 0], [W, 0], [W, H], [0, H]]
  const pairs = corners.map(([x, y], i) => `${x * w},${y * h} ${targets[i][0]},${targets[i][1]}`).join('  ')
  const out = join(outDir, `${name}.jpg`)
  magick(input, '-auto-orient', '-virtual-pixel', 'edge', '-distort', 'Perspective', pairs, '-crop', `${W}x${H}+0+0`, '+repage', ...post, '-quality', '92', out)
  console.log(`[photos] ${out} (${W}×${H}) ← ${file}`)
}

// Pantallas: los wallpapers ya son rectos; solo se redimensionan al tamaño de la textura.
for (const [name, { file, size }] of Object.entries(screens)) {
  const out = join(outDir, `${name}.jpg`)
  magick(source(file), '-resize', `${size[0]}x${size[1]}!`, '-quality', '92', out)
  console.log(`[photos] ${out} (${size[0]}×${size[1]}) ← ${file}`)
}

// Ediciones libres: una lista de operaciones de ImageMagick por imagen (p. ej. la vista nocturna).
for (const [name, { file, ops }] of Object.entries(edits)) {
  const out = join(outDir, `${name}.jpg`)
  magick(source(file), ...ops, '-quality', '90', out)
  console.log(`[photos] ${out} ← ${file} (${ops.join(' ')})`)
}

// Recortes: foto de producto sobre fondo blanco → se borra el fondo (relleno desde las 4 esquinas)
// y la prenda se centra sobre un lienzo del color del fondo del marco.
for (const [name, { file, background, size, height, offsetY, fuzz }] of Object.entries(cutouts)) {
  const input = source(file)
  const [w, h] = magick(input, '-format', '%w %h', 'info:').split(' ').map(Number)
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]
  const out = join(outDir, `${name}.jpg`)
  const offset = `${offsetY >= 0 ? '+' : ''}${offsetY}`
  magick(
    '-size', `${size[0]}x${size[1]}`, `xc:${background}`,
    '(', input, '-alpha', 'set', '-fuzz', fuzz, '-fill', 'none',
    ...corners.flatMap(([x, y]) => ['-draw', `color ${x},${y} floodfill`]),
    '-trim', '+repage', '-resize', `x${height}`, ')',
    '-gravity', 'center', '-geometry', `+0${offset}`, '-composite', '-quality', '92', out,
  )
  console.log(`[photos] ${out} (${size[0]}×${size[1]}) ← ${file} (recorte sobre ${background})`)
}
