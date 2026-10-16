import { describe, expect, it } from 'vitest'
import { ULTRAWIDE, vox } from '../dimensions'
import { bounds } from '../voxel'
import { curveOffset, makeUltrawide, ULTRAWIDE_COLORS } from './ultrawide'

const isWallpaper = (c: number) =>
  c >= ULTRAWIDE_COLORS.wallpaperFirst &&
  c < ULTRAWIDE_COLORS.wallpaperFirst + ULTRAWIDE_COLORS.wallpaperCount

describe('curveOffset', () => {
  it('vale 0 en el centro y crece hacia los bordes de forma simétrica', () => {
    const W = 40
    const R = 90
    expect(curveOffset(19, W, R)).toBe(0)
    expect(curveOffset(0, W, R)).toBeGreaterThan(0)
    expect(curveOffset(0, W, R)).toBe(curveOffset(W - 1, W, R))
  })
})

describe('makeUltrawide', () => {
  const monitor = makeUltrawide()
  const wallpaper = monitor.voxels.filter(([, , , c]) => isWallpaper(c))

  it('la pantalla es más ancha que alta (21:9)', () => {
    const { size } = bounds(wallpaper)
    expect(size[0]).toBeGreaterThan(size[1] * 2)
    expect(size[0]).toBe(vox(ULTRAWIDE.width))
  })

  it('las columnas centrales quedan más atrás que los bordes (curvatura)', () => {
    const frontZ = (column: number) =>
      Math.max(...wallpaper.filter(([x]) => x === column).map(([, , z]) => z))
    const W = vox(ULTRAWIDE.width)
    expect(frontZ(Math.floor(W / 2))).toBeLessThan(frontZ(0))
    expect(frontZ(Math.floor(W / 2))).toBeLessThan(frontZ(W - 1))
  })

  it('la base se apoya en el escritorio (y = 0) y la pantalla queda elevada', () => {
    const { min } = bounds(monitor.voxels)
    expect(min[1]).toBe(0)
    expect(bounds(wallpaper).min[1]).toBeGreaterThan(vox(ULTRAWIDE.lift))
  })

  it('el wallpaper usa varias bandas de color', () => {
    expect(new Set(wallpaper.map(([, , , c]) => c)).size).toBeGreaterThanOrEqual(4)
  })
})
