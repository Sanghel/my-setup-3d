import { ROOM } from '../voxel/dimensions'

const cm = (v: number) => v / 100

/**
 * Iluminación base cálida (modo "día"). Los modos con LED rojo llegan en otro change.
 * - hemisphere: relleno que depende de hacia dónde mira cada cara (techo vs piso)
 * - directional: luz principal, define el sombreado de las caras de los voxeles
 * - point: lámpara de techo, evita que la esquina quede en penumbra
 */
export function Lights() {
  return (
    <>
      <hemisphereLight args={['#ffe6cf', '#4a3a33', 1.1]} />
      <ambientLight intensity={0.15} color="#fff1e4" />
      <directionalLight position={[0.3, 2.3, 2.8]} intensity={1.5} color="#ffe2c4" />
      <pointLight
        position={[cm(ROOM.width / 2), cm(ROOM.height) - 0.25, cm(ROOM.depth / 2)]}
        intensity={2.2}
        distance={6}
        decay={1.6}
        color="#ffd9b0"
      />
    </>
  )
}
