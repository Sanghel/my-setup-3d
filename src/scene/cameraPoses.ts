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
