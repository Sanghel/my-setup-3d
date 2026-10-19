// Copia los lightmaps horneados (blender/out) a public/models en WebP + su metadata (factor de escala y
// exposición por ambiente). La web los mezcla en el shader (src/scene/ambience.ts).
import { copyFileSync, readFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const meta = JSON.parse(readFileSync('blender/out/lightmap.json', 'utf8'))
for (const name of Object.keys(meta.ambiences)) {
  const out = `public/models/lightmap-${name}.webp`
  execFileSync('magick', [`blender/out/lightmap-${name}.png`, '-quality', '92', out])
  console.log(`[lightmap] ${out} (${(statSync(out).size / 1024).toFixed(0)} KB)`)
}
copyFileSync('blender/out/lightmap.json', 'public/models/lightmap.json')
