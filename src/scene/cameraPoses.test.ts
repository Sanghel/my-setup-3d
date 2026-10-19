import { describe, expect, it } from 'vitest'
import { inspectionPose } from './cameraPoses'

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

describe('inspectionPose', () => {
  it('apunta al centro del objeto y se aleja lo justo para que quepa en pantalla', () => {
    const pose = inspectionPose([1, 1, 1], 0.5, { azimuth: 0, polar: 90 }, 28, 16 / 9)
    expect(pose.target).toEqual([1, 1, 1])
    // esfera de radio 0,5 en un campo vertical de 28°: d = r / sin(14°) × 1,08
    expect(dist(pose.position, pose.target)).toBeCloseTo((0.5 / Math.sin((14 * Math.PI) / 180)) * 1.08, 5)
  })

  it('azimut 0 y polar 90 = de frente (+z) y a la altura del objeto', () => {
    const { position } = inspectionPose([0, 1, 0], 0.5, { azimuth: 0, polar: 90 }, 28, 1)
    expect(position[0]).toBeCloseTo(0)
    expect(position[1]).toBeCloseTo(1)
    expect(position[2]).toBeGreaterThan(0)
  })

  it('azimut -90 = desde -x (Scholes, en la pared lateral)', () => {
    const { position } = inspectionPose([1.8, 1.7, 2], 0.6, { azimuth: -90, polar: 90 }, 28, 1)
    expect(position[0]).toBeLessThan(1.8)
    expect(position[2]).toBeCloseTo(2)
  })

  it('en una pantalla vertical se aleja más (manda el campo horizontal, más estrecho)', () => {
    const wide = inspectionPose([0, 0, 0], 0.5, { azimuth: 0, polar: 90 }, 28, 16 / 9)
    const tall = inspectionPose([0, 0, 0], 0.5, { azimuth: 0, polar: 90 }, 28, 9 / 16)
    expect(dist(tall.position, tall.target)).toBeGreaterThan(dist(wide.position, wide.target))
  })

  it('el zoom mínimo nunca atraviesa el objeto', () => {
    const pose = inspectionPose([0, 0, 0], 0.5, { azimuth: 0, polar: 90 }, 28, 1)
    expect(pose.minDistance).toBeGreaterThan(0.5)
  })
})
