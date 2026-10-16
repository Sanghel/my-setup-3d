import { describe, expect, it } from 'vitest'
import { bounds, box, hash3, instancePositions, line, merge, toMeters, VOXEL_SIZE } from './voxel'

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

describe('instancePositions sin centrar', () => {
  it('con center: false usa las coordenadas de la grilla tal cual', () => {
    const positions = instancePositions([[10, 0, -1, 0]], { center: false })
    expect(positions[0]).toBeCloseTo(10.5 * VOXEL_SIZE)
    expect(positions[1]).toBeCloseTo(0.5 * VOXEL_SIZE)
    expect(positions[2]).toBeCloseTo(-0.5 * VOXEL_SIZE)
  })
})

describe('line', () => {
  it('une dos puntos con voxeles contiguos, incluyendo los extremos', () => {
    const voxels = line([0, 0, 0], [0, 10, 5], 0)
    const ys = voxels.map(([, y]) => y)
    expect(Math.min(...ys)).toBe(0)
    expect(Math.max(...ys)).toBe(10)
    // un voxel por paso del eje más largo: no quedan huecos en Y
    expect(new Set(ys).size).toBe(11)
    expect(voxels).toContainEqual([0, 10, 5, 0])
  })

  it('aplica un grosor como caja alrededor de cada punto', () => {
    const thin = line([0, 0, 0], [10, 0, 0], 0)
    const thick = line([0, 0, 0], [10, 0, 0], 0, [1, 2, 2])
    expect(thick).toHaveLength(thin.length * 4)
  })
})

describe('hash3', () => {
  it('es determinista y devuelve valores en [0, 1)', () => {
    expect(hash3(3, 7, 11)).toBe(hash3(3, 7, 11))
    expect(hash3(3, 7, 11)).not.toBe(hash3(3, 7, 12))
    for (let i = 0; i < 200; i++) {
      const v = hash3(i, i * 2, -i)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
