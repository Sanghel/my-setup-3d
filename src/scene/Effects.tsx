import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/**
 * Post-procesado de la escena nocturna.
 * - Bloom selectivo POR BRILLO: solo lo que supera el umbral (pantallas, zonas pegadas a los LED)
 *   "sangra" luz sobre su entorno, como en una cámara real. mipmapBlur da un halo amplio y barato.
 * - ToneMapping AgX al final: con un EffectComposer el tone mapping se hace aquí (no en el renderer),
 *   después del bloom, para que el halo se calcule con los valores de luz reales (HDR).
 */
export function Effects() {
  return (
    <EffectComposer>
      <Bloom mipmapBlur luminanceThreshold={0.6} luminanceSmoothing={0.25} intensity={1.4} radius={0.75} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}
