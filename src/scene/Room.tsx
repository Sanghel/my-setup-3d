import { useLayoutEffect } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { SRGBColorSpace, type Mesh, type MeshStandardMaterial, type Texture } from 'three'
import lightmap from '../../public/models/lightmap.json'
import { ITEMS } from '../data/items'
import { useSceneStore } from '../state/sceneStore'
import { bindCatalog, itemIdOf } from './bindCatalog'
import { useCatalogRegistry } from './catalogRegistry'
import { useDimming } from './useDimming'

export const ROOM_URL = '/models/room.glb'
export const LIGHTMAP_URL = '/models/lightmap.webp'

// useGLTF(url, useDraco, useMeshopt): el .glb usa meshopt (decodificador incluido en three-stdlib).
// Draco desactivado: no lo usamos y drei lo descargaría desde un CDN externo.
const USE_DRACO = false
const USE_MESHOPT = true

/** Desplazamiento máximo (px) entre presionar y soltar para que cuente como click y no como arrastre. */
const DRAG_THRESHOLD_PX = 6

/**
 * El cuarto exportado desde Blender con su luz horneada (design D5).
 * three.js usa el lightmap como irradiancia y el difuso de Lambert la divide por π; el horneado
 * DIFFUSE de Blender ya viene listo para multiplicar el color: por eso intensidad = k × π.
 * (Verificado contra el render de Blender. Una primera calibración "sin π" parecía correcta solo
 * porque scene.environment sumaba luz difusa a todo; ver environmentTarget.ts y la nota 09.)
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
      material.lightMapIntensity = lightmap.intensity * Math.PI
      material.needsUpdate = true
    })
  }, [scene, lightMap])

  // Une el catálogo con la escena: las piezas de cada objeto quedan marcadas con su itemId
  const setRoots = useCatalogRegistry((s) => s.setRoots)
  useLayoutEffect(() => {
    const { roots, missing } = bindCatalog(scene, ITEMS)
    setRoots(roots)
    if (missing.length) console.warn('[Room] objetos del catálogo sin nodo en room.glb:', missing)
  }, [scene, setRoots])

  // En inspección el resto del cuarto se atenúa (después de unir el catálogo: necesita los itemId)
  useDimming(scene)
  useLayoutEffect(() => {
    if (import.meta.env.DEV) window.__room = scene // solo para inspeccionar desde la consola
  }, [scene])

  // Raycasting: R3F lanza un rayo desde la cámara por el puntero y entrega la malla más cercana.
  // Con stopPropagation solo cuenta esa; si es una pared o el piso (sin itemId), no hay hover.
  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    useSceneStore.getState().hover(itemIdOf(event.object) ?? null)
  }
  const onPointerOut = () => useSceneStore.getState().hover(null)

  // Click/tap: R3F mide en `delta` los píxeles recorridos entre presionar y soltar. Si se arrastró
  // (para orbitar la cámara) no es una selección, aunque se suelte sobre un objeto.
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > DRAG_THRESHOLD_PX) return
    const id = itemIdOf(event.object)
    const { mode, select } = useSceneStore.getState()
    // En inspección los demás objetos no reaccionan; para cambiar de objeto está la lista (grupo 11)
    if (id && mode === 'overview') select(id)
  }

  return (
    <primitive object={scene} onPointerMove={onPointerMove} onPointerOut={onPointerOut} onClick={onClick} />
  )
}

function configureLightMap(texture: Texture) {
  texture.colorSpace = SRGBColorSpace // codificado en sRGB al hornear (más precisión en sombras)
  texture.flipY = false // misma convención que las texturas de glTF
  texture.channel = 1 // TEXCOORD_1 = UVMap_light
}

// Empieza a descargar apenas se importa el módulo, sin esperar al primer render
useGLTF.preload(ROOM_URL, USE_DRACO, USE_MESHOPT)
useTexture.preload(LIGHTMAP_URL)
