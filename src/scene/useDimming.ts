import { useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Mesh, type MeshStandardMaterial, type Object3D } from 'three'
import { useSceneStore } from '../state/sceneStore'

/** Brillo de lo que NO se inspecciona (0–1) y qué tan rápido se llega (mayor = más rápido). */
const DIMMED = 0.25
const SPEED = 6

interface DimState {
  factor: number
  lightMap: number
  emissive: number
}

/**
 * En inspección, el resto del cuarto se atenúa para que el objeto destaque (design D10).
 * Se baja la luz horneada (lightMapIntensity), la emisión (pantallas, ventana) y los reflejos,
 * de forma animada. No se usa transparencia: da artefactos de orden de dibujo.
 */
export function useDimming(scene: Object3D) {
  // Cada objeto del catálogo recibe copias propias de sus materiales: si dos objetos comparten
  // uno (el marco negro de las dos camisetas), atenuar uno no debe apagar el otro.
  useLayoutEffect(() => {
    scene.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      if (mesh.userData.itemId) mesh.material = (mesh.material as MeshStandardMaterial).clone()
      const material = mesh.material as MeshStandardMaterial
      mesh.userData.dim = {
        factor: 1,
        lightMap: material.lightMapIntensity,
        emissive: material.emissiveIntensity,
      } satisfies DimState
    })
  }, [scene])

  useFrame((_, delta) => {
    const { mode, selectedId } = useSceneStore.getState()
    scene.traverse((object) => {
      const mesh = object as Mesh
      const dim = mesh.userData.dim as DimState | undefined
      if (!mesh.isMesh || !dim) return
      const target = mode === 'inspecting' && mesh.userData.itemId !== selectedId ? DIMMED : 1
      if (Math.abs(dim.factor - target) < 0.001) return
      // damp: se acerca al objetivo de forma suave e independiente de los fps
      dim.factor = MathUtils.damp(dim.factor, target, SPEED, delta)
      const material = mesh.material as MeshStandardMaterial
      material.lightMapIntensity = dim.lightMap * dim.factor
      material.emissiveIntensity = dim.emissive * dim.factor
      material.envMapIntensity = dim.factor
    })
  })
}
