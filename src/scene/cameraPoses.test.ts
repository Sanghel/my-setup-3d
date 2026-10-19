import { describe, expect, it } from 'vitest'
import {
  inspectionPose,
  OVERVIEW_POSITION,
  OVERVIEW_REFERENCE_ASPECT,
  OVERVIEW_TARGET,
  inspectionLayout,
  overviewPosition,
} from './cameraPoses'

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

describe('vista general según el aspecto', () => {
  const base = dist(OVERVIEW_POSITION, OVERVIEW_TARGET)

  it('en pantallas anchas usa la posición de referencia (nunca acerca)', () => {
    expect(overviewPosition(16 / 9)).toEqual(OVERVIEW_POSITION)
    expect(overviewPosition(OVERVIEW_REFERENCE_ASPECT)).toEqual(OVERVIEW_POSITION)
  })

  it('en un celular vertical se aleja en proporción al aspecto, en la misma dirección', () => {
    const aspect = 390 / 844
    const position = overviewPosition(aspect)
    expect(dist(position, OVERVIEW_TARGET)).toBeCloseTo(base * (OVERVIEW_REFERENCE_ASPECT / aspect), 5)
    const dir = (p: number[]) => p.map((v, i) => (v - OVERVIEW_TARGET[i]) / dist(p, OVERVIEW_TARGET))
    dir(position).forEach((v, i) => expect(v).toBeCloseTo(dir(OVERVIEW_POSITION)[i], 6))
  })
})

describe('inspectionLayout (dónde queda el objeto con el panel abierto)', () => {
  const halfHeight = (fov: number) => Math.tan(((fov / 2) * Math.PI) / 180)

  it('pantalla ancha: la imagen se corre 16 % a la izquierda y el encuadre usa el 68 % del ancho', () => {
    const layout = inspectionLayout(30, 1500, 800)
    expect(layout.offset).toEqual({ x: 240, y: 0 })
    expect(layout.fovDeg).toBe(30)
    expect(layout.aspect).toBeCloseTo((1500 / 800) * 0.68, 6)
  })

  it('celular: la imagen sube media hoja y el encuadre usa la parte de arriba', () => {
    const layout = inspectionLayout(30, 390, 844)
    expect(layout.offset.x).toBe(0)
    expect(layout.offset.y).toBeCloseTo((0.46 / 2) * 844, 6)
    expect(halfHeight(layout.fovDeg)).toBeCloseTo(halfHeight(30) * 0.54, 6)
    expect(layout.aspect).toBeCloseTo(390 / 844 / 0.54, 6)
  })

  it('tablet (641–820 px): sin desplazamiento', () => {
    expect(inspectionLayout(30, 800, 1000)).toEqual({ offset: { x: 0, y: 0 }, fovDeg: 30, aspect: 0.8 })
  })
})

describe('vista general del mock (redesign D6)', () => {
  const [dx, dy, dz] = OVERVIEW_POSITION.map((p, i) => p - OVERVIEW_TARGET[i])
  const distance = Math.hypot(dx, dy, dz)
  const degrees = (rad: number) => (rad * 180) / Math.PI

  it('mira desde el ángulo del mock: azimut ≈ −39°, polar ≈ 67°', () => {
    expect(degrees(Math.atan2(dx, dz))).toBeCloseTo(-38.9, 0)
    expect(degrees(Math.acos(dy / distance))).toBeCloseTo(66.8, 0)
  })

  it('la pose inicial cae dentro de los límites de la vista general', () => {
    expect(degrees(Math.acos(dy / distance))).toBeGreaterThanOrEqual(35)
    expect(degrees(Math.acos(dy / distance))).toBeLessThanOrEqual(80)
    expect(distance).toBeGreaterThanOrEqual(3.5)
    expect(distance).toBeLessThanOrEqual(12)
  })
})
