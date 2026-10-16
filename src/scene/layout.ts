import { DESK, ROOM } from '../voxel/dimensions'

/*
 * Dónde va cada objeto, en metros. Temporal: en el grupo 5 esto pasa al catálogo de objetos.
 */

type Vec3 = [number, number, number]
const cm = (v: number) => v / 100

export const DESK_TOP = cm(DESK.height)

export const DESK_POSITION: Vec3 = [
  cm(ROOM.width - DESK.gapToCorner - DESK.width / 2),
  0,
  cm(DESK.depth / 2),
]

export const ULTRAWIDE_POSITION: Vec3 = [DESK_POSITION[0] + 0.08, DESK_TOP, 0.16]

/** A la izquierda del ultrawide, girado hacia el usuario como en las fotos. */
export const VERTICAL_MONITOR_POSITION: Vec3 = [DESK_POSITION[0] - 0.6, DESK_TOP, 0.25]
export const VERTICAL_MONITOR_ROTATION: Vec3 = [0, 0.45, 0]
