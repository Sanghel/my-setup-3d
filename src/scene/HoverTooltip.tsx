import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box3, Vector3 } from 'three'
import { itemById } from '../data/items'
import { useSceneStore } from '../state/sceneStore'
import { useCatalogRegistry } from './catalogRegistry'

/*
 * Tooltip con el nombre del objeto bajo el puntero. Es DOM normal fuera del canvas (<HoverTooltip>):
 * <Html> de drei deja su contenedor vacío con React 19 + StrictMode (nota 03).
 * Desde dentro del canvas, <TooltipProbe> proyecta cada cuadro el punto superior central del objeto
 * a coordenadas de pantalla y mueve la etiqueta, sin re-renderizar React.
 */

let label: HTMLDivElement | null = null

export function HoverTooltip() {
  return (
    <div
      className="hover-tooltip"
      role="tooltip"
      ref={(el) => {
        label = el
      }}
    />
  )
}

const box = new Box3()
const anchor = new Vector3()
const boxes = new Map<string, Box3>() // los objetos no se mueven: la caja se calcula una vez

export function TooltipProbe() {
  const lastId = useRef<string | null>(null)

  useFrame(({ camera, size }) => {
    if (!label) return
    const { hoveredId, mode } = useSceneStore.getState()
    const root = hoveredId ? useCatalogRegistry.getState().roots.get(hoveredId) : undefined
    if (mode !== 'overview' || !hoveredId || !root) {
      label.style.opacity = '0'
      lastId.current = null
      return
    }
    if (lastId.current !== hoveredId) {
      label.textContent = itemById(hoveredId)?.name ?? ''
      lastId.current = hoveredId
    }
    if (!boxes.has(hoveredId)) boxes.set(hoveredId, box.clone().setFromObject(root))
    const b = boxes.get(hoveredId)!
    anchor.set((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2)
    // Proyección: del mundo 3D a coordenadas normalizadas (-1..1) y de ahí a píxeles
    anchor.project(camera)
    const x = ((anchor.x + 1) / 2) * size.width
    const y = ((1 - anchor.y) / 2) * size.height
    label.style.transform = `translate(-50%, calc(-100% - 12px)) translate(${x}px, ${y}px)`
    label.style.opacity = '1'
  })
  return null
}
