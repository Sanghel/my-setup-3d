import { Scene } from 'three'

/**
 * Escena "de mentira" donde <NightEnvironment> deja su environment map (environmentTarget.environment).
 * No se usa scene.environment de la escena real porque, con él, three.js ignora el envMapIntensity de
 * cada material (WebGLRenderer usa scene.environmentIntensity cuando material.envMap es null) y el
 * atenuado no podría bajarlo. Cada material recibe el mapa como envMap propio (useDimming).
 */
export const environmentTarget = new Scene()
