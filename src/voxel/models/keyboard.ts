import { KEYBOARD, vox } from '../dimensions'
import { box, merge, type Voxel, type VoxelModel } from '../voxel'

export const KEYBOARD_COLORS = { body: 0, key: 1, accent: 2, space: 3, keyAlt: 4 } as const
export const KEY_ROWS = 5

/**
 * Teclado 65 % low-profile: una carcasa de 1 voxel de alto y, encima, una grilla de
 * teclas donde cada voxel es una tecla (2 cm ≈ una tecla real). Filas hacia +z (hacia el usuario).
 */
export function makeKeyboard(): VoxelModel {
  const W = vox(KEYBOARD.width)
  const D = vox(KEYBOARD.depth)
  const { body, key, accent, space, keyAlt } = KEYBOARD_COLORS
  const firstRow = D - KEY_ROWS // la fila de atrás queda como borde de la carcasa
  const cols = W - 1

  const keys: Voxel[] = []
  for (let row = 0; row < KEY_ROWS; row++) {
    for (let column = 0; column < cols; column++) {
      const isSpaceRow = row === KEY_ROWS - 1
      const isSpace = isSpaceRow && column >= 4 && column <= cols - 5
      // Esc, Enter y flechas un poco más oscuras, como en los teclados con keycaps de acento
      const isAccent = (row === 0 && column === 0) || (row === 2 && column === cols - 2) || column === cols - 1
      // damero de dos tonos casi iguales: deja ver cada tecla sin dibujar separaciones
      const plain = (row + column) % 2 === 0 ? key : keyAlt
      const color = isSpace ? space : isAccent ? accent : plain
      keys.push([column, 1, firstRow + row, color])
    }
  }

  return {
    palette: ['#1c1d22', '#cfd5e2', '#8e97ab', '#e6eaf2', '#b4bccc'],
    voxels: merge(box([0, 0, 0], [W, 1, D], body), keys),
  }
}
