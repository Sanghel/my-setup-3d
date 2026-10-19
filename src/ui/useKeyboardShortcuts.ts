import { useEffect } from 'react'
import { useSceneStore } from '../state/sceneStore'

/** ¿El foco está en un campo donde el usuario escribe? Ahí los atajos no deben actuar. */
function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
}

/**
 * Atajos globales del mock: Esc (salir), N (tarde ⇄ noche), H (puntos), ←/→ (anterior/siguiente).
 * Se ignoran con Cmd/Ctrl/Alt (Cmd+N sigue abriendo una ventana) y mientras se escribe en un campo.
 */
export function handleShortcut(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return false
  const store = useSceneStore.getState()
  switch (event.key) {
    case 'Escape':
      store.exit()
      return true
    case 'n':
    case 'N':
      store.toggleAmbience()
      return true
    case 'h':
    case 'H':
      store.toggleHotspots()
      return true
    case 'ArrowRight':
      store.step(1)
      return store.mode === 'inspecting'
    case 'ArrowLeft':
      store.step(-1)
      return store.mode === 'inspecting'
    default:
      return false
  }
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])
}
