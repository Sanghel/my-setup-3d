import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { AgXToneMapping } from 'three'
import { DevStatsLabel, DevStatsProbe } from './dev/DevStats'
import './dev/exposeStore'
import overviewCamera from './scene/overviewCamera.json'
import { AmbienceDriver } from './scene/AmbienceDriver'
import { CameraRig } from './scene/CameraRig'
import { Effects } from './scene/Effects'
import { HoverTooltip, TooltipProbe } from './scene/HoverTooltip'
import { NightEnvironment } from './scene/NightEnvironment'
import { Room } from './scene/Room'
import { useSceneStore } from './state/sceneStore'
import { LoadError } from './ui/LoadError'
import { Overlay } from './ui/Overlay'

/** Desplazamiento máximo (px) para que un click en el vacío cuente como click y no como arrastre. */
const DRAG_THRESHOLD_PX = 6

export default function App() {
  // Click en el fondo vacío → salir de la inspección. onPointerMissed también se dispara al terminar un
  // arrastre (orbitar), así que se compara dónde se presionó y dónde se soltó.
  const down = useRef<[number, number]>([0, 0])
  const onPointerDown = (event: React.PointerEvent) => {
    down.current = [event.clientX, event.clientY]
  }
  const onPointerMissed = (event: MouseEvent) => {
    const moved = Math.hypot(event.clientX - down.current[0], event.clientY - down.current[1])
    if (moved <= DRAG_THRESHOLD_PX) useSceneStore.getState().exit()
  }

  return (
    <LoadError>
      <Canvas
        onPointerDown={onPointerDown}
        onPointerMissed={onPointerMissed}
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
        <AmbienceDriver />
        <Effects />
        <TooltipProbe />
        {/* Suspense: mientras el .glb se descarga no se dibuja nada; el porcentaje lo muestra <Loader> */}
        <Suspense fallback={null}>
          <Room />
        </Suspense>
        {import.meta.env.DEV && <DevStatsProbe />}
        <CameraRig />
      </Canvas>
      <HoverTooltip />
      <Overlay />
      {import.meta.env.DEV && <DevStatsLabel />}
    </LoadError>
  )
}
