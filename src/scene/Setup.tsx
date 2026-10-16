import { makeDesk } from '../voxel/models/desk'
import { makeUltrawide } from '../voxel/models/ultrawide'
import { DESK_POSITION, ULTRAWIDE_POSITION } from './layout'
import { VoxelObject } from './VoxelObject'

const DESK_MODEL = makeDesk()
const ULTRAWIDE_MODEL = makeUltrawide()

export function Setup() {
  return (
    <group name="setup">
      <VoxelObject model={DESK_MODEL} position={DESK_POSITION} />
      <VoxelObject model={ULTRAWIDE_MODEL} position={ULTRAWIDE_POSITION} />
    </group>
  )
}
