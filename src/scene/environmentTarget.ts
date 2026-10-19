import { Scene } from 'three'

/**
 * Escena "de mentira" donde <NightEnvironment> deja su environment map (environmentTarget.environment).
 * No se usa scene.environment de la escena real porque three.js lo aplica a TODOS los materiales
 * estándar como luz difusa e ignora su envMapIntensity (WebGLRenderer usa scene.environmentIntensity
 * cuando material.envMap es null). Así, solo los materiales que reflejan reciben el mapa como envMap propio.
 */
export const environmentTarget = new Scene()
