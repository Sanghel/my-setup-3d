import { useSceneStore } from '../state/sceneStore'

/** Volver a la vista general (spec item-inspection: "Salir del modo inspección"). La tecla Esc la maneja useKeyboardShortcuts. */
export function BackButton() {
  const exit = useSceneStore((s) => s.exit)

  return (
    <button type="button" className="back-button" onClick={exit}>
      <span aria-hidden="true">←</span> Volver <kbd>Esc</kbd>
    </button>
  )
}
