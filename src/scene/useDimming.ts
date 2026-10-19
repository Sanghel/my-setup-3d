import { useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Mesh, type MeshStandardMaterial, type Object3D } from 'three'
import { useSceneStore } from '../state/sceneStore'
import { environmentTarget } from './environmentTarget'

/** Brillo de lo que NO se inspecciona (0–1) y qué tan rápido se llega (mayor = más rápido). */
const DIMMED = 0.25
const SPEED = 6

interface DimState {
  factor: number
  lightMap: number
  emissive: number
  env: number
}

/**
 * El environment map (NightEnvironment) es solo para REFLEJOS: lo reciben, como envMap propio, los
 * metales y los materiales oscuros sin textura (vidrio, pantallas). En el resto (paredes, piso, fotos)
 * la luz es solo la horneada. Ojo: la rugosidad no sirve como criterio (el poster es brillante pero claro).
 */
const reflective = (material: MeshStandardMaterial) =>
  material.metalness > 0.3 || (!material.map && material.color.getHSL({ h: 0, s: 0, l: 0 }).l < 0.08)

/** Intensidad de los reflejos del environment en los materiales que lo reciben. */
const ENV_INTENSITY = 0.6

export function useDimming(scene: Object3D) {
  // Cada objeto del catálogo recibe copias propias de sus materiales: si dos objetos comparten
  // uno (el marco negro de las dos camisetas), atenuar uno no debe apagar el otro.
  useLayoutEffect(() => {
    scene.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      if (mesh.userData.itemId) mesh.material = (mesh.material as MeshStandardMaterial).clone()
      const material = mesh.material as MeshStandardMaterial
      const env = reflective(material) ? ENV_INTENSITY : 0
      mesh.userData.dim = {
        factor: 1,
        lightMap: material.lightMapIntensity,
        emissive: material.emissiveIntensity,
        env,
      } satisfies DimState
    })
  }, [scene])

  useFrame((_, delta) => {
    const { mode, selectedId } = useSceneStore.getState()
    const environment = environmentTarget.environment
    scene.traverse((object) => {
      const mesh = object as Mesh
      const dim = mesh.userData.dim as DimState | undefined
      if (!mesh.isMesh || !dim) return
      const material = mesh.material as MeshStandardMaterial
      // El environment se genera en el primer cuadro: se asigna apenas existe
      if (dim.env > 0 && environment && material.envMap !== environment) {
        material.envMap = environment
        material.envMapIntensity = dim.env * dim.factor
        material.needsUpdate = true
      }
      const target = mode === 'inspecting' && mesh.userData.itemId !== selectedId ? DIMMED : 1
      if (Math.abs(dim.factor - target) < 0.001) return
      // damp: se acerca al objetivo de forma suave e independiente de los fps
      dim.factor = MathUtils.damp(dim.factor, target, SPEED, delta)
      material.lightMapIntensity = dim.lightMap * dim.factor
      material.emissiveIntensity = dim.emissive * dim.factor
      material.envMapIntensity = dim.env * dim.factor
    })
  })
}
