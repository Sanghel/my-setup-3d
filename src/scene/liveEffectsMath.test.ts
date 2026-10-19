import { describe, expect, it } from 'vitest'
import { breath, dustOpacity, ledGlowOpacity, seedDust, stepDust, type DustBox } from './liveEffectsMath'

const box: DustBox = { min: [0, 0.1, 0], max: [1, 2, 1] }

describe('LED que respira', () => {
  it('oscila entre el mínimo y 1', () => {
    const samples = Array.from({ length: 200 }, (_, i) => breath(i * 0.1, false))
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0.6 - 1e-9)
    expect(Math.max(...samples)).toBeLessThanOrEqual(1 + 1e-9)
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.2)
  })

  it('dos instantes separados ~2 s tienen intensidad distinta', () => {
    expect(breath(0, false)).not.toBeCloseTo(breath(2, false), 2)
  })

  it('con movimiento reducido la intensidad es fija', () => {
    expect(breath(0, true)).toBe(breath(5, true))
  })

  it('el halo animado solo existe de noche', () => {
    expect(ledGlowOpacity(0, 1)).toBe(0)
    expect(ledGlowOpacity(1, 1)).toBeGreaterThan(0)
  })
})

describe('polvo', () => {
  it('solo se ve de tarde', () => {
    expect(dustOpacity(0)).toBeGreaterThan(0)
    expect(dustOpacity(1)).toBe(0)
  })

  it('se desvanece al inspeccionar (la cámara queda encima de las partículas)', () => {
    expect(dustOpacity(0, 0)).toBe(0)
  })

  it('nace dentro del haz, igual en cada visita', () => {
    const a = seedDust(50, box)
    expect(a).toEqual(seedDust(50, box))
    for (let i = 0; i < a.length; i++) {
      const axis = i % 3
      expect(a[i]).toBeGreaterThanOrEqual(box.min[axis])
      expect(a[i]).toBeLessThanOrEqual(box.max[axis])
    }
  })

  it('sube y, al salir por arriba, vuelve a entrar por abajo', () => {
    const positions = new Float32Array([0.5, 1.999, 0.5])
    stepDust(positions, box, 0, 1)
    expect(positions[1]).toBeCloseTo(box.min[1], 6) // Float32: 0,1 se guarda como 0,1000000015
    const low = new Float32Array([0.5, 1, 0.5])
    stepDust(low, box, 0, 1)
    expect(low[1]).toBeGreaterThan(1)
  })
})
