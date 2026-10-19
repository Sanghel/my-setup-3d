import { useSceneStore } from '../state/sceneStore'

// Solo en desarrollo: permite inspeccionar el estado desde la consola (window.__scene.getState()).
declare global {
  interface Window {
    __scene?: typeof useSceneStore
  }
}

if (import.meta.env.DEV) window.__scene = useSceneStore
