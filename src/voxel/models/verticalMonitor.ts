import { VERTICAL_MONITOR, vox } from '../dimensions'
import { box, hash3, line, merge, type Voxel, type VoxelModel } from '../voxel'

export const VERTICAL_COLORS = {
  casing: 0,
  arm: 1,
  editor: 2,
  // 3..6: colores de "sintaxis" de las líneas de código
  syntaxFirst: 3,
  syntaxCount: 4,
} as const

/**
 * Pantalla del editor: cada fila es una "línea de código" con sangría y largo
 * pseudoaleatorios (hash3, siempre iguales), y alguna fila vacía entre bloques.
 */
function codeColor(column: number, row: number, width: number): number {
  const { editor, syntaxFirst, syntaxCount } = VERTICAL_COLORS
  if (row % 2 === 1 || column === 0 || column === width - 1) return editor // interlineado y márgenes
  const lineNumber = row / 2
  if (hash3(lineNumber, 1, 7) < 0.15) return editor // línea en blanco
  const indent = 1 + Math.floor(hash3(lineNumber, 2, 7) * 4)
  const length = 3 + Math.floor(hash3(lineNumber, 3, 7) * (width - indent - 4))
  if (column < indent || column >= indent + length) return editor
  // los tokens cambian de color cada pocos caracteres
  const token = Math.floor((column - indent) / 3)
  return syntaxFirst + Math.floor(hash3(lineNumber, token, 9) * syntaxCount)
}

/**
 * Monitor girado en vertical, sostenido por un brazo de gas que sale de una abrazadera
 * en el borde izquierdo del escritorio. Pantalla mirando hacia +z; base en y = 0.
 */
export function makeVerticalMonitor(): VoxelModel {
  const W = vox(VERTICAL_MONITOR.width)
  const H = vox(VERTICAL_MONITOR.height)
  const lift = vox(VERTICAL_MONITOR.lift)
  const { casing, arm } = VERTICAL_COLORS

  const panel: Voxel[] = []
  for (let column = 0; column < W; column++) {
    for (let row = 0; row < H; row++) {
      // row 0 = arriba de la pantalla, para que el código se lea de arriba a abajo
      const y = lift + H - 1 - row
      panel.push([column, y, 0, codeColor(column, row, W)], [column, y, -1, casing])
    }
  }

  // Brazo: abrazadera atrás a la izquierda → poste → dos segmentos → placa VESA
  const poleX = 0
  const poleZ = -9
  const elbowY = lift + Math.floor(H / 2) - 4
  const vesa: [number, number, number] = [Math.floor(W / 2) - 2, lift + Math.floor(H / 2) - 2, -2]
  const armVoxels = merge(
    box([poleX - 1, 0, poleZ - 1], [4, 1, 4], arm), // abrazadera sobre el escritorio
    box([poleX, 0, poleZ], [2, elbowY, 2], arm), // poste
    line([poleX, elbowY, poleZ], [poleX + 7, elbowY + 2, poleZ + 3], arm, [2, 2, 2]),
    line([poleX + 7, elbowY + 2, poleZ + 3], [vesa[0], vesa[1], vesa[2] - 2], arm, [2, 2, 2]),
    box(vesa, [4, 4, 1], arm), // placa VESA pegada a la parte trasera
  )

  return {
    palette: ['#141418', '#24242a', '#1d2026', '#7fd1b9', '#c792ea', '#82aaff', '#f3e9e4'],
    voxels: merge(armVoxels, panel),
  }
}
