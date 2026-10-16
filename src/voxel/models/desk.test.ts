import { describe, expect, it } from 'vitest'
import { DESK, vox } from '../dimensions'
import { bounds } from '../voxel'
import { DESK_COLORS, makeDesk } from './desk'

describe('makeDesk', () => {
  const desk = makeDesk()

  it('mide lo que dicen las dimensiones (ancho × alto × fondo)', () => {
    expect(bounds(desk.voxels).size).toEqual([vox(DESK.width), vox(DESK.height), vox(DESK.depth)])
  })

  it('las patas tocan el piso en ambos extremos', () => {
    const W = vox(DESK.width)
    const onFloor = desk.voxels.filter(([, y]) => y === 0)
    expect(onFloor.some(([x]) => x < W / 4)).toBe(true)
    expect(onFloor.some(([x]) => x > (3 * W) / 4)).toBe(true)
  })

  it('cada pata forma una X: dos voxeles en el piso por lado, separados en el fondo', () => {
    const leftFeet = desk.voxels.filter(([x, y]) => y === 0 && x < 10)
    const zs = leftFeet.map(([, , z]) => z)
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(vox(DESK.depth) / 2)
  })

  it('el desk mat está en la superficie del tablero', () => {
    const H = vox(DESK.height)
    const mat = desk.voxels.filter(([, , , c]) => c === DESK_COLORS.mat)
    expect(mat.length).toBeGreaterThan(0)
    expect(mat.every(([, y]) => y === H - 1)).toBe(true)
  })
})
