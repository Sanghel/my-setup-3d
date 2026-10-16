import { useLayoutEffect, useMemo, useRef } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { Color, Matrix4, type InstancedMesh } from 'three'
import { instancePositions, VOXEL_SIZE, type VoxelModel } from '../voxel/voxel'

type VoxelObjectProps = ThreeElements['group'] & { model: VoxelModel }

/**
 * Dibuja un VoxelModel como UN InstancedMesh: una geometría de cubo, un material
 * y N instancias con su propia posición y color → un solo draw call.
 */
export function VoxelObject({ model, ...groupProps }: VoxelObjectProps) {
  const ref = useRef<InstancedMesh>(null)
  const positions = useMemo(() => instancePositions(model.voxels), [model.voxels])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4()
    const colors = model.palette.map((hex) => new Color(hex))
    model.voxels.forEach((voxel, i) => {
      matrix.makeTranslation(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, colors[voxel[3]])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    // Sin esto, el raycasting (hover/click) usaría la esfera de un solo cubo
    mesh.computeBoundingSphere()
  }, [model, positions])

  return (
    <group {...groupProps}>
      {/* key: el número de instancias se fija al crear el mesh; si cambia, se recrea */}
      <instancedMesh
        key={model.voxels.length}
        ref={ref}
        args={[undefined, undefined, model.voxels.length]}
      >
        <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
        <meshStandardMaterial />
      </instancedMesh>
    </group>
  )
}
