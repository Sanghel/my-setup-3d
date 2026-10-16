import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { TestCube } from './scene/TestCube'

export default function App() {
  return (
    <Canvas camera={{ position: [3, 2.5, 4], fov: 45 }}>
      <color attach="background" args={['#120c0c']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 3]} intensity={1.6} />
      <TestCube />
      {/* makeDefault: otros componentes de drei pueden encontrar estos controles.
          Límites temporales; los del cuarto llegan con el CameraRig (tarea 7.1) */}
      <CameraControls
        makeDefault
        minDistance={2}
        maxDistance={12}
        ref={(controls) => {
          void controls?.setTarget(0, 0.5, 0)
        }}
      />
    </Canvas>
  )
}
