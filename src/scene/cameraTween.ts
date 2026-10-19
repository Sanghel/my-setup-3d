/**
 * Vuelos de cámara con el easing del mock (redesign D6): easeInOutCubic, que arranca y frena suave.
 * Funciones puras: el componente (CameraRig) solo las aplica cuadro a cuadro.
 */
export type Vec3 = [number, number, number]

/** Duraciones del mock (segundos): al inspeccionar y al volver a la vista general. */
export const FLY_IN_SECONDS = 1.05
export const FLY_OUT_SECONDS = 1.2

/** easeInOutCubic: acelera la primera mitad y frena la segunda; t y el resultado en [0, 1]. */
export function easeInOutCubic(t: number): number {
  const k = Math.min(1, Math.max(0, t))
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2
}

const lerp3 = (a: Vec3, b: Vec3, e: number): Vec3 => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e]

export interface Flight {
  from: { position: Vec3; target: Vec3 }
  to: { position: Vec3; target: Vec3 }
  seconds: number
  elapsed: number
}

/** Pose de la cámara en un instante del vuelo y si ya terminó. */
export function flightPose(flight: Flight): { position: Vec3; target: Vec3; done: boolean } {
  const e = easeInOutCubic(flight.elapsed / flight.seconds)
  return {
    position: lerp3(flight.from.position, flight.to.position, e),
    target: lerp3(flight.from.target, flight.to.target, e),
    done: flight.elapsed >= flight.seconds,
  }
}
