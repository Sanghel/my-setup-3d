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
import { AmbienceEnvironments } from './scene/AmbienceEnvironments'
import { Room } from './scene/Room'
import { useSceneStore } from './state/sceneStore'
import { LoadError } from './ui/LoadError'
import { Backdrop } from './ui/Backdrop'
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
      <Backdrop />
      <Canvas
        onPointerDown={onPointerDown}
        onPointerMissed={onPointerMissed}
        // La exposición la anima <AmbienceDriver> según el ambiente; la curva AgX la aplica <Effects>.
        // Sin color de fondo: el canvas es transparente y detrás va el gradiente del ambiente (<Backdrop>)
        gl={{ toneMapping: AgXToneMapping }}
        camera={{
          position: overviewCamera.position as [number, number, number],
          fov: overviewCamera.fov,
          near: 0.01,
        }}
      >
        {/* Sin luces en tiempo real: toda la luz difusa está horneada en el lightmap */}
        <AmbienceEnvironments />
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
