import { describe, expect, it } from 'vitest'
import { bounds } from '../voxel'
import { makeBackWall, makeCeiling, makeFloor, makeSideWall, ROOM_VOXELS, WINDOW_VOXELS } from './room'

describe('estructura del cuarto', () => {
  it('el piso cubre todo el cuarto y queda justo debajo de y = 0', () => {
    const b = bounds(makeFloor().voxels)
    expect(b.size).toEqual([ROOM_VOXELS.width, 1, ROOM_VOXELS.depth])
    expect(b.max[1]).toBe(-1)
  })

  it('la pared del fondo queda detrás de z = 0 y llega al techo', () => {
    const b = bounds(makeBackWall().voxels)
    expect(b.max[2]).toBe(-1)
    expect(b.size[1]).toBe(ROOM_VOXELS.height)
  })

  it('la pared lateral tiene el hueco de la ventana', () => {
    const wall = makeSideWall().voxels
    const { fromCorner, width, sill, height } = WINDOW_VOXELS
    const inWindow = wall.filter(
      ([, y, z]) => z >= fromCorner && z < fromCorner + width && y >= sill && y < sill + height,
    )
    expect(inWindow).toHaveLength(0)
    expect(wall).toHaveLength(ROOM_VOXELS.depth * ROOM_VOXELS.height - width * height)
  })

  it('el techo queda sobre la altura del cuarto', () => {
    expect(bounds(makeCeiling().voxels).min[1]).toBe(ROOM_VOXELS.height)
  })

  it('los colores variados siempre apuntan a la paleta', () => {
    const { palette, voxels } = makeCeiling()
    expect(voxels.every(([, , , c]) => c >= 0 && c < palette.length)).toBe(true)
  })
})
