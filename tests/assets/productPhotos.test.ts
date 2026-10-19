import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import productPhotos from '../../src/data/productPhotos.json' with { type: 'json' }

const photos = Object.values(productPhotos).flat()

/** Nombres de los chunks RIFF de un WebP ('VP8 ', 'VP8L', 'VP8X', 'ALPH', 'EXIF', 'XMP ', 'ICCP'…). */
function webpChunks(bytes: Buffer) {
  const chunks: string[] = []
  for (let offset = 12; offset + 8 <= bytes.length; ) {
    chunks.push(bytes.toString('ascii', offset, offset + 4))
    const size = bytes.readUInt32LE(offset + 4)
    offset += 8 + size + (size % 2)
  }
  return chunks
}

describe('fotos oficiales de producto (match-mock-content D6)', () => {
  it('hay fotos y cada una tiene texto alternativo y crédito con enlace', () => {
    expect(photos.length).toBeGreaterThan(0)
    for (const photo of photos) {
      expect(photo.alt.length).toBeGreaterThan(5)
      expect(photo.credit.label).not.toBe('')
      expect(photo.credit.url).toMatch(/^https:\/\//)
    }
  })

  it.each(photos.map((photo) => [photo.src]))('%s existe, es WebP, pesa ≤ 250 KB y no tiene metadatos', (src) => {
    const file = join('public', src)
    expect(existsSync(file)).toBe(true)
    expect(statSync(file).size).toBeLessThanOrEqual(250 * 1024)
    const bytes = readFileSync(file)
    expect(bytes.toString('ascii', 0, 4)).toBe('RIFF')
    expect(bytes.toString('ascii', 8, 12)).toBe('WEBP')
    const chunks = webpChunks(bytes)
    expect(chunks).not.toContain('EXIF')
    expect(chunks).not.toContain('XMP ')
  })

  it('los objetos personalizados no tienen fotos oficiales', () => {
    for (const id of ['desk', 'jersey-2008', 'jersey-scholes', 'poster']) expect(productPhotos).not.toHaveProperty(id)
  })
})
