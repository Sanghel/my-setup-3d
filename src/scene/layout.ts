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
