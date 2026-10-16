import { describe, expect, it } from 'vitest'
import { bounds, box, instancePositions, merge, toMeters, VOXEL_SIZE } from './voxel'

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

describe('instancePositions', () => {
  it('centra el modelo en X/Z y apoya su base en y = 0, en metros', () => {
    // caja de 2×1×2 voxeles con la esquina en (10, 5, 10)
    const positions = instancePositions(box([10, 5, 10], [2, 1, 2], 0))
    expect(positions).toHaveLength(4 * 3)
    const xs = [], ys = [], zs = []
    for (let i = 0; i < positions.length; i += 3) {
      xs.push(positions[i])
      ys.push(positions[i + 1])
      zs.push(positions[i + 2])
    }
    // centros de los cubos: ±medio voxel alrededor de 0 en X/Z
    expect(Math.min(...xs)).toBeCloseTo(-VOXEL_SIZE / 2)
    expect(Math.max(...xs)).toBeCloseTo(VOXEL_SIZE / 2)
    expect(Math.min(...zs)).toBeCloseTo(-VOXEL_SIZE / 2)
    // el centro del cubo más bajo está a medio voxel del piso
    expect(Math.min(...ys)).toBeCloseTo(VOXEL_SIZE / 2)
  })
})
