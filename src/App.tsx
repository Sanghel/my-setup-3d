import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AgXToneMapping } from 'three'
import { DevStatsLabel, DevStatsProbe } from './dev/DevStats'
import './dev/exposeStore'
import overviewCamera from './scene/overviewCamera.json'
import { CameraRig } from './scene/CameraRig'
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
        <CameraRig />
      </Canvas>
      <HoverTooltip />
      {import.meta.env.DEV && <DevStatsLabel />}
    </>
  )
}
