import type CameraControlsImpl from 'camera-controls'
import type { Object3D } from 'three'
import { useSceneStore } from '../state/sceneStore'

// Solo en desarrollo: inspeccionar el estado y la cámara desde la consola
// (window.__scene.getState(), window.__controls.azimuthAngle…).
declare global {
  interface Window {
    __scene?: typeof useSceneStore
    __controls?: CameraControlsImpl
    __room?: Object3D
  }
}

if (import.meta.env.DEV) window.__scene = useSceneStore
