import { VOXEL_SIZE } from './voxel'

/**
 * Medidas del cuarto y del setup en CENTÍMETROS, estimadas a partir de fotos.
 * Ajustar aquí con medidas reales no requiere tocar ningún generador.
 *
 * Sistema de coordenadas del cuarto (vista desde arriba):
 *
 *   z=0  +----------------------------+  <- pared del fondo (escritorio, poster, camiseta)
 *        |                  [desk]    |
 *        |                            |  <- pared lateral (x = ROOM.width): pegboard, ventana
 *        |                            |
 *   z    v      cámara mirando hacia la esquina
 *        x --->
 */
export const ROOM = { width: 260, depth: 320, height: 240 }

/** Hueco de la ventana en la pared lateral, medido desde la esquina. */
export const WINDOW = { fromCorner: 70, width: 100, sill: 95, height: 115 }

export const DESK = { width: 140, depth: 60, height: 76, gapToCorner: 20 }
export const DESK_MAT = { width: 90, depth: 40 }

/** Ultrawide 34" curvo (1800R). `lift` = altura del borde inferior de la pantalla sobre el escritorio. */
export const ULTRAWIDE = { width: 80, height: 34, radius: 180, lift: 12 }

/** Monitor en vertical (pantalla girada), sostenido por un brazo de gas. */
export const VERTICAL_MONITOR = { width: 34, height: 60, lift: 16 }

/** Teclado 65 % low-profile. */
export const KEYBOARD = { width: 32, depth: 11 }

/** Centímetros → voxeles (redondeado a la grilla). */
export const vox = (centimeters: number) => Math.round(centimeters / (VOXEL_SIZE * 100))
