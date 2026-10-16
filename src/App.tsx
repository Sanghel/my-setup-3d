import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { DevStatsLabel, DevStatsProbe } from './dev/DevStats'
import { VoxelObject } from './scene/VoxelObject'
import { TEST_MODEL } from './voxel/testModel'

export default function App() {
  return (
    <>
      <Canvas camera={{ position: [0.35, 0.3, 0.45], fov: 45, near: 0.01 }}>
        <color attach="background" args={['#120c0c']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 6, 3]} intensity={1.6} />
        <VoxelObject model={TEST_MODEL} />
        {import.meta.env.DEV && <DevStatsProbe />}
        {/* makeDefault: otros componentes de drei pueden encontrar estos controles.
            Límites temporales; los del cuarto llegan con el CameraRig (tarea 7.1) */}
        <CameraControls
          makeDefault
          minDistance={0.25}
          maxDistance={2}
          ref={(controls) => {
            void controls?.setTarget(0, 0.1, 0)
          }}
        />
      </Canvas>
      {import.meta.env.DEV && <DevStatsLabel />}
    </>
  )
}
