import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { Box3, Sphere, Vector3, type PerspectiveCamera } from 'three'
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
import { flightPose, FLY_IN_SECONDS, FLY_OUT_SECONDS, type Flight, type Vec3 } from './cameraTween'

/**
 * Cámara de la escena (design D7).
 * - Vista general: orbita dentro de límites que mantienen las dos paredes al fondo. Sin "truck"
 *   (desplazar): el diorama siempre queda centrado.
 * - Inspección: vuela al objeto y orbita alrededor de su centro. "Rotar el objeto" = orbitar la
 *   cámara: los objetos no se mueven porque su luz está horneada.
 * - Vuelos (redesign D6): interpolación propia con el easing cúbico del mock, no el resorte de
 *   camera-controls. Durante el vuelo los límites se aflojan (si no, camera-controls recortaría la
 *   trayectoria a mitad de camino) y los del destino se aplican al llegar. Si el usuario presiona el
 *   puntero a mitad de camino, el vuelo se corta y manda el usuario.
 */
type ActiveFlight = Flight & { finish: () => void }

function relaxLimits(controls: CameraControlsImpl) {
  controls.minAzimuthAngle = -Infinity
  controls.maxAzimuthAngle = Infinity
  controls.minPolarAngle = 0
  controls.maxPolarAngle = Math.PI
  controls.minDistance = 0
  controls.maxDistance = Infinity
}

function currentPose(controls: CameraControlsImpl) {
  return {
    position: controls.getPosition(new Vector3()).toArray() as Vec3,
    target: controls.getTarget(new Vector3()).toArray() as Vec3,
  }
}
export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null)
  const firstRun = useRef(true)
  const flight = useRef<ActiveFlight | null>(null)
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
    // El usuario toma el control a mitad de un vuelo: se corta y se aplican los límites del destino
    const interrupt = () => {
      const active = flight.current
      flight.current = null
      active?.finish()
    }
    controls.addEventListener('controlstart', interrupt)
    return () => controls.removeEventListener('controlstart', interrupt)
  }, [])

  useFrame((_, delta) => {
    const controls = ref.current
    const active = flight.current
    if (!controls || !active) return
    active.elapsed += delta
    const pose = flightPose(active)
    void controls.setLookAt(...pose.position, ...pose.target, false)
    if (pose.done) {
      flight.current = null
      active.finish()
    }
  })

  /** Vuela (o salta, en el primer cuadro) a una pose y al final aplica sus límites. */
  const flyTo = (
    controls: CameraControlsImpl,
    to: { position: Vec3; target: Vec3 },
    seconds: number,
    applyLimits: () => void,
    animate: boolean,
  ) => {
    if (!animate) {
      applyLimits()
      void controls.setLookAt(...to.position, ...to.target, false)
      return
    }
    relaxLimits(controls)
    flight.current = { from: currentPose(controls), to, seconds, elapsed: 0, finish: applyLimits }
  }

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
      void controls.setFocalOffset(0, area.offsetAt(distance), 0, animate)
      flyTo(controls, pose, FLY_IN_SECONDS, () => applyInspectionLimits(controls, pose, item.view.azimuthRange), animate)
    } else {
      const aspect = size.width / size.height
      void controls.setFocalOffset(0, 0, 0, animate)
      const to = { position: overviewPosition(aspect), target: OVERVIEW_TARGET }
      flyTo(controls, to, FLY_OUT_SECONDS, () => applyOverviewLimits(controls, aspect), animate)
    }
    // size: al girar el celular cambia el aspecto y el encuadre se recalcula
  }, [mode, selectedId, roots, camera, size])

  return <CameraControls ref={ref} makeDefault smoothTime={0.5} />
}
