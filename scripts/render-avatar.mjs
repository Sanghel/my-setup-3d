// Muñeco del autor (ajustes visuales 3, D7): el avatar de Habbo que el usuario generó con el avatar
// imager oficial (blender/textures/avatar-habbo.webp, tamaño "l": cada píxel de Habbo son 2×2). Se
// recorta al contorno y se amplía sin interpolar, para que los píxeles queden nítidos también en el
// horneado de Blender.
// Uso: npm run textures:avatar  →  blender/textures/photos/avatar.png
import { execFileSync } from 'node:child_process'

const SRC = 'blender/textures/avatar-habbo.webp'
const OUT = 'blender/textures/photos/avatar.png'
const SCALE = 400 // %: 2×2 por píxel de Habbo → 8×8

execFileSync('magick', [SRC, '-trim', '+repage', '-filter', 'point', '-resize', `${SCALE}%`, '-strip', OUT])
const size = execFileSync('magick', ['identify', '-format', '%wx%h', OUT]).toString()
console.log(`[avatar] ${OUT} (${size})`)
