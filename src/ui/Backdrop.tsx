import { useSceneStore } from '../state/sceneStore'

/**
 * Fondo detrás del canvas transparente: los gradientes radiales del mock (cálido de tarde, violáceo
 * de noche), uno encima del otro; el de noche aparece con una transición de opacidad.
 */
export function Backdrop() {
  const ambience = useSceneStore((s) => s.ambience)
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__layer backdrop__layer--tarde" />
      <div className="backdrop__layer backdrop__layer--noche" style={{ opacity: ambience === 'noche' ? 1 : 0 }} />
    </div>
  )
}
