// Fotos oficiales de producto (match-mock-content D6): blender/textures/products-src/ → public/products/<id>/*.webp
// Uso: npm run products:photos   (requiere ImageMagick). Escribe src/data/productPhotos.json y una hoja de contactos.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const { credits, items } = JSON.parse(readFileSync('blender/textures/products.json', 'utf8'))
const srcDir = 'blender/textures/products-src'
const outRoot = 'public/products'
const MAX_BYTES = 250 * 1024

const magick = (...args) => execFileSync('magick', args, { encoding: 'utf8' }).trim()

rmSync(outRoot, { recursive: true, force: true })
const manifest = {}
const sheet = []

for (const [id, photos] of Object.entries(items)) {
  const outDir = join(outRoot, id)
  mkdirSync(outDir, { recursive: true })
  manifest[id] = photos.map(({ file, credit, alt }, index) => {
    const input = join(srcDir, file)
    if (!existsSync(input)) throw new Error(`Falta ${input}: descárgala desde ${credits[credit].url}`)
    const size = index === 0 ? 1200 : 600
    const out = join(outDir, `${index + 1}.webp`)
    // Fondo blanco para los PNG transparentes; -strip quita EXIF/XMP/ICC. Si pesa demasiado, baja la calidad.
    for (const quality of [82, 74, 66, 58]) {
      magick(`${input}[0]`, '-background', 'white', '-alpha', 'remove', '-alpha', 'off', '-resize', `${size}x${size}>`, '-strip', '-quality', String(quality), out)
      if (statSync(out).size <= MAX_BYTES) break
    }
    const bytes = statSync(out).size
    if (bytes > MAX_BYTES) throw new Error(`${out} pesa ${Math.round(bytes / 1024)} KB (> 250 KB)`)
    console.log(`[products] ${out} (${Math.round(bytes / 1024)} KB) ← ${file}`)
    sheet.push(out)
    return { src: `/products/${id}/${index + 1}.webp`, alt, credit: credits[credit] }
  })
}

writeFileSync('src/data/productPhotos.json', JSON.stringify(manifest, null, 2) + '\n')
const contact = process.env.CONTACT_SHEET ?? 'blender/out/products-contact.jpg'
mkdirSync('blender/out', { recursive: true })
magick('montage', ...sheet, '-tile', '6x', '-geometry', '260x200+6+6', '-background', '#1a1a1d', contact)
console.log(`[products] ${sheet.length} fotos · hoja de contactos: ${contact}`)
