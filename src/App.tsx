import { Suspense } from 'react'
import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { DevStatsLabel, DevStatsProbe } from './dev/DevStats'
import overviewCamera from './scene/overviewCamera.json'
import { Room } from './scene/Room'

export default function App() {
  return (
    <>
      <Canvas
        camera={{
          position: overviewCamera.position as [number, number, number],
          fov: overviewCamera.fov,
          near: 0.01,
        }}
      >
        <color attach="background" args={[overviewCamera.background]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[0.5, 2.3, 2.5]} intensity={1.6} />
        {/* Suspense: mientras el .glb se descarga no se dibuja nada (el loader real llega en 11.4) */}
        <Suspense fallback={null}>
          <Room />
        </Suspense>
        {import.meta.env.DEV && <DevStatsProbe />}
        {/* makeDefault: otros componentes de drei pueden encontrar estos controles.
            Límites temporales; los del cuarto llegan con el CameraRig (tarea 10.1) */}
        <CameraControls
          makeDefault
          minDistance={0.4}
          maxDistance={12}
          ref={(controls) => {
            void controls?.setTarget(...(overviewCamera.target as [number, number, number]))
          }}
        />
      </Canvas>
      {import.meta.env.DEV && <DevStatsLabel />}
    </>
  )
}
