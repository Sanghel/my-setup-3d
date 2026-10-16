import { makeDesk } from '../voxel/models/desk'
import { DESK_POSITION } from './layout'
import { VoxelObject } from './VoxelObject'

const DESK_MODEL = makeDesk()

export function Setup() {
  return (
    <group name="setup">
      <VoxelObject model={DESK_MODEL} position={DESK_POSITION} />
    </group>
  )
}
