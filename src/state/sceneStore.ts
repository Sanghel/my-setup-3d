import { create } from 'zustand'

/**
 * Estado de la escena como una máquina de estados mínima (design D8):
 *
 *   overview ──hover(id)──▶ overview + hoveredId ──select(id)──▶ inspecting(id)
 *      ▲                                                          │   │ select(otro)
 *      └─────────────── exit() (Esc / botón / fondo) ─────────────┘   ▼
 *                                                             inspecting(otro)
 *
 * Las transiciones son funciones puras (estado → cambios) para testearlas sin React.
 */
export type Mode = 'overview' | 'inspecting'

export interface SceneState {
  mode: Mode
  hoveredId: string | null
  selectedId: string | null
}

export const initialState: SceneState = { mode: 'overview', hoveredId: null, selectedId: null }

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
  /** Volver a la vista general. */
  exit(state: SceneState): Partial<SceneState> {
    return state.mode === 'overview' ? {} : { ...initialState }
  },
}

interface SceneActions {
  hover: (id: string | null) => void
  select: (id: string) => void
  exit: () => void
}

export const useSceneStore = create<SceneState & SceneActions>()((set) => ({
  ...initialState,
  hover: (id) => set((state) => transitions.hover(state, id)),
  select: (id) => set((state) => transitions.select(state, id)),
  exit: () => set((state) => transitions.exit(state)),
}))
