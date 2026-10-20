import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { useThree } from '@react-three/fiber'
import { ToneMappingMode } from 'postprocessing'
import { useEffect } from 'react'
import { useSceneStore } from '../state/sceneStore'

/**
 * Post-procesado de la escena.
 * - (Sin contorno: desde el rediseño, el objeto bajo el puntero se marca con su punto de interés.)
 * - Bloom selectivo POR BRILLO: solo lo que supera el umbral (pantallas, zonas pegadas a los LED)
 *   "sangra" luz sobre su entorno, como en una cámara real. mipmapBlur da un halo amplio y barato.
 * - ToneMapping AgX al final: con un EffectComposer el tone mapping se hace aquí (no en el renderer),
 *   después del bloom, para que el halo se calcule con los valores de luz reales (HDR).
 */
export function Effects() {
  const hoveredId = useSceneStore((s) => s.hoveredId)
  // Cursor del canvas: mano de "click" sobre un objeto seleccionable; flecha normal en el resto
  // (la cámara no se arrastra: solo se mueve al elegir un objeto)
  const get = useThree((s) => s.get)
  useEffect(() => {
    get().gl.domElement.style.cursor = hoveredId !== null ? 'pointer' : 'default'
  }, [get, hoveredId])

  return (
    <EffectComposer autoClear={false}>
      <Bloom mipmapBlur luminanceThreshold={0.6} luminanceSmoothing={0.25} intensity={1.4} radius={0.75} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}
