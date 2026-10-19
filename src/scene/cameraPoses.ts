import type CameraControlsImpl from 'camera-controls'
import { MathUtils } from 'three'
import overviewCamera from './overviewCamera.json'

const deg = MathUtils.degToRad

export const OVERVIEW_POSITION = overviewCamera.position as [number, number, number]
export const OVERVIEW_TARGET = overviewCamera.target as [number, number, number]

/** Aspecto (ancho/alto) con el que se encuadró la vista general en overviewCamera.json. */
export const OVERVIEW_REFERENCE_ASPECT = 1.3

/**
 * Cuánto alejar la cámara para que el diorama quepa a lo ancho. El FOV de three.js es vertical: en una
 * pantalla más angosta que la de referencia (un celular en vertical) se pierde ancho, así que la
 * distancia crece en la misma proporción en que se achica el aspecto. Nunca acerca.
 */
export function overviewDistanceScale(aspect: number) {
  return Math.max(1, OVERVIEW_REFERENCE_ASPECT / aspect)
}

/** Posición de la vista general para un aspecto dado: misma dirección, más lejos si hace falta. */
export function overviewPosition(aspect: number): [number, number, number] {
  const scale = overviewDistanceScale(aspect)
  return OVERVIEW_POSITION.map((p, i) => OVERVIEW_TARGET[i] + (p - OVERVIEW_TARGET[i]) * scale) as [
    number,
    number,
    number,
  ]
}

/** Límites de la vista general: la cámara queda en el cuadrante abierto del diorama (design D7/D13). */
export function applyOverviewLimits(controls: CameraControlsImpl, aspect = OVERVIEW_REFERENCE_ASPECT) {
  const { azimuthDeg, polarDeg } = overviewCamera.limits
  const scale = overviewDistanceScale(aspect)
  const distance = [overviewCamera.limits.distance[0], overviewCamera.limits.distance[1] * scale]
  controls.minAzimuthAngle = deg(azimuthDeg[0])
  controls.maxAzimuthAngle = deg(azimuthDeg[1])
  controls.minPolarAngle = deg(polarDeg[0]) // nunca cenital
  controls.maxPolarAngle = deg(polarDeg[1]) // nunca por debajo del horizonte del piso
  controls.minDistance = distance[0]
  controls.maxDistance = distance[1]
}

export interface InspectionPose {
  position: [number, number, number]
  target: [number, number, number]
  minDistance: number
  maxDistance: number
}

/**
 * Pose para inspeccionar un objeto: la esfera que lo envuelve debe caber en el campo de visión
 * (el menor entre el vertical y el horizontal, para que en pantallas verticales no se corte),
 * mirándolo desde el ángulo preferido del catálogo.
 */
export function inspectionPose(
  center: [number, number, number],
  radius: number,
  view: { azimuth: number; polar: number },
  fovDeg: number,
  aspect: number,
): InspectionPose {
  const vertical = deg(fovDeg)
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect)
  const fit = radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.08
  const az = deg(view.azimuth)
  const polar = deg(view.polar)
  // Coordenadas esféricas de camera-controls (Y arriba): azimut alrededor de Y desde +z, polar desde +Y
  const offset = [Math.sin(az) * Math.sin(polar), Math.cos(polar), Math.cos(az) * Math.sin(polar)]
  return {
    position: [center[0] + offset[0] * fit, center[1] + offset[1] * fit, center[2] + offset[2] * fit],
    target: center,
    minDistance: radius * 1.3, // nunca atravesar el objeto
    maxDistance: fit * 2.2,
  }
}

/** Fracción inferior de la pantalla que tapa el panel de detalles en móvil (max-height: 46dvh en ui.css). */
export const MOBILE_SHEET = 0.46
export const isNarrowScreen = (width: number) => width <= 640

/**
 * Encuadre de inspección cuando la parte de abajo de la pantalla está tapada por un panel: el objeto
 * debe caber y centrarse en la parte visible. Devuelve el FOV y el aspecto de esa zona, y cuánto
 * subir el objeto en pantalla (focal offset de camera-controls, en metros a la distancia dada).
 */
export function visibleArea(fovDeg: number, aspect: number, covered: number) {
  const visible = 1 - covered
  const fov = MathUtils.radToDeg(2 * Math.atan(Math.tan(deg(fovDeg) / 2) * visible))
  return {
    fovDeg: fov,
    aspect: aspect / visible,
    /** Focal offset vertical a una distancia `d` (en camera-controls, positivo = el objeto sube en pantalla). */
    offsetAt: (d: number) => (covered / 2) * 2 * d * Math.tan(deg(fovDeg) / 2),
  }
}

/** Límites de órbita al inspeccionar: el rango de azimut del objeto y un polar amplio. */
export function applyInspectionLimits(
  controls: CameraControlsImpl,
  pose: InspectionPose,
  azimuthRange: [number, number],
) {
  controls.minAzimuthAngle = deg(azimuthRange[0])
  controls.maxAzimuthAngle = deg(azimuthRange[1])
  controls.minPolarAngle = deg(20)
  controls.maxPolarAngle = deg(100)
  controls.minDistance = pose.minDistance
  controls.maxDistance = pose.maxDistance
}
