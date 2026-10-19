import { useFrame } from '@react-three/fiber'
import { Box3, Vector3 } from 'three'
import { itemById } from '../data/items'
import { hotspotElements } from '../ui/hotspotElements'
import { useCatalogRegistry } from './catalogRegistry'

const anchors = new Map<string, Vector3>() // los objetos no se mueven: el ancla se calcula una vez
const projected = new Vector3()

/** Ancla del punto: centro superior de la caja del objeto, más el ajuste opcional del catálogo. */
function anchorOf(id: string): Vector3 | undefined {
  const cached = anchors.get(id)
  if (cached) return cached
  const root = useCatalogRegistry.getState().roots.get(id)
  if (!root) return undefined
  const box = new Box3().setFromObject(root)
  const offset = itemById(id)?.anchorOffset ?? [0, 0, 0]
  const anchor = new Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2).add(
    new Vector3(...offset),
  )
  anchors.set(id, anchor)
  return anchor
}

/**
 * Desde el canvas, mueve cada punto de interés a la proyección en pantalla de su ancla
 * (mundo 3D → coordenadas normalizadas −1..1 → píxeles). Detrás de la cámara se ocultan.
 */
export function HotspotProbe() {
  useFrame(({ camera, size }) => {
    for (const [id, element] of hotspotElements) {
      const anchor = anchorOf(id)
      if (!anchor) continue
      projected.copy(anchor).project(camera)
      const x = ((projected.x + 1) / 2) * size.width
      const y = ((1 - projected.y) / 2) * size.height
      element.style.transform = `translate(${x}px, ${y}px)`
      element.style.visibility = projected.z < 1 ? 'visible' : 'hidden'
    }
  })
  return null
}
