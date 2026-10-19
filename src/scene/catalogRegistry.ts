import type { Mesh, Object3D } from 'three'
import { create } from 'zustand'

/**
 * Nodos raíz de cada objeto del catálogo en la escena cargada (los llena <Room> con bindCatalog).
 * Lo usan el contorno (necesita TODAS las mallas del objeto), el tooltip y la cámara.
 */
interface CatalogRegistry {
  roots: Map<string, Object3D>
  setRoots: (roots: Map<string, Object3D>) => void
}

export const useCatalogRegistry = create<CatalogRegistry>()((set) => ({
  roots: new Map(),
  setRoots: (roots) => set({ roots }),
}))

/** Todas las mallas de un objeto (para el contorno). */
export function meshesOf(root: Object3D | undefined): Mesh[] {
  const meshes: Mesh[] = []
  root?.traverse((object) => {
    if ((object as Mesh).isMesh) meshes.push(object as Mesh)
  })
  return meshes
}
