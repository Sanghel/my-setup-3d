import { Environment, Lightformer } from '@react-three/drei'

/**
 * Environment map nocturno generado en el navegador (sin descargar HDRIs): solo aporta REFLEJOS
 * en vidrio, pantallas y metal. La luz difusa ya viene horneada en el lightmap.
 * Los "lightformers" imitan las fuentes reales: rojo (poster), ámbar (ultrawide), blanco (escritorio).
 */
export function NightEnvironment() {
  return (
    <Environment resolution={128} environmentIntensity={0.6}>
      <color attach="background" args={['#05060b']} />
      <Lightformer form="rect" color="#ff2a2a" intensity={2} scale={[2, 1, 1]} position={[-2, 1.5, -3]} />
      <Lightformer form="rect" color="#ffb347" intensity={1.5} scale={[2, 1, 1]} position={[2, 1.2, -3]} />
      <Lightformer form="rect" color="#fff4e8" intensity={1} scale={[3, 0.5, 1]} position={[0, -1, 2]} />
      <Lightformer form="rect" color="#7a7fd6" intensity={0.8} scale={[1, 2, 1]} position={[3, 1, 0]} />
    </Environment>
  )
}
