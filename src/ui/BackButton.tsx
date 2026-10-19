import { useEffect } from 'react'
import { useSceneStore } from '../state/sceneStore'

/** Volver a la vista general: botón visible + tecla Esc (spec item-inspection: "Salir del modo inspección"). */
export function BackButton() {
  const exit = useSceneStore((s) => s.exit)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [exit])

  return (
    <button type="button" className="back-button" onClick={exit}>
      <span aria-hidden="true">←</span> Volver <kbd>Esc</kbd>
    </button>
  )
}
