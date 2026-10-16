/**
 * Placeholder temporal con la escala aproximada del cuarto (2,6 × 3,2 m) y del escritorio.
 * Se reemplaza por <Room> (room.glb) en la tarea 4.3.
 */
export function Placeholder() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.3, 0, 1.6]}>
        <planeGeometry args={[2.6, 3.2]} />
        <meshStandardMaterial color="#3a302c" />
      </mesh>
      <mesh position={[1.7, 0.38, 0.3]}>
        <boxGeometry args={[1.4, 0.76, 0.6]} />
        <meshStandardMaterial color="#1b1b1e" />
      </mesh>
    </group>
  )
}
