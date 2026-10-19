import { Scene } from 'three'
import type { Ambience } from '../state/sceneStore'

/**
 * Escenas "de mentira" donde <AmbienceEnvironments> deja un environment map por ambiente
 * (environmentTargets.tarde.environment, .noche.environment). No se usa scene.environment de la
 * escena real porque, con él, three.js ignora el envMapIntensity de cada material
 * (WebGLRenderer usa scene.environmentIntensity cuando material.envMap es null) y el atenuado no
 * podría bajarlo. Cada material recibe el mapa como envMap propio (useDimming).
 */
export const environmentTargets: Record<Ambience, Scene> = { tarde: new Scene(), noche: new Scene() }
