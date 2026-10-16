import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

/** Cubo de prueba temporal: se reemplaza por el cuarto voxel en el grupo 4. */
export function TestCube() {
  const ref = useRef<Mesh>(null)

  // useFrame corre en cada cuadro del render loop; delta = segundos desde el cuadro anterior
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5
  })

  return (
    <mesh ref={ref} position={[0, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#d63a2f" />
    </mesh>
  )
}
