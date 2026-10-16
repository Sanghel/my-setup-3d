import { ULTRAWIDE, vox } from '../dimensions'
import { box, merge, type Voxel, type VoxelModel } from '../voxel'

export const ULTRAWIDE_COLORS = {
  casing: 0,
  stand: 1,
  // 2..6: bandas del wallpaper (ondas rosa/azul/morado como el fondo de macOS de las fotos)
  wallpaperFirst: 2,
  wallpaperCount: 5,
} as const

/**
 * Cuánto se adelanta (en voxeles) cada columna de una pantalla curva de radio R.
 * Es la "flecha" de un arco: z = R - sqrt(R² - x²), con x medido desde el centro.
 * En el centro vale 0; en los bordes crece → los bordes quedan más cerca del usuario.
 */
export function curveOffset(column: number, width: number, radius: number): number {
  const x = column - (width - 1) / 2
  return Math.round(radius - Math.sqrt(radius * radius - x * x))
}

/** Color del wallpaper en (columna, fila): bandas diagonales onduladas. */
function wallpaperColor(column: number, row: number, width: number, height: number): number {
  const wave = Math.sin((column / width) * Math.PI * 2.2) * 0.18
  const t = row / height + wave + (column / width) * 0.35
  const band = Math.floor(((t % 1) + 1) % 1 * ULTRAWIDE_COLORS.wallpaperCount)
  return ULTRAWIDE_COLORS.wallpaperFirst + band
}

/**
 * Monitor ultrawide curvo sobre su base. El frente de la pantalla mira hacia +z.
 * Origen de la grilla: base apoyada en y = 0 (la superficie del escritorio).
 */
export function makeUltrawide(): VoxelModel {
  const W = vox(ULTRAWIDE.width)
  const H = vox(ULTRAWIDE.height)
  const R = vox(ULTRAWIDE.radius)
  const lift = vox(ULTRAWIDE.lift)
  const { casing, stand } = ULTRAWIDE_COLORS

  const screen: Voxel[] = []
  for (let column = 0; column < W; column++) {
    const z = curveOffset(column, W, R)
    for (let row = 0; row < H; row++) {
      const y = lift + row
      // la fila inferior es el "mentón" del monitor
      const front = row === 0 ? casing : wallpaperColor(column, row, W, H)
      screen.push([column, y, z, front], [column, y, z - 1, casing])
    }
  }

  const center = Math.floor(W / 2) - 1
  const standVoxels = merge(
    // cuello vertical detrás del centro de la pantalla
    box([center, 0, -4], [2, lift + Math.floor(H / 2), 2], stand),
    // pie ancho y plano sobre el escritorio
    box([center - 7, 0, -8], [16, 1, 8], stand),
    // soporte que se ancla a la parte trasera de la pantalla
    box([center - 3, lift + 4, -3], [8, 8, 1], stand),
  )

  return {
    palette: ['#141418', '#1f1f24', '#3b2c91', '#6a4fd6', '#d9559c', '#ff7d6b', '#2f6fd9'],
    voxels: merge(standVoxels, screen),
  }
}
