// Copia el lightmap horneado (blender/out) a public/models en WebP + su metadata (factor de escala).
import { copyFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

execFileSync('magick', ['blender/out/lightmap.png', '-quality', '92', 'public/models/lightmap.webp'])
copyFileSync('blender/out/lightmap.json', 'public/models/lightmap.json')
console.log(`[lightmap] public/models/lightmap.webp (${(statSync('public/models/lightmap.webp').size / 1024).toFixed(0)} KB)`)
