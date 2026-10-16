import { makeDesk } from '../voxel/models/desk'
import { makeUltrawide } from '../voxel/models/ultrawide'
import { makeVerticalMonitor } from '../voxel/models/verticalMonitor'
import {
  DESK_POSITION,
  ULTRAWIDE_POSITION,
  VERTICAL_MONITOR_POSITION,
  VERTICAL_MONITOR_ROTATION,
} from './layout'
import { VoxelObject } from './VoxelObject'

const DESK_MODEL = makeDesk()
const ULTRAWIDE_MODEL = makeUltrawide()
const VERTICAL_MONITOR_MODEL = makeVerticalMonitor()

export function Setup() {
  return (
    <group name="setup">
      <VoxelObject model={DESK_MODEL} position={DESK_POSITION} />
      <VoxelObject model={ULTRAWIDE_MODEL} position={ULTRAWIDE_POSITION} />
      <VoxelObject
        model={VERTICAL_MONITOR_MODEL}
        position={VERTICAL_MONITOR_POSITION}
        rotation={VERTICAL_MONITOR_ROTATION}
      />
    </group>
  )
}
