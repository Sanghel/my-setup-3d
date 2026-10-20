import { useSceneStore } from '../state/sceneStore'

/** Título del sitio (arriba a la izquierda), como en el mock. */
export function Brand() {
  return (
    <header className="brand">
      <h1 className="brand__title">Mi setup</h1>
      <p className="brand__subtitle">ESCRITORIO · COLECCIÓN UNITED</p>
    </header>
  )
}

/** Ayuda de la vista general (abajo al centro); se oculta al inspeccionar. */
export function Hint() {
  const inspecting = useSceneStore((s) => s.mode === 'inspecting')
  return (
    <p className={`hint${inspecting ? ' hint--off' : ''}`} aria-hidden={inspecting}>
      Toca un objeto o un punto para ver el detalle
    </p>
  )
}
