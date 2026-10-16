import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { DevStatsLabel, DevStatsProbe } from './dev/DevStats'
import { Lights } from './scene/Lights'
import { Room } from './scene/Room'
import { Setup } from './scene/Setup'

export default function App() {
  return (
    <>
      <Canvas camera={{ position: [0.4, 1.55, 2.7], fov: 50, near: 0.01 }}>
        <color attach="background" args={['#120c0c']} />
        <Lights />
        <Room />
        <Setup />
        {import.meta.env.DEV && <DevStatsProbe />}
        {/* makeDefault: otros componentes de drei pueden encontrar estos controles.
            Límites temporales; los del cuarto llegan con el CameraRig (tarea 7.1) */}
        <CameraControls
          makeDefault
          minDistance={0.4}
          maxDistance={3.5}
          ref={(controls) => {
            void controls?.setTarget(1.6, 0.9, 0.4)
          }}
        />
      </Canvas>
      {import.meta.env.DEV && <DevStatsLabel />}
    </>
  )
}
