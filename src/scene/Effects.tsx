import { Bloom, EffectComposer, Outline, ToneMapping } from '@react-three/postprocessing'
import { useCursor } from '@react-three/drei'
import { ToneMappingMode } from 'postprocessing'
import { useMemo } from 'react'
import { useSceneStore } from '../state/sceneStore'
import { meshesOf, useCatalogRegistry } from './catalogRegistry'

/**
 * Post-procesado de la escena nocturna.
 * - Outline: contorno blanco del objeto bajo el puntero (como el showroom de referencia).
 *   Envuelve TODAS las mallas del objeto, no solo la pieza que tocó el rayo.
 * - Bloom selectivo POR BRILLO: solo lo que supera el umbral (pantallas, zonas pegadas a los LED)
 *   "sangra" luz sobre su entorno, como en una cámara real. mipmapBlur da un halo amplio y barato.
 * - ToneMapping AgX al final: con un EffectComposer el tone mapping se hace aquí (no en el renderer),
 *   después del bloom, para que el halo se calcule con los valores de luz reales (HDR).
 */
export function Effects() {
  const hoveredId = useSceneStore((s) => s.hoveredId)
  const roots = useCatalogRegistry((s) => s.roots)
  const selection = useMemo(() => (hoveredId ? meshesOf(roots.get(hoveredId)) : []), [hoveredId, roots])
  useCursor(hoveredId !== null) // cursor de "mano" sobre un objeto seleccionable

  return (
    <EffectComposer autoClear={false}>
      <Bloom mipmapBlur luminanceThreshold={0.6} luminanceSmoothing={0.25} intensity={1.4} radius={0.75} />
      <Outline
        selection={selection}
        visibleEdgeColor={0xffffff}
        hiddenEdgeColor={0xffffff}
        edgeStrength={4}
        width={1200}
        blur
      />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}
