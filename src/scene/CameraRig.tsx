import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import CameraControlsImpl from 'camera-controls'
import { applyOverviewLimits, OVERVIEW_POSITION, OVERVIEW_TARGET } from './cameraPoses'

/**
 * Cámara de la escena. En la vista general orbita dentro de límites que mantienen las dos paredes
 * al fondo: nunca se ven por detrás ni el piso por debajo. Sin "truck" (desplazar): el diorama
 * siempre queda centrado.
 */
export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null)

  useEffect(() => {
    const controls = ref.current
    if (!controls) return
    applyOverviewLimits(controls)
    controls.mouseButtons.right = CameraControlsImpl.ACTION.NONE // sin desplazar con el botón derecho
    controls.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY // dos dedos solo hacen zoom
    void controls.setLookAt(...OVERVIEW_POSITION, ...OVERVIEW_TARGET, false)
    if (import.meta.env.DEV) window.__controls = controls
  }, [])

  return <CameraControls ref={ref} makeDefault smoothTime={0.35} />
}
