import { useGLTF } from '@react-three/drei'

export const ROOM_URL = '/models/room.glb'

// useGLTF(url, useDraco, useMeshopt): el .glb usa meshopt (decodificador incluido en three-stdlib).
// Draco desactivado: no lo usamos y drei lo descargaría desde un CDN externo.
const USE_DRACO = false
const USE_MESHOPT = true

/** El cuarto exportado desde Blender (`npm run assets`). */
export function Room() {
  const { scene } = useGLTF(ROOM_URL, USE_DRACO, USE_MESHOPT)
  return <primitive object={scene} />
}

// Empieza a descargar el .glb apenas se importa el módulo, sin esperar al primer render
useGLTF.preload(ROOM_URL, USE_DRACO, USE_MESHOPT)
