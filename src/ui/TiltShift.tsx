import { useSceneStore } from '../state/sceneStore'

/**
 * Efecto maqueta (tilt-shift) del mock: franjas superior e inferior desenfocadas con backdrop-filter
 * y una máscara en degradado, así el centro queda nítido (spec room-scene: "Acabado de la presentación").
 * Se desvanecen en inspección. Es CSS sobre el canvas, más barato que un pase de post-procesado.
 */
export function TiltShift() {
  const inspecting = useSceneStore((s) => s.mode === 'inspecting')
  return (
    <div className={`tilt-shift${inspecting ? ' tilt-shift--off' : ''}`} aria-hidden="true">
      <div className="tilt-shift__band tilt-shift__band--top" />
      <div className="tilt-shift__band tilt-shift__band--bottom" />
    </div>
  )
}
