/** Lado de un voxel en metros: 1 voxel = 2 cm. */
export const VOXEL_SIZE = 0.02

export type Vec3 = readonly [x: number, y: number, z: number]

/** Un voxel: posición entera en la grilla + índice de color en la paleta. */
export type Voxel = readonly [x: number, y: number, z: number, color: number]

/**
 * Un objeto voxel como datos puros. Da igual si viene de un generador en código
 * o (más adelante) de un archivo .vox de MagicaVoxel: el renderer solo ve esto.
 */
export interface VoxelModel {
  palette: readonly string[]
  voxels: readonly Voxel[]
}

export interface Bounds {
  min: Vec3
  max: Vec3
  /** Tamaño en voxeles (max - min + 1 por eje). */
  size: Vec3
}

/** Caja sólida de `size` voxeles con la esquina mínima en `from`. */
export function box(from: Vec3, size: Vec3, color: number): Voxel[] {
  const [x0, y0, z0] = from
  const [w, h, d] = size
  const voxels: Voxel[] = []
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      for (let z = 0; z < d; z++) {
        voxels.push([x0 + x, y0 + y, z0 + z, color])
      }
    }
  }
  return voxels
}

const key = (x: number, y: number, z: number) => `${x},${y},${z}`

/** Une listas de voxeles; si dos ocupan la misma celda, gana el de la lista posterior. */
export function merge(...lists: readonly (readonly Voxel[])[]): Voxel[] {
  const cells = new Map<string, Voxel>()
  for (const list of lists) {
    for (const voxel of list) cells.set(key(voxel[0], voxel[1], voxel[2]), voxel)
  }
  return [...cells.values()]
}

export function bounds(voxels: readonly Voxel[]): Bounds {
  if (voxels.length === 0) throw new Error('bounds() de un modelo vacío')
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const voxel of voxels) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], voxel[axis])
      max[axis] = Math.max(max[axis], voxel[axis])
    }
  }
  return {
    min: [min[0], min[1], min[2]],
    max: [max[0], max[1], max[2]],
    size: [max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1],
  }
}

export const toMeters = (voxels: number) => voxels * VOXEL_SIZE

/**
 * Centro de cada cubo en metros, como [x0, y0, z0, x1, y1, z1, ...].
 * Por defecto el modelo queda centrado en X/Z y con la base apoyada en y = 0, así
 * colocarlo en la escena es "ponerlo en el piso/escritorio en tal punto".
 * Con `center: false` se usan las coordenadas de la grilla tal cual (estructura del cuarto).
 */
export function instancePositions(
  voxels: readonly Voxel[],
  { center = true }: { center?: boolean } = {},
): Float32Array {
  let offsetX = 0
  let offsetY = 0
  let offsetZ = 0
  if (center) {
    const { min, size } = bounds(voxels)
    offsetX = min[0] + size[0] / 2
    offsetY = min[1]
    offsetZ = min[2] + size[2] / 2
  }
  const positions = new Float32Array(voxels.length * 3)
  voxels.forEach(([x, y, z], i) => {
    // +0.5: la posición de un cubo es su centro, no su esquina
    positions[i * 3] = (x - offsetX + 0.5) * VOXEL_SIZE
    positions[i * 3 + 1] = (y - offsetY + 0.5) * VOXEL_SIZE
    positions[i * 3 + 2] = (z - offsetZ + 0.5) * VOXEL_SIZE
  })
  return positions
}

/**
 * Segmento de voxeles entre `from` y `to` (ambos incluidos): un voxel por paso del eje
 * más largo, redondeando los otros dos. `thickness` lo engruesa como una caja por punto.
 */
export function line(from: Vec3, to: Vec3, color: number, thickness: Vec3 = [1, 1, 1]): Voxel[] {
  const steps = Math.max(...[0, 1, 2].map((axis) => Math.abs(to[axis] - from[axis])))
  const parts: Voxel[][] = []
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps
    const point: Vec3 = [
      Math.round(from[0] + (to[0] - from[0]) * t),
      Math.round(from[1] + (to[1] - from[1]) * t),
      Math.round(from[2] + (to[2] - from[2]) * t),
    ]
    parts.push(box(point, thickness, color))
  }
  return merge(...parts)
}

/**
 * Número pseudoaleatorio en [0, 1) a partir de una celda: siempre el mismo para la misma
 * (x, y, z). Sirve para variar colores (piso, techo popcorn) sin que cambien en cada carga.
 */
export function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
