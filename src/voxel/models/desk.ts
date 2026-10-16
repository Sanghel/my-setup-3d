import { DESK, DESK_MAT, vox } from '../dimensions'
import { box, line, merge, type VoxelModel } from '../voxel'

export const DESK_COLORS = { top: 0, frame: 1, mat: 2, matLine: 3 } as const

/**
 * Escritorio negro con patas en X a cada lado (la X se ve de perfil, en el plano Y-Z),
 * y el desk mat "pintado" sobre la superficie.
 */
export function makeDesk(): VoxelModel {
  const W = vox(DESK.width)
  const D = vox(DESK.depth)
  const H = vox(DESK.height)
  const legTop = H - 2 // la X llega justo debajo del tablero
  const { top, frame, mat, matLine } = DESK_COLORS

  // Una X de perfil en la posición x, con 2 voxeles de grosor
  const xLeg = (x: number) =>
    merge(
      line([x, 0, 1], [x, legTop, D - 3], frame, [2, 1, 2]),
      line([x, 0, D - 3], [x, legTop, 1], frame, [2, 1, 2]),
      // travesaño bajo el tablero que une los extremos de la X
      box([x, legTop, 1], [2, 1, D - 2], frame),
    )

  // Desk mat: ocupa una franja de la superficie, centrado y hacia el frente
  const matW = vox(DESK_MAT.width)
  const matD = vox(DESK_MAT.depth)
  const matX = Math.round((W - matW) / 2) + 4
  const matZ = D - matD - 1
  const matVoxels = box([matX, H - 1, matZ], [matW, 1, matD], mat)
  // un par de líneas tenues que sugieren el texto "ENGINEERS" / código del mat
  const matDetails = merge(
    line([matX + 3, H - 1, matZ + matD - 3], [matX + matW - 4, H - 1, matZ + matD - 3], matLine),
    line([matX + 3, H - 1, matZ + 2], [matX + 12, H - 1, matZ + 2], matLine),
    line([matX + 3, H - 1, matZ + 4], [matX + 9, H - 1, matZ + 4], matLine),
  )

  return {
    palette: ['#1b1b1e', '#111113', '#232327', '#4a4a52'],
    voxels: merge(
      xLeg(2),
      xLeg(W - 4),
      // larguero trasero entre las dos X, para que se vea estable
      box([2, legTop - 4, 1], [W - 4, 2, 1], frame),
      box([0, H - 1, 0], [W, 1, D], top),
      matVoxels,
      matDetails,
    ),
  }
}
