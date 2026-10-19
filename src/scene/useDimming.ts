import { useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Mesh, type MeshStandardMaterial, type Object3D } from 'three'
import { useSceneStore } from '../state/sceneStore'
import { ambienceUniforms } from './ambience'
import { environmentTargets } from './environmentTarget'

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
 * Relleno del environment (AmbienceEnvironments) sobre TODOS los materiales: además de los reflejos,
 * aporta una luz difusa suave y pareja que hace legibles las camisetas y tapa el ruido fino del
 * lightmap. Se asigna como envMap PROPIO de cada material (no como scene.environment), porque con
 * scene.environment three.js ignora envMapIntensity y el atenuado de la inspección no lo podría bajar.
 */
const ENV_INTENSITY = 0.6

export function useDimming(scene: Object3D) {
  // Cada objeto del catálogo recibe copias propias de sus materiales: si dos objetos comparten
  // uno (el marco negro de las dos camisetas), atenuar uno no debe apagar el otro.
  useLayoutEffect(() => {
    scene.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      if (mesh.userData.itemId) {
        const original = mesh.material as MeshStandardMaterial
        const copy = original.clone()
        // clone() no copia el parche del shader (mezcla de ambientes): se pasa a mano
        copy.onBeforeCompile = original.onBeforeCompile
        copy.customProgramCacheKey = original.customProgramCacheKey
        mesh.material = copy
      }
      const material = mesh.material as MeshStandardMaterial
      const env = ENV_INTENSITY
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
    // El environment del ambiente más cercano: cambia a mitad de la transición Tarde ⇄ Noche
    const environment = environmentTargets[ambienceUniforms.uAmbience.value < 0.5 ? 'tarde' : 'noche'].environment
    scene.traverse((object) => {
      const mesh = object as Mesh
      const dim = mesh.userData.dim as DimState | undefined
      if (!mesh.isMesh || !dim) return
      const material = mesh.material as MeshStandardMaterial
      // El environment se genera en el primer cuadro: se asigna apenas existe (y al cambiar de ambiente)
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
