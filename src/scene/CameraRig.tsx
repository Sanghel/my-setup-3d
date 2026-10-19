import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { Box3, MathUtils, Sphere, Vector3, type PerspectiveCamera } from 'three'
import { itemById } from '../data/items'
import { useSceneStore } from '../state/sceneStore'
import {
  applyInspectionLimits,
  applyOverviewLimits,
  inspectionPose,
  inspectionLayout,
  overviewPosition,
  OVERVIEW_TARGET,
} from './cameraPoses'
import { useCatalogRegistry } from './catalogRegistry'
import { useReducedMotion } from '../ui/useReducedMotion'
import { intro } from './ambience'
import {
  flightPose,
  FLY_IN_SECONDS,
  FLY_OUT_SECONDS,
  INTRO_SECONDS,
  introStart,
  type Flight,
  type Vec3,
} from './cameraTween'

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
  const flight = useRef<ActiveFlight | null>(null)
  const introDone = useRef(false)
  const reducedMotion = useReducedMotion()
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

  // Desplazamiento de la imagen (px), animado: se acerca al objetivo con damp, como en el mock
  const viewOffset = useRef({ x: 0, y: 0 })
  useFrame(({ size: { width, height } }, delta) => {
    const inspecting = useSceneStore.getState().mode === 'inspecting'
    const goal = inspecting ? inspectionLayout(camera.fov, width, height).offset : { x: 0, y: 0 }
    const current = viewOffset.current
    current.x = MathUtils.damp(current.x, goal.x, 4.2, delta)
    current.y = MathUtils.damp(current.y, goal.y, 4.2, delta)
    if (Math.abs(current.x) > 0.5 || Math.abs(current.y) > 0.5) camera.setViewOffset(width, height, current.x, current.y, width, height)
    else if (camera.view?.enabled) camera.clearViewOffset()
  })

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
    const aspect = size.width / size.height
    const overview = { position: overviewPosition(aspect), target: OVERVIEW_TARGET }

    // Entrada (redesign D6): mientras el cuarto carga, la cámara espera lejos (y la imagen en negro);
    // cuando el catálogo ya está unido a la escena, vuela 2,6 s a la vista general.
    if (!introDone.current) {
      if (roots.size === 0) {
        void controls.setLookAt(...introStart(overview.position, overview.target), ...overview.target, false)
        return
      }
      introDone.current = true
      if (reducedMotion) {
        intro.elapsed = Infinity // exposición normal de una vez
        flyTo(controls, overview, 0, () => applyOverviewLimits(controls, aspect), false)
      } else {
        intro.elapsed = 0
        flyTo(controls, overview, INTRO_SECONDS, () => applyOverviewLimits(controls, aspect), true)
      }
      return
    }
    const animate = !reducedMotion

    const item = selectedId ? itemById(selectedId) : undefined
    const root = selectedId ? roots.get(selectedId) : undefined
    if (mode === 'inspecting' && item && root) {
      const sphere = new Box3().setFromObject(root).getBoundingSphere(new Sphere())
      // El panel tapa una parte de la pantalla: encuadrar en la zona libre (el view offset corre la imagen)
      const layout = inspectionLayout(camera.fov, size.width, size.height)
      const pose = inspectionPose(sphere.center.toArray(), sphere.radius, item.view, layout.fovDeg, layout.aspect)
      flyTo(controls, pose, FLY_IN_SECONDS, () => applyInspectionLimits(controls, pose, item.view.azimuthRange), animate)
    } else {
      flyTo(controls, overview, FLY_OUT_SECONDS, () => applyOverviewLimits(controls, aspect), animate)
    }
    // size: al girar el celular cambia el aspecto y el encuadre se recalcula
  }, [mode, selectedId, roots, camera, size, reducedMotion])

  return <CameraControls ref={ref} makeDefault smoothTime={0.5} />
}
