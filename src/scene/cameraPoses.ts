import type CameraControlsImpl from 'camera-controls'
import { MathUtils } from 'three'
import overviewCamera from './overviewCamera.json'

const deg = MathUtils.degToRad

export const OVERVIEW_POSITION = overviewCamera.position as [number, number, number]
export const OVERVIEW_TARGET = overviewCamera.target as [number, number, number]

/** Límites de la vista general: la cámara queda en el cuadrante abierto del diorama (design D7/D13). */
export function applyOverviewLimits(controls: CameraControlsImpl) {
  const { azimuthDeg, polarDeg, distance } = overviewCamera.limits
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
