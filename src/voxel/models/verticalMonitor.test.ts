import { describe, expect, it } from 'vitest'
import { VERTICAL_MONITOR, vox } from '../dimensions'
import { bounds } from '../voxel'
import { makeVerticalMonitor, VERTICAL_COLORS } from './verticalMonitor'

describe('makeVerticalMonitor', () => {
  const monitor = makeVerticalMonitor()
  const screen = monitor.voxels.filter(([, , z]) => z === 0)
  const arm = monitor.voxels.filter(([, , , c]) => c === VERTICAL_COLORS.arm)

  it('la pantalla es más alta que ancha (orientación vertical)', () => {
    const { size } = bounds(screen)
    expect(size[1]).toBeGreaterThan(size[0])
    expect(size).toEqual([vox(VERTICAL_MONITOR.width), vox(VERTICAL_MONITOR.height), 1])
  })

  it('el brazo arranca en el escritorio (y = 0) y queda detrás de la pantalla', () => {
    const b = bounds(arm)
    expect(b.min[1]).toBe(0)
    expect(b.max[2]).toBeLessThan(0)
  })

  it('la pantalla muestra "código": varios colores de sintaxis sobre el fondo del editor', () => {
    const colors = new Set(screen.map(([, , , c]) => c))
    expect(colors.has(VERTICAL_COLORS.editor)).toBe(true)
    expect(colors.size).toBeGreaterThanOrEqual(4)
  })
})
