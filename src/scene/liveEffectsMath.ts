/**
 * Efectos vivos del mock (spec room-ambience: "Efectos vivos"), como funciones puras para testearlas:
 * - el LED rojo del poster "respira" de noche;
 * - el polvo flota en el haz de sol de tarde.
 * Con movimiento reducido, ambos quedan quietos.
 */

/** Respiración del LED: oscila suave entre `min` y 1 con un período de ~8 s (como el mock: sin(t·0,8)). */
export function breath(seconds: number, reducedMotion: boolean, min = 0.6): number {
  if (reducedMotion) return (1 + min) / 2 // intensidad fija a mitad de camino
  return min + (1 - min) * (0.5 + 0.5 * Math.sin(seconds * 0.8))
}

/** Opacidad del halo animado: solo de noche (uAmbience → 1), multiplicada por la respiración. */
export const ledGlowOpacity = (ambience: number, breathing: number, peak = 0.9) => peak * ambience * breathing

/** Opacidad del polvo: solo de tarde (uAmbience → 0). */
export const dustOpacity = (ambience: number, peak = 0.7) => peak * (1 - ambience)

/** Volumen del haz de sol donde flota el polvo, en metros (coordenadas de la web: x, y arriba, z = d). */
export interface DustBox {
  min: [number, number, number]
  max: [number, number, number]
}

/** Posiciones iniciales deterministas (misma semilla → mismo polvo en cada visita). */
export function seedDust(count: number, box: DustBox, seed = 11): Float32Array {
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++)
    for (let axis = 0; axis < 3; axis++)
      positions[i * 3 + axis] = box.min[axis] + rnd() * (box.max[axis] - box.min[axis])
  return positions
}

/**
 * Un paso del polvo: sube muy despacio con un vaivén propio por partícula y, al salir por arriba,
 * vuelve a entrar por abajo. Modifica `positions` en el lugar (sin crear basura por cuadro).
 */
export function stepDust(positions: Float32Array, box: DustBox, seconds: number, delta: number) {
  const rise = 0.006 * delta // ~6 mm por segundo
  for (let i = 0; i < positions.length / 3; i++) {
    const y = i * 3 + 1
    positions[y] += rise + Math.sin(seconds * 0.4 + i) * 0.015 * delta
    if (positions[y] > box.max[1]) positions[y] = box.min[1]
  }
}
