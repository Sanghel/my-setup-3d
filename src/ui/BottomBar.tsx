import { useSceneStore } from '../state/sceneStore'
import { AmbienceToggle } from './AmbienceToggle'

/**
 * Barra inferior: selector Tarde / Noche y el botón de los puntos (tecla H). Para salir de la inspección
 * quedan "Volver", Esc y el click en el fondo (ajustes visuales 3 quitó "Vista general", que repetía
 * "Volver"). En celular se esconde mientras la hoja de detalle ocupa la parte de abajo.
 */
export function BottomBar() {
  const inspecting = useSceneStore((s) => s.mode === 'inspecting')
  const hotspotsVisible = useSceneStore((s) => s.hotspotsVisible)
  const toggleHotspots = useSceneStore((s) => s.toggleHotspots)
  return (
    <div className={`bottom-bar${inspecting ? ' bottom-bar--inspecting' : ''}`}>
      <AmbienceToggle />
      <button type="button" className="pill" aria-pressed={!hotspotsVisible} onClick={toggleHotspots}>
        {hotspotsVisible ? 'Ocultar puntos' : 'Mostrar puntos'} <kbd>H</kbd>
      </button>
    </div>
  )
}
