import { Environment, Lightformer } from '@react-three/drei'
import { environmentTargets } from './environmentTarget'

/**
 * Environment maps generados en el navegador (sin descargar HDRIs), uno por ambiente: reflejos en
 * vidrio, pantallas y metal, y un relleno difuso suave sobre la luz horneada. Se generan sobre
 * `environmentTargets`, no sobre la escena real (ver environmentTarget.ts). Misma resolución en los
 * dos: cambiar de uno a otro no recompila shaders.
 * Los "lightformers" imitan las fuentes reales de cada ambiente.
 */
export function AmbienceEnvironments() {
  return (
    <>
      {/* Tarde: la ventana (cálida, fuerte) y un relleno crema de las paredes */}
      <Environment resolution={128} scene={environmentTargets.tarde}>
        <color attach="background" args={['#2a1d16']} />
        <Lightformer form="rect" color="#ffb067" intensity={3} scale={[1.2, 1.6, 1]} position={[3, 1.6, 0]} />
        <Lightformer form="rect" color="#f0e6da" intensity={0.8} scale={[4, 2, 1]} position={[0, 1.5, -3]} />
        <Lightformer form="rect" color="#ffe4c8" intensity={0.6} scale={[4, 1, 1]} position={[0, 3, 1]} />
      </Environment>
      {/* Noche: rojo (poster), ámbar (ultrawide), rosado (tira del escritorio, roja como el mock) y la ciudad */}
      <Environment resolution={128} scene={environmentTargets.noche}>
        <color attach="background" args={['#05060b']} />
        <Lightformer form="rect" color="#ff2a2a" intensity={2} scale={[2, 1, 1]} position={[-2, 1.5, -3]} />
        <Lightformer form="rect" color="#ffb347" intensity={1.5} scale={[2, 1, 1]} position={[2, 1.2, -3]} />
        <Lightformer form="rect" color="#ff4a5a" intensity={0.5} scale={[3, 0.5, 1]} position={[0, -1, 2]} />
        <Lightformer form="rect" color="#7a7fd6" intensity={0.8} scale={[1, 2, 1]} position={[3, 1, 0]} />
      </Environment>
    </>
  )
}
