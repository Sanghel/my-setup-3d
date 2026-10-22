// Muñeco del autor al estilo Habbo (ajustes visuales 3, D7): dibuja la rejilla de
// blender/textures/avatar.json (un carácter por píxel, '.' transparente) en una PNG con alfa, ampliada
// sin interpolar para que los píxeles queden nítidos.
// Uso: npm run textures:avatar  →  blender/textures/photos/avatar.png
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const SCALE = 16
const OUT = 'blender/textures/photos/avatar.png'
const { palette, pixels } = JSON.parse(readFileSync('blender/textures/avatar.json', 'utf8'))

const width = Math.max(...pixels.map((row) => row.length))
const height = pixels.length
const draws = []
pixels.forEach((row, y) => {
  if (row.length !== width) throw new Error(`avatar.json: la fila ${y} mide ${row.length}, se esperaban ${width}`)
  ;[...row].forEach((cell, x) => {
    if (cell === '.') return
    if (!palette[cell]) throw new Error(`avatar.json: "${cell}" (fila ${y}) no está en la paleta`)
    draws.push('-fill', palette[cell], '-draw', `point ${x},${y}`)
  })
})
execFileSync('magick', ['-size', `${width}x${height}`, 'xc:none', ...draws, '-filter', 'point', '-resize', `${SCALE * 100}%`, OUT])
console.log(`[avatar] ${OUT} (${width}×${height} píxeles, ×${SCALE})`)
