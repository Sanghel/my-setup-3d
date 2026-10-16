import { ROOM, vox, WINDOW } from '../dimensions'
import { box, hash3, type Voxel, type VoxelModel } from '../voxel'

/*
 * Estructura del cuarto en coordenadas de grilla (no se centra): piso bajo y = 0,
 * pared del fondo detrás de z = 0, pared lateral en x = ancho, techo sobre la altura.
 * Paredes de 1 voxel de grosor; los dos lados abiertos dejan pasar la cámara (vista "casa de muñecas").
 */

const W = vox(ROOM.width)
const D = vox(ROOM.depth)
const H = vox(ROOM.height)

/** Pinta cada voxel con una de las variantes de color de la paleta según un hash de su celda. */
function speckle(voxels: Voxel[], shades: number): Voxel[] {
  return voxels.map(([x, y, z]) => [x, y, z, Math.floor(hash3(x, y, z) * shades)])
}

export function makeFloor(): VoxelModel {
  return {
    // piso de baldosa clara, con variación leve
    palette: ['#cfc3b6', '#c7baac', '#d6cbbf'],
    voxels: speckle(box([0, -1, 0], [W, 1, D], 0), 3),
  }
}

export function makeBackWall(): VoxelModel {
  return {
    palette: ['#efe4da', '#ebdfd4', '#f2e8df'],
    voxels: speckle(box([0, 0, -1], [W, H, 1], 0), 3),
  }
}

/** Pared lateral con el hueco de la ventana. */
export function makeSideWall(): VoxelModel {
  const x0 = vox(WINDOW.fromCorner)
  const x1 = x0 + vox(WINDOW.width)
  const y0 = vox(WINDOW.sill)
  const y1 = y0 + vox(WINDOW.height)
  const wall = box([W, 0, 0], [1, H, D], 0).filter(
    ([, y, z]) => !(z >= x0 && z < x1 && y >= y0 && y < y1),
  )
  return { palette: ['#efe4da', '#ebdfd4', '#f2e8df'], voxels: speckle(wall, 3) }
}

/** Techo con textura "popcorn": más variación que las paredes. */
export function makeCeiling(): VoxelModel {
  return {
    palette: ['#f1e9e1', '#e2d8ce', '#f7f1eb', '#d9cfc5'],
    voxels: speckle(box([0, H, 0], [W, 1, D], 0), 4),
  }
}

export const ROOM_VOXELS = { width: W, depth: D, height: H }
export const WINDOW_VOXELS = {
  fromCorner: vox(WINDOW.fromCorner),
  width: vox(WINDOW.width),
  sill: vox(WINDOW.sill),
  height: vox(WINDOW.height),
}
