// Descarga las texturas PBR de Poly Haven listadas en blender/textures/polyhaven.json.
// Uso: npm run textures:fetch   (omite los archivos que ya existen)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync('blender/textures/polyhaven.json', 'utf8'))
const outDir = 'blender/textures/polyhaven'
mkdirSync(outDir, { recursive: true })

for (const asset of manifest.assets) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${asset}`)).json()
  for (const [map, suffix] of Object.entries(manifest.maps)) {
    const file = files[map]?.[manifest.resolution]?.jpg
    if (!file) throw new Error(`${asset}: no existe el mapa ${map} en ${manifest.resolution}`)
    const target = `${outDir}/${asset}_${suffix}_${manifest.resolution}.jpg`
    if (existsSync(target)) continue
    const response = await fetch(file.url)
    if (!response.ok) throw new Error(`${file.url}: HTTP ${response.status}`)
    writeFileSync(target, Buffer.from(await response.arrayBuffer()))
    console.log(`[textures] ${target} (${(file.size / 1e6).toFixed(1)} MB)`)
  }
}
