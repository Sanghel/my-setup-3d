import { useLayoutEffect } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { SRGBColorSpace, type Mesh, type MeshStandardMaterial, type Texture } from 'three'
import lightmap from '../../public/models/lightmap.json'

export const ROOM_URL = '/models/room.glb'
export const LIGHTMAP_URL = '/models/lightmap.webp'

// useGLTF(url, useDraco, useMeshopt): el .glb usa meshopt (decodificador incluido en three-stdlib).
// Draco desactivado: no lo usamos y drei lo descargaría desde un CDN externo.
const USE_DRACO = false
const USE_MESHOPT = true

/**
 * El cuarto exportado desde Blender con su luz horneada (design D5).
 * lightMapIntensity = el factor con el que se escaló el lightmap al guardarlo en 8 bits.
 * Calibrado comparando con el render de Blender: con un × π extra (por el Lambert de three.js)
 * la web salía notablemente más clara que el render; sin él coinciden.
 */
export function Room() {
  const { scene } = useGLTF(ROOM_URL, USE_DRACO, USE_MESHOPT)
  const lightMap = useTexture(LIGHTMAP_URL, configureLightMap)

  useLayoutEffect(() => {
    scene.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh || !mesh.geometry.getAttribute('uv1')) return
      const material = mesh.material as MeshStandardMaterial
      material.lightMap = lightMap
      material.lightMapIntensity = lightmap.intensity
      material.needsUpdate = true
    })
  }, [scene, lightMap])

  return <primitive object={scene} />
}

function configureLightMap(texture: Texture) {
  texture.colorSpace = SRGBColorSpace // codificado en sRGB al hornear (más precisión en sombras)
  texture.flipY = false // misma convención que las texturas de glTF
  texture.channel = 1 // TEXCOORD_1 = UVMap_light
}

// Empieza a descargar apenas se importa el módulo, sin esperar al primer render
useGLTF.preload(ROOM_URL, USE_DRACO, USE_MESHOPT)
useTexture.preload(LIGHTMAP_URL)
