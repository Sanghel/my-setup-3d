import type { Object3D } from 'three'
import type { Item } from '../data/items'

export interface CatalogBinding {
  /** Nodo raíz de cada objeto del catálogo encontrado en la escena, por id. */
  roots: Map<string, Object3D>
  /** Ids del catálogo cuyo nodo no está en la escena. */
  missing: string[]
}

/**
 * Une el catálogo con la escena cargada del .glb: busca el nodo de cada objeto y marca todas sus
 * piezas con `userData.itemId`. Así, al tocar cualquier pieza (una tecla, la base del monitor) se
 * sabe a qué objeto pertenece. Los nodos que no están en el catálogo quedan sin marcar: no interactivos.
 */
export function bindCatalog(scene: Object3D, items: readonly Item[]): CatalogBinding {
  const roots = new Map<string, Object3D>()
  const missing: string[] = []
  for (const item of items) {
    const root = scene.getObjectByName(item.node)
    if (!root) {
      missing.push(item.id)
      continue
    }
    root.traverse((object) => {
      object.userData.itemId = item.id
    })
    roots.set(item.id, root)
  }
  return { roots, missing }
}

/** El objeto del catálogo al que pertenece una pieza (o undefined si no es interactiva). */
export const itemIdOf = (object: Object3D | null | undefined): string | undefined =>
  object?.userData.itemId as string | undefined
