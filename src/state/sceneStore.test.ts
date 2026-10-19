import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, transitions, useSceneStore, type SceneState } from './sceneStore'

const state = (patch: Partial<SceneState> = {}): SceneState => ({ ...initialState, ...patch })
const apply = (s: SceneState, patch: Partial<SceneState>): SceneState => ({ ...s, ...patch })

describe('transiciones (diagrama D8)', () => {
  it('overview --hover(id)--> overview + hoveredId', () => {
    expect(apply(state(), transitions.hover(state(), 'keyboard'))).toEqual(state({ hoveredId: 'keyboard' }))
  })

  it('hover(null) quita el resaltado', () => {
    const s = state({ hoveredId: 'keyboard' })
    expect(apply(s, transitions.hover(s, null)).hoveredId).toBeNull()
  })

  it('overview --select(id)--> inspecting(id) y limpia el hover', () => {
    const s = state({ hoveredId: 'keyboard' })
    expect(apply(s, transitions.select(s, 'keyboard'))).toEqual(
      state({ mode: 'inspecting', selectedId: 'keyboard', hoveredId: null }),
    )
  })

  it('en inspección, el hover de otros objetos se ignora', () => {
    const s = state({ mode: 'inspecting', selectedId: 'keyboard' })
    expect(transitions.hover(s, 'desk')).toEqual({})
  })

  it('inspecting(a) --select(b)--> inspecting(b) sin pasar por la vista general', () => {
    const s = state({ mode: 'inspecting', selectedId: 'keyboard' })
    expect(apply(s, transitions.select(s, 'ultrawide'))).toEqual(
      state({ mode: 'inspecting', selectedId: 'ultrawide' }),
    )
  })

  it('seleccionar el mismo objeto en inspección no cambia nada', () => {
    const s = state({ mode: 'inspecting', selectedId: 'keyboard' })
    expect(transitions.select(s, 'keyboard')).toEqual({})
  })

  it('inspecting --exit--> overview (todo limpio)', () => {
    const s = state({ mode: 'inspecting', selectedId: 'keyboard' })
    expect(apply(s, transitions.exit(s))).toEqual(initialState)
  })

  it('exit en la vista general no cambia nada', () => {
    expect(transitions.exit(state({ hoveredId: 'desk' }))).toEqual({})
  })
})

describe('anterior / siguiente', () => {
  const ids = ['a', 'b', 'c']
  it('siguiente y anterior recorren el catálogo en orden', () => {
    const s = state({ mode: 'inspecting', selectedId: 'b' })
    expect(transitions.step(s, 1, ids)).toEqual({ selectedId: 'c' })
    expect(transitions.step(s, -1, ids)).toEqual({ selectedId: 'a' })
  })

  it('da la vuelta en los extremos', () => {
    expect(transitions.step(state({ mode: 'inspecting', selectedId: 'c' }), 1, ids)).toEqual({ selectedId: 'a' })
    expect(transitions.step(state({ mode: 'inspecting', selectedId: 'a' }), -1, ids)).toEqual({ selectedId: 'c' })
  })

  it('en la vista general no hace nada', () => {
    expect(transitions.step(state(), 1, ids)).toEqual({})
  })

  it('por defecto usa el orden del catálogo: del último (poster) pasa al primero (desk)', () => {
    expect(transitions.step(state({ mode: 'inspecting', selectedId: 'poster' }), 1)).toEqual({ selectedId: 'desk' })
  })
})

describe('ambiente y puntos de interés', () => {
  it('arranca en tarde y con los puntos visibles', () => {
    expect(initialState).toMatchObject({ ambience: 'tarde', hotspotsVisible: true })
  })

  it('cambiar el ambiente no toca el modo ni el objeto inspeccionado', () => {
    const s = state({ mode: 'inspecting', selectedId: 'jersey-2008' })
    expect(apply(s, transitions.toggleAmbience(s))).toEqual({ ...s, ambience: 'noche' })
    expect(transitions.setAmbience(s, 'tarde')).toEqual({})
  })

  it('salir de la inspección conserva el ambiente y los puntos', () => {
    const s = state({ mode: 'inspecting', selectedId: 'desk', ambience: 'noche', hotspotsVisible: false })
    expect(apply(s, transitions.exit(s))).toEqual(state({ ambience: 'noche', hotspotsVisible: false }))
  })

  it('toggleHotspots alterna la visibilidad', () => {
    expect(transitions.toggleHotspots(state())).toEqual({ hotspotsVisible: false })
  })
})

describe('useSceneStore', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('recorre el ciclo completo hover → select → saltar → exit', () => {
    const { hover, select, exit } = useSceneStore.getState()
    hover('desk')
    expect(useSceneStore.getState().hoveredId).toBe('desk')
    select('desk')
    expect(useSceneStore.getState()).toMatchObject({ mode: 'inspecting', selectedId: 'desk', hoveredId: null })
    select('poster')
    expect(useSceneStore.getState().selectedId).toBe('poster')
    exit()
    expect(useSceneStore.getState()).toMatchObject(initialState)
  })
})
