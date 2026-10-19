import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { Box3, Sphere, type PerspectiveCamera } from 'three'
import { itemById } from '../data/items'
import { useSceneStore } from '../state/sceneStore'
import {
  applyInspectionLimits,
  applyOverviewLimits,
  inspectionPose,
  isNarrowScreen,
  MOBILE_SHEET,
  overviewPosition,
  OVERVIEW_TARGET,
  visibleArea,
} from './cameraPoses'
import { useCatalogRegistry } from './catalogRegistry'

/**
 * Cámara de la escena (design D7).
 * - Vista general: orbita dentro de límites que mantienen las dos paredes al fondo. Sin "truck"
 *   (desplazar): el diorama siempre queda centrado.
 * - Inspección: vuela al objeto con una transición animada (interrumpible: si el usuario arrastra a
 *   mitad de camino, la animación se detiene y manda el usuario) y orbita alrededor de su centro.
 *   "Rotar el objeto" = orbitar la cámara: los objetos no se mueven porque su luz está horneada.
 */
export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null)
  const firstRun = useRef(true)
  const mode = useSceneStore((s) => s.mode)
  const selectedId = useSceneStore((s) => s.selectedId)
  const roots = useCatalogRegistry((s) => s.roots)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)

  useEffect(() => {
    const controls = ref.current
    if (!controls) return
    controls.mouseButtons.right = CameraControlsImpl.ACTION.NONE // sin desplazar con el botón derecho
    controls.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY // dos dedos solo hacen zoom
    if (import.meta.env.DEV) window.__controls = controls
  }, [])

  useEffect(() => {
    const controls = ref.current
    if (!controls) return
    const animate = !firstRun.current
    firstRun.current = false

    const item = selectedId ? itemById(selectedId) : undefined
    const root = selectedId ? roots.get(selectedId) : undefined
    if (mode === 'inspecting' && item && root) {
      const sphere = new Box3().setFromObject(root).getBoundingSphere(new Sphere())
      // En móvil el panel de detalles tapa la parte de abajo: encuadrar en la parte visible
      const covered = isNarrowScreen(size.width) ? MOBILE_SHEET : 0
      const area = visibleArea(camera.fov, size.width / size.height, covered)
      const pose = inspectionPose(sphere.center.toArray(), sphere.radius, item.view, area.fovDeg, area.aspect)
      const distance = Math.hypot(...pose.position.map((p, i) => p - pose.target[i]))
      // Primero los límites del objeto, después el vuelo (que ya cae dentro de ellos)
      applyInspectionLimits(controls, pose, item.view.azimuthRange)
      void controls.setFocalOffset(0, area.offsetAt(distance), 0, animate)
      void controls.setLookAt(...pose.position, ...pose.target, animate)
    } else {
      const aspect = size.width / size.height
      applyOverviewLimits(controls, aspect)
      void controls.setFocalOffset(0, 0, 0, animate)
      void controls.setLookAt(...overviewPosition(aspect), ...OVERVIEW_TARGET, animate)
    }
    // size: al girar el celular cambia el aspecto y el encuadre se recalcula
  }, [mode, selectedId, roots, camera, size])

  return <CameraControls ref={ref} makeDefault smoothTime={0.5} />
}
