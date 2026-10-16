import { box, type VoxelModel } from './voxel'

/** Modelo temporal de 10×10×10 con franjas diagonales de color (se borra en el grupo 4). */
export const TEST_MODEL: VoxelModel = {
  palette: ['#d63a2f', '#f2c14e', '#3a7bd5', '#f3e9e4'],
  voxels: box([0, 0, 0], [10, 10, 10], 0).map(([x, y, z]) => [x, y, z, (x + y + z) % 4]),
}
