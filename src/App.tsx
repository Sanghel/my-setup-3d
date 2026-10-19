import { Suspense } from 'react'
import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { AgXToneMapping } from 'three'
import { DevStatsLabel, DevStatsProbe } from './dev/DevStats'
import './dev/exposeStore'
import overviewCamera from './scene/overviewCamera.json'
import { Effects } from './scene/Effects'
import { HoverTooltip, TooltipProbe } from './scene/HoverTooltip'
import { NightEnvironment } from './scene/NightEnvironment'
import { Room } from './scene/Room'

export default function App() {
  return (
    <>
      <Canvas
        // Exposición de Blender (+1,3 pasos). La curva AgX la aplica <Effects> al final del post-procesado
        gl={{ toneMapping: AgXToneMapping, toneMappingExposure: 2 ** 1.3 }}
        camera={{
          position: overviewCamera.position as [number, number, number],
          fov: overviewCamera.fov,
          near: 0.01,
        }}
      >
        <color attach="background" args={[overviewCamera.background]} />
        {/* Sin luces en tiempo real: toda la luz difusa está horneada en el lightmap */}
        <NightEnvironment />
        <Effects />
        <TooltipProbe />
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
      <HoverTooltip />
      {import.meta.env.DEV && <DevStatsLabel />}
    </>
  )
}
