import { makeBackWall, makeCeiling, makeFloor, makeSideWall } from '../voxel/models/room'
import { VoxelObject } from './VoxelObject'

// Los generadores son deterministas: basta con calcularlos una vez al cargar el módulo
const SHELL = [makeFloor(), makeBackWall(), makeSideWall(), makeCeiling()]

/** Estructura del cuarto (no seleccionable). */
export function Room() {
  return (
    <group name="room-shell">
      {SHELL.map((model, i) => (
        <VoxelObject key={i} model={model} center={false} />
      ))}
    </group>
  )
}
