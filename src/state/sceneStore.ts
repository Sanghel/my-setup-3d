import { create } from 'zustand'
import { ITEMS } from '../data/items'

/**
 * Estado de la escena como una máquina de estados mínima (design D8):
 *
 *   overview ──hover(id)──▶ overview + hoveredId ──select(id)──▶ inspecting(id)
 *      ▲                                                          │   │ select(otro)
 *      └─────────────── exit() (Esc / botón / fondo) ─────────────┘   ▼
 *                                                             inspecting(otro)
 *
 * Además, independientes del modo: el ambiente (tarde ⇄ noche) y si los puntos de interés se ven.
 * Salir de la inspección no los toca. step(±1) recorre el catálogo en orden y da la vuelta.
 *
 * Las transiciones son funciones puras (estado → cambios) para testearlas sin React.
 */
export type Mode = 'overview' | 'inspecting'
export type Ambience = 'tarde' | 'noche'

export interface SceneState {
  mode: Mode
  hoveredId: string | null
  selectedId: string | null
  ambience: Ambience
  hotspotsVisible: boolean
}

export const initialState: SceneState = {
  mode: 'overview',
  hoveredId: null,
  selectedId: null,
  ambience: 'tarde',
  hotspotsVisible: true,
}

const ITEM_IDS = ITEMS.map((item) => item.id)

export const transitions = {
  /** Resaltar el objeto bajo el puntero. En inspección, los demás objetos no reaccionan. */
  hover(state: SceneState, id: string | null): Partial<SceneState> {
    if (state.mode === 'inspecting') return {}
    return state.hoveredId === id ? {} : { hoveredId: id }
  },
  /** Enfocar un objeto: desde la vista general o saltando directo desde otro objeto. */
  select(state: SceneState, id: string): Partial<SceneState> {
    if (state.mode === 'inspecting' && state.selectedId === id) return {}
    return { mode: 'inspecting', selectedId: id, hoveredId: null }
  },
  /** Volver a la vista general (el ambiente y los puntos quedan como estaban). */
  exit(state: SceneState): Partial<SceneState> {
    return state.mode === 'overview' ? {} : { mode: 'overview', selectedId: null, hoveredId: null }
  },
  /** Anterior (-1) / siguiente (+1) en el orden del catálogo, con vuelta. Solo en inspección. */
  step(state: SceneState, delta: number, ids: readonly string[] = ITEM_IDS): Partial<SceneState> {
    if (state.mode !== 'inspecting' || ids.length === 0) return {}
    const index = Math.max(0, ids.indexOf(state.selectedId ?? ''))
    const next = ids[(((index + delta) % ids.length) + ids.length) % ids.length]
    return next === state.selectedId ? {} : { selectedId: next }
  },
  toggleAmbience(state: SceneState): Partial<SceneState> {
    return { ambience: state.ambience === 'tarde' ? 'noche' : 'tarde' }
  },
  setAmbience(state: SceneState, ambience: Ambience): Partial<SceneState> {
    return state.ambience === ambience ? {} : { ambience }
  },
  toggleHotspots(state: SceneState): Partial<SceneState> {
    return { hotspotsVisible: !state.hotspotsVisible }
  },
}

interface SceneActions {
  hover: (id: string | null) => void
  select: (id: string) => void
  exit: () => void
  step: (delta: number) => void
  toggleAmbience: () => void
  setAmbience: (ambience: Ambience) => void
  toggleHotspots: () => void
}

export const useSceneStore = create<SceneState & SceneActions>()((set) => ({
  ...initialState,
  hover: (id) => set((state) => transitions.hover(state, id)),
  select: (id) => set((state) => transitions.select(state, id)),
  exit: () => set((state) => transitions.exit(state)),
  step: (delta) => set((state) => transitions.step(state, delta)),
  toggleAmbience: () => set((state) => transitions.toggleAmbience(state)),
  setAmbience: (ambience) => set((state) => transitions.setAmbience(state, ambience)),
  toggleHotspots: () => set((state) => transitions.toggleHotspots(state)),
}))
