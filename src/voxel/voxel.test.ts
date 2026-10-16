import { describe, expect, it } from 'vitest'
import { bounds, box, merge, toMeters, VOXEL_SIZE } from './voxel'

describe('box', () => {
  it('genera un voxel por cada celda del volumen', () => {
    const voxels = box([0, 0, 0], [3, 2, 4], 1)
    expect(voxels).toHaveLength(3 * 2 * 4)
    expect(voxels.every(([, , , c]) => c === 1)).toBe(true)
  })

  it('respeta el origen indicado', () => {
    const voxels = box([5, 1, -2], [1, 1, 1], 0)
    expect(voxels).toEqual([[5, 1, -2, 0]])
  })

  it('devuelve vacío si alguna dimensión es 0', () => {
    expect(box([0, 0, 0], [3, 0, 2], 0)).toEqual([])
  })
})

describe('merge', () => {
  it('une listas sin duplicar posiciones', () => {
    const a = box([0, 0, 0], [2, 1, 1], 0)
    const b = box([1, 0, 0], [2, 1, 1], 0)
    expect(merge(a, b)).toHaveLength(3)
  })

  it('la última lista gana cuando dos voxeles ocupan la misma celda', () => {
    const merged = merge([[0, 0, 0, 0]], [[0, 0, 0, 2]])
    expect(merged).toEqual([[0, 0, 0, 2]])
  })
})

describe('bounds', () => {
  it('calcula mínimo, máximo y tamaño en voxeles', () => {
    const b = bounds(merge(box([0, 0, 0], [2, 2, 2], 0), box([4, 1, -1], [1, 1, 1], 0)))
    expect(b.min).toEqual([0, 0, -1])
    expect(b.max).toEqual([4, 1, 1])
    expect(b.size).toEqual([5, 2, 3])
  })

  it('falla con un modelo vacío', () => {
    expect(() => bounds([])).toThrow()
  })
})

describe('toMeters', () => {
  it('convierte voxeles a metros con VOXEL_SIZE', () => {
    expect(VOXEL_SIZE).toBe(0.02)
    expect(toMeters(50)).toBeCloseTo(1)
  })
})
