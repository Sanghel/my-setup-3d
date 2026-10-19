import { useSceneStore } from '../state/sceneStore'
import { AmbienceToggle } from './AmbienceToggle'

/**
 * Barra inferior del mock: selector Tarde / Noche y "Vista general" (vuelve de la inspección, igual que
 * Esc o "Volver"). En celular se esconde mientras la hoja de detalle ocupa la parte de abajo.
 */
export function BottomBar() {
  const inspecting = useSceneStore((s) => s.mode === 'inspecting')
  const exit = useSceneStore((s) => s.exit)
  return (
    <div className={`bottom-bar${inspecting ? ' bottom-bar--inspecting' : ''}`}>
      <AmbienceToggle />
      <button type="button" className="pill" onClick={exit}>
        Vista general
      </button>
    </div>
  )
}
