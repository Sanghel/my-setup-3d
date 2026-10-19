import { describe, expect, it } from 'vitest'
import { easeInOutCubic, flightPose, type Flight } from './cameraTween'

describe('easeInOutCubic', () => {
  it('empieza en 0, pasa por la mitad en 0,5 y termina en 1', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10)
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('arranca y frena suave: al 10 % del tiempo recorrió menos del 1 %', () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.01)
    expect(1 - easeInOutCubic(0.9)).toBeLessThan(0.01)
  })

  it('es simétrica y siempre avanza', () => {
    for (let t = 0; t <= 1; t += 0.05) expect(easeInOutCubic(t) + easeInOutCubic(1 - t)).toBeCloseTo(1, 10)
    for (let t = 0; t < 1; t += 0.01) expect(easeInOutCubic(t + 0.01)).toBeGreaterThanOrEqual(easeInOutCubic(t))
  })

  it('fuera de [0, 1] se queda en los extremos', () => {
    expect(easeInOutCubic(-1)).toBe(0)
    expect(easeInOutCubic(2)).toBe(1)
  })
})

describe('flightPose', () => {
  const flight = (elapsed: number): Flight => ({
    from: { position: [0, 0, 0], target: [0, 0, 0] },
    to: { position: [10, 0, 0], target: [0, 2, 0] },
    seconds: 1,
    elapsed,
  })

  it('interpola posición y objetivo con el easing', () => {
    expect(flightPose(flight(0.5))).toMatchObject({ position: [5, 0, 0], target: [0, 1, 0], done: false })
  })

  it('termina exactamente en el destino', () => {
    expect(flightPose(flight(1.3))).toEqual({ position: [10, 0, 0], target: [0, 2, 0], done: true })
  })
})
